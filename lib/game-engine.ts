/**
 * Konquest Game Engine
 * Porte fiel da lógica do Konquest KDE para TypeScript.
 * Baseado no código-fonte GPL-2.0+ de KDE/konquest.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlayerId = string;

export interface Coordinate {
  row: number;
  col: number;
}

export interface PlayerDef {
  id: PlayerId;
  name: string;
  color: string;
  isAI: boolean;
}

export interface Planet {
  name: string;
  coord: Coordinate;
  ownerId: PlayerId | null; // null = neutral
  ships: number;
  production: number;   // naves produzidas por turno
  killPercent: number;  // 0.30–0.90
  look: number;         // índice visual (0–8)
}

export interface AttackFleet {
  id: string;
  ownerId: PlayerId;
  sourceName: string;
  destName: string;
  ships: number;
  arrivalTurn: number;
}

export interface BattleResult {
  attackerName: string;
  defenderName: string;
  planetName: string;
  attackerShipsStart: number;
  defenderShipsStart: number;
  attackerShipsLeft: number;
  defenderShipsLeft: number;
  planetHeld: boolean; // true = defensor venceu
}

export interface TurnReport {
  turn: number;
  battles: BattleResult[];
  reinforcements: { planetName: string; ships: number }[];
  newOwners: { planetName: string; newOwnerId: PlayerId }[];
}

export interface GameOptions {
  blindMap: boolean;
  cumulativeProduction: boolean;
  productionAfterConquer: boolean;
  neutralsShowShips: boolean;
  neutralsProduction: number;
  maxTurns: number;
}

export interface GameState {
  planets: Record<string, Planet>;
  players: Record<PlayerId, PlayerDef>;
  fleets: AttackFleet[];
  turn: number;
  currentPlayerId: PlayerId;
  playerOrder: PlayerId[];
  options: GameOptions;
  winner: PlayerId | null;
  gameOver: boolean;
  pendingOrders: AttackFleet[]; // ordens do turno atual (ainda não confirmadas)
  lastReport: TurnReport | null;
  rows: number;
  cols: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLAYER_COLORS: string[] = [
  '#ef5350', // vermelho
  '#42a5f5', // azul
  '#66bb6a', // verde
  '#ffa726', // laranja
];

export const NEUTRAL_ID = 'neutral';

const PLANET_NAMES = [
  'A','B','C','D','E','F','G','H','I','J',
  'K','L','M','N','O','P','Q','R','S','T',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rng(): number {
  return Math.random();
}

function rngInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function distance(a: Planet, b: Planet): number {
  const dr = a.coord.row - b.coord.row;
  const dc = a.coord.col - b.coord.col;
  return Math.sqrt(dr * dr + dc * dc);
}

function fleetId(): string {
  return `fleet_${Date.now()}_${Math.floor(rng() * 100000)}`;
}

// ─── Map Generation ───────────────────────────────────────────────────────────

export function generateMap(
  rows: number,
  cols: number,
  numPlanets: number,
  players: PlayerDef[],
): { planets: Record<string, Planet> } {
  const planets: Record<string, Planet> = {};
  const occupied = new Set<string>();

  const coordKey = (r: number, c: number) => `${r},${c}`;

  // Assign one home planet per player
  for (let i = 0; i < players.length; i++) {
    let coord: Coordinate;
    do {
      coord = { row: rngInt(0, rows - 1), col: rngInt(0, cols - 1) };
    } while (occupied.has(coordKey(coord.row, coord.col)));
    occupied.add(coordKey(coord.row, coord.col));

    const name = PLANET_NAMES[i];
    planets[name] = {
      name,
      coord,
      ownerId: players[i].id,
      ships: 200,
      production: 10,
      killPercent: 0.5,
      look: rngInt(0, 8),
    };
  }

  // Fill remaining planets as neutral
  const neutralCount = numPlanets - players.length;
  for (let i = 0; i < neutralCount; i++) {
    let coord: Coordinate;
    do {
      coord = { row: rngInt(0, rows - 1), col: rngInt(0, cols - 1) };
    } while (occupied.has(coordKey(coord.row, coord.col)));
    occupied.add(coordKey(coord.row, coord.col));

    const name = PLANET_NAMES[players.length + i];
    planets[name] = {
      name,
      coord,
      ownerId: NEUTRAL_ID,
      ships: rngInt(0, 50),
      production: rngInt(5, 15),
      killPercent: 0.30 + rng() * 0.60,
      look: rngInt(0, 8),
    };
  }

  return { planets };
}

// ─── Game Initialization ──────────────────────────────────────────────────────

export function createGame(
  playerDefs: PlayerDef[],
  numPlanets: number,
  options: Partial<GameOptions> = {},
): GameState {
  const rows = 10;
  const cols = 10;

  const players: Record<PlayerId, PlayerDef> = {};
  for (const p of playerDefs) {
    players[p.id] = p;
  }
  // Add neutral player
  players[NEUTRAL_ID] = { id: NEUTRAL_ID, name: 'Neutro', color: '#78909c', isAI: false };

  const { planets } = generateMap(rows, cols, numPlanets, playerDefs);

  const defaultOptions: GameOptions = {
    blindMap: false,
    cumulativeProduction: false,
    productionAfterConquer: false,
    neutralsShowShips: true,
    neutralsProduction: 1,
    maxTurns: options.maxTurns ?? 20,
    ...options,
  };

  return {
    planets,
    players,
    fleets: [],
    turn: 1,
    currentPlayerId: playerDefs[0].id,
    playerOrder: playerDefs.map(p => p.id),
    options: defaultOptions,
    winner: null,
    gameOver: false,
    pendingOrders: [],
    lastReport: null,
    rows,
    cols,
  };
}

// ─── Order Validation ─────────────────────────────────────────────────────────

export function canSendFleet(
  state: GameState,
  sourceName: string,
  destName: string,
  ships: number,
): { ok: boolean; error?: string } {
  const source = state.planets[sourceName];
  const dest = state.planets[destName];

  if (!source) return { ok: false, error: 'Planeta de origem não encontrado.' };
  if (!dest) return { ok: false, error: 'Planeta de destino não encontrado.' };
  if (source.ownerId !== state.currentPlayerId)
    return { ok: false, error: 'Você não controla este planeta.' };
  if (sourceName === destName)
    return { ok: false, error: 'Origem e destino iguais.' };
  if (ships <= 0)
    return { ok: false, error: 'Número de naves deve ser positivo.' };
  if (ships > source.ships)
    return { ok: false, error: `Apenas ${source.ships} naves disponíveis.` };

  return { ok: true };
}

export function addOrder(
  state: GameState,
  sourceName: string,
  destName: string,
  ships: number,
): GameState {
  const validation = canSendFleet(state, sourceName, destName, ships);
  if (!validation.ok) return state;

  const source = state.planets[sourceName];
  const dest = state.planets[destName];
  const dist = distance(source, dest);
  const arrivalTurn = state.turn + Math.ceil(dist);

  const fleet: AttackFleet = {
    id: fleetId(),
    ownerId: state.currentPlayerId,
    sourceName,
    destName,
    ships,
    arrivalTurn,
  };

  // Deduct ships from source immediately (reservation)
  const updatedPlanets = {
    ...state.planets,
    [sourceName]: { ...source, ships: source.ships - ships },
  };

  return {
    ...state,
    planets: updatedPlanets,
    pendingOrders: [...state.pendingOrders, fleet],
  };
}

export function cancelOrder(state: GameState, fleetId: string): GameState {
  const fleet = state.pendingOrders.find(f => f.id === fleetId);
  if (!fleet) return state;

  // Refund ships to source
  const source = state.planets[fleet.sourceName];
  const updatedPlanets = {
    ...state.planets,
    [fleet.sourceName]: { ...source, ships: source.ships + fleet.ships },
  };

  return {
    ...state,
    planets: updatedPlanets,
    pendingOrders: state.pendingOrders.filter(f => f.id !== fleetId),
  };
}

// ─── Combat Resolution ────────────────────────────────────────────────────────

function resolveBattle(
  attacker: AttackFleet,
  defenderPlanet: Planet,
  sourcePlanet: Planet,
): BattleResult {
  let attackerShips = attacker.ships;
  let defenderShips = defenderPlanet.ships;

  const attackerKill = sourcePlanet.killPercent;
  const defenderKill = defenderPlanet.killPercent;

  const attackerShipsStart = attackerShips;
  const defenderShipsStart = defenderShips;

  while (attackerShips > 0 && defenderShips > 0) {
    const attackerRoll = rng();
    const defenderRoll = rng();

    // Special case: both kill% = 0
    if (defenderKill === 0 && attackerKill === 0) {
      if (attackerRoll < defenderRoll) defenderShips--;
      else attackerShips--;
      continue;
    }

    if (defenderRoll < defenderKill) attackerShips--;
    if (attackerShips <= 0) break;
    if (attackerRoll < attackerKill) defenderShips--;
  }

  const planetHeld = defenderShips > 0;

  return {
    attackerName: attacker.ownerId,
    defenderName: defenderPlanet.ownerId ?? NEUTRAL_ID,
    planetName: defenderPlanet.name,
    attackerShipsStart,
    defenderShipsStart,
    attackerShipsLeft: Math.max(0, attackerShips),
    defenderShipsLeft: Math.max(0, defenderShips),
    planetHeld,
  };
}

// ─── Turn Processing ──────────────────────────────────────────────────────────

function processFleetArrivals(
  state: GameState,
  report: TurnReport,
): GameState {
  let planets = { ...state.planets };
  const remainingFleets: AttackFleet[] = [];

  for (const fleet of state.fleets) {
    if (fleet.arrivalTurn !== state.turn) {
      remainingFleets.push(fleet);
      continue;
    }

    const dest = planets[fleet.destName];
    if (!dest) continue;

    if (dest.ownerId === fleet.ownerId) {
      // Reinforcement
      planets[fleet.destName] = { ...dest, ships: dest.ships + fleet.ships };
      report.reinforcements.push({ planetName: fleet.destName, ships: fleet.ships });
    } else {
      // Battle
      const sourcePlanet = planets[fleet.sourceName] ?? dest; // fallback
      const battle = resolveBattle(fleet, dest, sourcePlanet);
      report.battles.push(battle);

      if (battle.planetHeld) {
        // Defender wins
        planets[fleet.destName] = { ...dest, ships: battle.defenderShipsLeft };
      } else {
        // Attacker wins
        const prevOwner = dest.ownerId;
        planets[fleet.destName] = {
          ...dest,
          ownerId: fleet.ownerId,
          ships: battle.attackerShipsLeft,
        };
        if (prevOwner !== fleet.ownerId) {
          report.newOwners.push({ planetName: fleet.destName, newOwnerId: fleet.ownerId });
        }
      }
    }
  }

  return { ...state, planets, fleets: remainingFleets };
}

function produceShips(state: GameState): GameState {
  const planets = { ...state.planets };
  for (const name of Object.keys(planets)) {
    const p = planets[name];
    if (p.ownerId && p.ownerId !== NEUTRAL_ID) {
      planets[name] = { ...p, ships: p.ships + p.production };
    } else if (p.ownerId === NEUTRAL_ID) {
      planets[name] = { ...p, ships: p.ships + state.options.neutralsProduction };
    }
  }
  return { ...state, planets };
}

function checkWinner(state: GameState): GameState {
  const humanPlayers = state.playerOrder.filter(id => id !== NEUTRAL_ID);
  const alive = humanPlayers.filter(id => {
    return Object.values(state.planets).some(p => p.ownerId === id);
  });

  if (alive.length === 1) {
    return { ...state, winner: alive[0], gameOver: true };
  }
  if (alive.length === 0) {
    return { ...state, gameOver: true };
  }
  if (state.turn >= state.options.maxTurns) {
    // Winner by most planets
    let best: PlayerId | null = null;
    let bestCount = -1;
    for (const id of humanPlayers) {
      const count = Object.values(state.planets).filter(p => p.ownerId === id).length;
      if (count > bestCount) { bestCount = count; best = id; }
    }
    return { ...state, winner: best, gameOver: true };
  }
  return state;
}

export function endTurn(state: GameState): GameState {
  // Commit pending orders to fleet queue
  let newState: GameState = {
    ...state,
    fleets: [...state.fleets, ...state.pendingOrders],
    pendingOrders: [],
  };

  const playerIdx = state.playerOrder.indexOf(state.currentPlayerId);
  const isLastPlayer = playerIdx === state.playerOrder.length - 1;

  if (isLastPlayer) {
    // Process full turn
    const report: TurnReport = {
      turn: state.turn,
      battles: [],
      reinforcements: [],
      newOwners: [],
    };

    newState = processFleetArrivals(newState, report);
    newState = produceShips(newState);
    newState = checkWinner(newState);
    newState = {
      ...newState,
      turn: newState.turn + 1,
      currentPlayerId: state.playerOrder[0],
      lastReport: report,
    };
  } else {
    newState = {
      ...newState,
      currentPlayerId: state.playerOrder[playerIdx + 1],
    };
  }

  return newState;
}

// ─── AI Player ────────────────────────────────────────────────────────────────

export function runAI(state: GameState): GameState {
  const aiId = state.currentPlayerId;
  const player = state.players[aiId];
  if (!player?.isAI) return state;

  let newState = state;

  const myPlanets = Object.values(state.planets).filter(p => p.ownerId === aiId);
  const targets = Object.values(state.planets).filter(p => p.ownerId !== aiId);

  for (const src of myPlanets) {
    if (src.ships < 20) continue;

    // Find weakest reachable target
    const sortedTargets = [...targets].sort((a, b) => {
      const da = distance(src, a);
      const db = distance(src, b);
      // Prefer closer and weaker
      return (a.ships + da * 5) - (b.ships + db * 5);
    });

    if (sortedTargets.length === 0) continue;

    const target = sortedTargets[0];
    const sendShips = Math.floor(src.ships * 0.6);
    if (sendShips > 0) {
      const validation = canSendFleet(newState, src.name, target.name, sendShips);
      if (validation.ok) {
        newState = addOrder(newState, src.name, target.name, sendShips);
      }
    }
  }

  return newState;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface PlayerScore {
  playerId: PlayerId;
  playerName: string;
  color: string;
  planets: number;
  ships: number;
}

export function computeScores(state: GameState): PlayerScore[] {
  const scores: PlayerScore[] = [];
  for (const id of state.playerOrder) {
    const player = state.players[id];
    if (!player || id === NEUTRAL_ID) continue;
    const myPlanets = Object.values(state.planets).filter(p => p.ownerId === id);
    const totalShips = myPlanets.reduce((sum, p) => sum + p.ships, 0);
    scores.push({
      playerId: id,
      playerName: player.name,
      color: player.color,
      planets: myPlanets.length,
      ships: totalShips,
    });
  }
  return scores.sort((a, b) => b.planets - a.planets || b.ships - a.ships);
}
