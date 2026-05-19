import { describe, it, expect } from 'vitest';
import {
  createGame,
  addOrder,
  cancelOrder,
  endTurn,
  canSendFleet,
  computeScores,
  runAI,
  NEUTRAL_ID,
  PlayerDef,
} from '../lib/game-engine';

const players: PlayerDef[] = [
  { id: 'p1', name: 'Alice', color: '#ef5350', isAI: false },
  { id: 'p2', name: 'Bob', color: '#42a5f5', isAI: false },
];

describe('Game Engine', () => {
  it('creates a game with correct initial state', () => {
    const state = createGame(players, 6);
    expect(Object.keys(state.players)).toContain('p1');
    expect(Object.keys(state.players)).toContain('p2');
    expect(Object.keys(state.players)).toContain(NEUTRAL_ID);
    expect(Object.keys(state.planets).length).toBe(6);
    expect(state.turn).toBe(1);
    expect(state.currentPlayerId).toBe('p1');
    expect(state.gameOver).toBe(false);
  });

  it('each player starts with exactly one home planet', () => {
    const state = createGame(players, 6);
    const p1Planets = Object.values(state.planets).filter(p => p.ownerId === 'p1');
    const p2Planets = Object.values(state.planets).filter(p => p.ownerId === 'p2');
    expect(p1Planets.length).toBe(1);
    expect(p2Planets.length).toBe(1);
  });

  it('validates fleet orders correctly', () => {
    const state = createGame(players, 6);
    const myPlanet = Object.values(state.planets).find(p => p.ownerId === 'p1')!;
    const otherPlanet = Object.values(state.planets).find(p => p.ownerId !== 'p1')!;

    // Valid order
    const valid = canSendFleet(state, myPlanet.name, otherPlanet.name, 10);
    expect(valid.ok).toBe(true);

    // Too many ships
    const tooMany = canSendFleet(state, myPlanet.name, otherPlanet.name, 9999);
    expect(tooMany.ok).toBe(false);

    // Not your planet
    const notOwned = canSendFleet(state, otherPlanet.name, myPlanet.name, 10);
    expect(notOwned.ok).toBe(false);

    // Same source and dest
    const sameSD = canSendFleet(state, myPlanet.name, myPlanet.name, 10);
    expect(sameSD.ok).toBe(false);
  });

  it('adds and cancels orders correctly', () => {
    let state = createGame(players, 6);
    const myPlanet = Object.values(state.planets).find(p => p.ownerId === 'p1')!;
    const otherPlanet = Object.values(state.planets).find(p => p.ownerId !== 'p1')!;

    const shipsBefore = myPlanet.ships;
    state = addOrder(state, myPlanet.name, otherPlanet.name, 50);
    expect(state.pendingOrders.length).toBe(1);
    expect(state.planets[myPlanet.name].ships).toBe(shipsBefore - 50);

    const fleetId = state.pendingOrders[0].id;
    state = cancelOrder(state, fleetId);
    expect(state.pendingOrders.length).toBe(0);
    expect(state.planets[myPlanet.name].ships).toBe(shipsBefore);
  });

  it('advances turn when end turn is called', () => {
    let state = createGame(players, 6);
    expect(state.currentPlayerId).toBe('p1');
    state = endTurn(state);
    expect(state.currentPlayerId).toBe('p2');
  });

  it('processes full turn after all players end', () => {
    let state = createGame(players, 6);
    state = endTurn(state); // p1 ends
    state = endTurn(state); // p2 ends → full turn processed
    expect(state.turn).toBe(2);
    expect(state.currentPlayerId).toBe('p1');
  });

  it('computes scores correctly', () => {
    const state = createGame(players, 6);
    const scores = computeScores(state);
    expect(scores.length).toBe(2);
    expect(scores.every(s => s.planets >= 0)).toBe(true);
  });

  it('AI player runs without errors', () => {
    const aiPlayers: PlayerDef[] = [
      { id: 'p1', name: 'Human', color: '#ef5350', isAI: false },
      { id: 'p2', name: 'AI', color: '#42a5f5', isAI: true },
    ];
    let state = createGame(aiPlayers, 6);
    state = endTurn(state); // p1 ends, triggers AI p2
    expect(state).toBeTruthy();
  });

  it('detects winner when only one player has planets', () => {
    let state = createGame(players, 4);

    // Force all planets to p1
    const updatedPlanets = { ...state.planets };
    for (const name of Object.keys(updatedPlanets)) {
      updatedPlanets[name] = { ...updatedPlanets[name], ownerId: 'p1' };
    }
    state = { ...state, planets: updatedPlanets };

    // End both turns to trigger winner check
    state = endTurn(state);
    state = endTurn(state);

    expect(state.gameOver).toBe(true);
    expect(state.winner).toBe('p1');
  });
});
