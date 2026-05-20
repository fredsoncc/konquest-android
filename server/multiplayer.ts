/**
 * Konquest Multiplayer — WebSocket Room Server
 *
 * Protocolo de mensagens (JSON):
 *
 * Cliente → Servidor:
 *   { type: 'create_room', playerName: string, maxPlayers: number, totalPlanets: number, maxTurns: number }
 *   { type: 'join_room', roomCode: string, playerName: string }
 *   { type: 'ready' }
 *   { type: 'submit_orders', orders: AttackFleet[] }
 *   { type: 'end_turn' }
 *   { type: 'chat', message: string }
 *   { type: 'ping' }
 *
 * Servidor → Cliente:
 *   { type: 'room_created', roomCode: string, playerId: string, players: RoomPlayer[] }
 *   { type: 'room_joined', roomCode: string, playerId: string, players: RoomPlayer[] }
 *   { type: 'player_joined' | 'player_left' | 'player_ready', players: RoomPlayer[] }
 *   { type: 'game_started', state: GameState, yourPlayerId: string }
 *   { type: 'orders_accepted', state: GameState }
 *   { type: 'player_ended_turn', playerId: string }
 *   { type: 'turn_result', state: GameState }
 *   { type: 'game_over', state: GameState, winner: string | null }
 *   { type: 'chat', playerId: string, playerName: string, message: string }
 *   { type: 'error', message: string }
 *   { type: 'pong' }
 */

// `ws` é um pacote CommonJS — usar createRequire garante que o esbuild
// não converta para named ESM imports (que quebram no runtime Node.js).
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const WSPkg = _require('ws');
const WebSocketServer: any = WSPkg.WebSocketServer ?? WSPkg.Server;
const WebSocket: any = WSPkg.WebSocket ?? WSPkg;
import type * as WSTypes from 'ws';
type WebSocket = WSTypes.WebSocket;
import type { Server } from 'http';
import {
  createGame,
  endTurn,
  addOrder,
  type GameState,
  type AttackFleet,
  type PlayerDef,
} from '../lib/game-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  isReady: boolean;
  isConnected: boolean;
}

interface Room {
  code: string;
  hostId: string;
  players: Map<string, RoomPlayer>;
  sockets: Map<string, WebSocket>;
  maxPlayers: number;
  totalPlanets: number;
  maxTurns: number;
  state: 'waiting' | 'playing' | 'finished';
  gameState: GameState | null;
  turnEndedBy: Set<string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYER_COLORS = ['#ef5350', '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#26c6da'];

// ─── State ────────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();
const socketToRoom = new Map<WebSocket, string>();
const socketToPlayer = new Map<WebSocket, string>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function generatePlayerId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(room: Room, data: object, excludeId?: string) {
  for (const [pid, ws] of room.sockets) {
    if (pid !== excludeId) send(ws, data);
  }
}

function broadcastAll(room: Room, data: object) {
  broadcast(room, data);
}

function getRoomPlayers(room: Room): RoomPlayer[] {
  return Array.from(room.players.values());
}

function cleanupRoom(code: string) {
  const room = rooms.get(code);
  if (!room) return;
  for (const [, ws] of room.sockets) {
    socketToRoom.delete(ws);
    socketToPlayer.delete(ws);
  }
  rooms.delete(code);
}

// Auto-cleanup salas sem jogadores conectados
setInterval(() => {
  for (const [code, room] of rooms) {
    const hasConnected = Array.from(room.players.values()).some(p => p.isConnected);
    if (!hasConnected) cleanupRoom(code);
  }
}, 10 * 60 * 1000);

// ─── Game logic ───────────────────────────────────────────────────────────────

function startGame(room: Room) {
  const playerDefs: PlayerDef[] = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isAI: false,
  }));

  room.gameState = createGame(playerDefs, room.totalPlanets, { maxTurns: room.maxTurns });
  room.state = 'playing';
  room.turnEndedBy = new Set();

  for (const [pid, ws] of room.sockets) {
    send(ws, { type: 'game_started', state: room.gameState, yourPlayerId: pid });
  }
}

