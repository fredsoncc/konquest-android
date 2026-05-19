/**
 * Konquest Multiplayer Client
 * Hook React para gerenciar a conexão WebSocket com o servidor de salas.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { GameState } from './game-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomPlayer {
  id: string;
  name: string;
  color: string;
  isReady: boolean;
  isConnected: boolean;
}

export type MultiplayerPhase =
  | 'idle'
  | 'connecting'
  | 'lobby'
  | 'playing'
  | 'finished';

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface MultiplayerState {
  phase: MultiplayerPhase;
  roomCode: string | null;
  myPlayerId: string | null;
  players: RoomPlayer[];
  gameState: GameState | null;
  chat: ChatMessage[];
  error: string | null;
  playersEndedTurn: Set<string>;
}

export interface MultiplayerActions {
  createRoom: (playerName: string, maxPlayers: number, totalPlanets: number, maxTurns: number) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  toggleReady: () => void;
  submitOrders: (orders: { sourceName: string; destName: string; ships: number }[]) => void;
  endTurn: () => void;
  sendChat: (message: string) => void;
  disconnect: () => void;
}

// ─── WebSocket URL ────────────────────────────────────────────────────────────

function getWsUrl(): string {
  // Em produção (APK), aponta para o servidor publicado.
  // O usuário pode sobrescrever via EXPO_PUBLIC_API_BASE_URL.
  const apiBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://conquestapp-ryo87qvt.manus.space';
  const wsBase = apiBase.replace(/^http/, 'ws');
  return `${wsBase}/ws/multiplayer`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const INITIAL_STATE: MultiplayerState = {
  phase: 'idle',
  roomCode: null,
  myPlayerId: null,
  players: [],
  gameState: null,
  chat: [],
  error: null,
  playersEndedTurn: new Set(),
};

export function useMultiplayer(
  onGameStarted?: (state: GameState, myPlayerId: string) => void,
  onTurnResult?: (state: GameState) => void,
  onGameOver?: (state: GameState, winner: string | null) => void,
) {
  const [mpState, setMpState] = useState<MultiplayerState>(INITIAL_STATE);
  const wsRef = useRef<WebSocket | null>(null);

  const updateState = useCallback((partial: Partial<MultiplayerState>) => {
    setMpState(prev => ({ ...prev, ...partial }));
  }, []);

  const sendMsg = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const connect = useCallback((onOpen: () => void) => {
    try {
      if (wsRef.current) wsRef.current.close();
    } catch {}
    updateState({ phase: 'connecting', error: null });

    let ws: WebSocket;
    try {
      ws = new WebSocket(getWsUrl());
    } catch (err: any) {
      updateState({ phase: 'idle', error: 'Não foi possível iniciar a conexão: ' + (err?.message ?? 'erro desconhecido') });
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      try { onOpen(); } catch (e) { console.error('onOpen error', e); }
    };

    ws.onmessage = (event) => {
      let msg: any;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case 'room_created':
          updateState({ phase: 'lobby', roomCode: msg.roomCode, myPlayerId: msg.playerId, players: msg.players ?? [] });
          break;
        case 'room_joined':
          updateState({ phase: 'lobby', roomCode: msg.roomCode, myPlayerId: msg.playerId, players: msg.players ?? [] });
          break;
        case 'player_joined':
        case 'player_left':
        case 'player_ready':
          updateState({ players: msg.players ?? [] });
          break;
        case 'game_started':
          updateState({ phase: 'playing', gameState: msg.state, myPlayerId: msg.yourPlayerId, playersEndedTurn: new Set() });
          onGameStarted?.(msg.state, msg.yourPlayerId);
          break;
        case 'orders_accepted':
          updateState({ gameState: msg.state });
          break;
        case 'player_ended_turn':
          setMpState(prev => ({ ...prev, playersEndedTurn: new Set([...prev.playersEndedTurn, msg.playerId]) }));
          break;
        case 'turn_result':
          updateState({ gameState: msg.state, playersEndedTurn: new Set() });
          onTurnResult?.(msg.state);
          break;
        case 'game_over':
          updateState({ phase: 'finished', gameState: msg.state });
          onGameOver?.(msg.state, msg.winner ?? null);
          break;
        case 'chat':
          setMpState(prev => ({
            ...prev,
            chat: [...prev.chat.slice(-99), { playerId: msg.playerId, playerName: msg.playerName, message: msg.message, timestamp: Date.now() }],
          }));
          break;
        case 'error':
          updateState({ error: msg.message });
          break;
      }
    };

    ws.onerror = () => updateState({ error: 'Erro de conexão com o servidor.' });
    ws.onclose = () => {
      setMpState(prev => {
        if (prev.phase === 'playing' || prev.phase === 'lobby') {
          return { ...prev, error: 'Conexão perdida com o servidor.' };
        }
        return prev;
      });
    };
  }, [updateState, onGameStarted, onTurnResult, onGameOver]);

  // Ping keepalive
  useEffect(() => {
    const interval = setInterval(() => sendMsg({ type: 'ping' }), 25000);
    return () => clearInterval(interval);
  }, [sendMsg]);

  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  const actions: MultiplayerActions = {
    createRoom: (playerName, maxPlayers, totalPlanets, maxTurns) =>
      connect(() => sendMsg({ type: 'create_room', playerName, maxPlayers, totalPlanets, maxTurns })),
    joinRoom: (roomCode, playerName) =>
      connect(() => sendMsg({ type: 'join_room', roomCode: roomCode.toUpperCase(), playerName })),
    toggleReady: () => sendMsg({ type: 'ready' }),
    submitOrders: (orders) => sendMsg({ type: 'submit_orders', orders }),
    endTurn: () => sendMsg({ type: 'end_turn' }),
    sendChat: (message) => sendMsg({ type: 'chat', message }),
    disconnect: () => { wsRef.current?.close(); setMpState(INITIAL_STATE); },
  };

  return { mpState, actions };
}
