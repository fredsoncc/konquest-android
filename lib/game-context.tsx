import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  GameState,
  PlayerDef,
  createGame,
  addOrder,
  cancelOrder,
  endTurn,
  runAI,
  PLAYER_COLORS,
  GameOptions,
} from './game-engine';

// ─── Actions ──────────────────────────────────────────────────────────────────

type GameAction =
  | { type: 'NEW_GAME'; players: PlayerDef[]; numPlanets: number; options?: Partial<GameOptions> }
  | { type: 'ADD_ORDER'; source: string; dest: string; ships: number }
  | { type: 'CANCEL_ORDER'; fleetId: string }
  | { type: 'END_TURN' }
  | { type: 'RESET' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'NEW_GAME':
      return createGame(action.players, action.numPlanets, action.options);

    case 'ADD_ORDER':
      if (!state) return state;
      return addOrder(state, action.source, action.dest, action.ships);

    case 'CANCEL_ORDER':
      if (!state) return state;
      return cancelOrder(state, action.fleetId);

    case 'END_TURN': {
      if (!state) return state;
      let next = endTurn(state);
      // Run AI turns automatically
      while (next && !next.gameOver && next.players[next.currentPlayerId]?.isAI) {
        next = runAI(next);
        next = endTurn(next);
      }
      return next;
    }

    case 'RESET':
      return null;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState | null;
  startGame: (players: PlayerDef[], numPlanets: number, options?: Partial<GameOptions>) => void;
  sendFleet: (source: string, dest: string, ships: number) => void;
  cancelFleet: (fleetId: string) => void;
  finishTurn: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null);

  const startGame = useCallback(
    (players: PlayerDef[], numPlanets: number, options?: Partial<GameOptions>) => {
      dispatch({ type: 'NEW_GAME', players, numPlanets, options });
    },
    [],
  );

  const sendFleet = useCallback((source: string, dest: string, ships: number) => {
    dispatch({ type: 'ADD_ORDER', source, dest, ships });
  }, []);

  const cancelFleet = useCallback((fleetId: string) => {
    dispatch({ type: 'CANCEL_ORDER', fleetId });
  }, []);

  const finishTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <GameContext.Provider value={{ state, startGame, sendFleet, cancelFleet, finishTurn, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// ─── Player builder helper ────────────────────────────────────────────────────

export function buildPlayers(names: string[], aiFlags: boolean[]): PlayerDef[] {
  return names.map((name, i) => ({
    id: `player_${i + 1}`,
    name,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    isAI: aiFlags[i] ?? false,
  }));
}