function processTurnIfReady(room: Room) {
  if (!room.gameState) return;

  const connectedPlayers = Array.from(room.players.values()).filter(p => p.isConnected);
  const allEnded = connectedPlayers.every(p => room.turnEndedBy.has(p.id));
  if (!allEnded) return;

  // Avançar o jogo: processar turno de cada jogador
  let state = room.gameState;
  let safetyCounter = 0;
  const startTurn = state.turn;

  // Avançar até o próximo turno completo
  while (state.turn === startTurn && !state.gameOver && safetyCounter < 20) {
    state = endTurn(state);
    safetyCounter++;
  }

  room.gameState = state;
  room.turnEndedBy = new Set();

  if (state.gameOver) {
    room.state = 'finished';
    broadcastAll(room, { type: 'game_over', state, winner: state.winner ?? null });
  } else {
    broadcastAll(room, { type: 'turn_result', state });
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, raw: string) {
  let msg: any;
  try { msg = JSON.parse(raw); } catch { send(ws, { type: 'error', message: 'JSON inválido' }); return; }

  const roomCode = socketToRoom.get(ws);
  const playerId = socketToPlayer.get(ws);
  const room = roomCode ? rooms.get(roomCode) : undefined;

  switch (msg.type) {

    case 'create_room': {
      const code = generateRoomCode();
      const pid = generatePlayerId();
      const newRoom: Room = {
        code, hostId: pid,
        players: new Map(), sockets: new Map(),
        maxPlayers: Math.min(Math.max(msg.maxPlayers ?? 4, 2), 6),
        totalPlanets: Math.min(Math.max(msg.totalPlanets ?? 20, 8), 50),
        maxTurns: Math.min(Math.max(msg.maxTurns ?? 40, 10), 100),
        state: 'waiting', gameState: null, turnEndedBy: new Set(),
      };
      const player: RoomPlayer = {
        id: pid, name: msg.playerName ?? 'Jogador 1',
        color: PLAYER_COLORS[0], isReady: false, isConnected: true,
      };
      newRoom.players.set(pid, player);
      newRoom.sockets.set(pid, ws);
      rooms.set(code, newRoom);
      socketToRoom.set(ws, code);
      socketToPlayer.set(ws, pid);
      send(ws, { type: 'room_created', roomCode: code, playerId: pid, players: getRoomPlayers(newRoom) });
      break;
    }

    case 'join_room': {
      const targetRoom = rooms.get(msg.roomCode?.toUpperCase());
      if (!targetRoom) { send(ws, { type: 'error', message: 'Sala não encontrada.' }); return; }
      if (targetRoom.state !== 'waiting') { send(ws, { type: 'error', message: 'Partida já iniciada.' }); return; }
      if (targetRoom.players.size >= targetRoom.maxPlayers) { send(ws, { type: 'error', message: 'Sala cheia.' }); return; }
      const pid = generatePlayerId();
      const color = PLAYER_COLORS[targetRoom.players.size % PLAYER_COLORS.length];
      const player: RoomPlayer = {
        id: pid, name: msg.playerName ?? `Jogador ${targetRoom.players.size + 1}`,
        color, isReady: false, isConnected: true,
      };
      targetRoom.players.set(pid, player);
      targetRoom.sockets.set(pid, ws);
      socketToRoom.set(ws, targetRoom.code);
      socketToPlayer.set(ws, pid);
      send(ws, { type: 'room_joined', roomCode: targetRoom.code, playerId: pid, players: getRoomPlayers(targetRoom) });
      broadcast(targetRoom, { type: 'player_joined', players: getRoomPlayers(targetRoom) }, pid);
      break;
    }

    case 'ready': {
      if (!room || !playerId) return;
      const player = room.players.get(playerId);
      if (!player) return;
      player.isReady = !player.isReady;
      broadcastAll(room, { type: 'player_ready', players: getRoomPlayers(room) });
      const allReady = Array.from(room.players.values()).every(p => p.isReady);
      if (allReady && room.players.size >= 2 && room.state === 'waiting') startGame(room);
      break;
    }

    case 'submit_orders': {
      if (!room || !playerId || !room.gameState) return;
      if (room.gameState.currentPlayerId !== playerId) {
        send(ws, { type: 'error', message: 'Não é sua vez.' }); return;
      }
      let state = room.gameState;
      const orders: AttackFleet[] = msg.orders ?? [];
      for (const order of orders) {
        try { state = addOrder(state, order.sourceName, order.destName, order.ships); } catch { /* ignora */ }
      }
      room.gameState = state;
      send(ws, { type: 'orders_accepted', state });
      break;
    }

    case 'end_turn': {
      if (!room || !playerId || !room.gameState) return;
      if (room.turnEndedBy.has(playerId)) return;
      room.turnEndedBy.add(playerId);
      broadcast(room, { type: 'player_ended_turn', playerId }, playerId);
      processTurnIfReady(room);
      break;
    }

    case 'chat': {
      if (!room || !playerId) return;
      const player = room.players.get(playerId);
      if (!player) return;
      broadcastAll(room, {
        type: 'chat', playerId,
        playerName: player.name,
        message: String(msg.message ?? '').slice(0, 200),
      });
      break;
    }

    case 'ping':
      send(ws, { type: 'pong' });
      break;

    default:
      send(ws, { type: 'error', message: `Tipo desconhecido: ${msg.type}` });
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export function registerMultiplayer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/multiplayer' });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (data: Buffer | string) => handleMessage(ws, data.toString()));

    ws.on('close', () => {
      const roomCode = socketToRoom.get(ws);
      const pid = socketToPlayer.get(ws);
      if (roomCode && pid) {
        const room = rooms.get(roomCode);
        if (room) {
          const player = room.players.get(pid);
          if (player) player.isConnected = false;
          room.sockets.delete(pid);
          broadcast(room, { type: 'player_left', players: getRoomPlayers(room) });
          if (room.state === 'playing' && !room.turnEndedBy.has(pid)) {
            room.turnEndedBy.add(pid);
            processTurnIfReady(room);
          }
        }
      }
      socketToRoom.delete(ws);
      socketToPlayer.delete(ws);
    });

    ws.on('error', () => ws.terminate());
  });

  console.log('[multiplayer] WebSocket server at /ws/multiplayer');
}
