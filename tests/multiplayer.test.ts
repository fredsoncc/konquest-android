import { describe, it, expect } from 'vitest';
import { createGame, endTurn, addOrder, canSendFleet } from '../lib/game-engine';

const p1 = { id: 'mp1', name: 'Alice', color: '#ef5350', isAI: false };
const p2 = { id: 'mp2', name: 'Bob', color: '#42a5f5', isAI: false };

describe('Multiplayer game flow', () => {
  it('cria jogo multiplayer com 2 jogadores', () => {
    const state = createGame([p1, p2], 10, { maxTurns: 20 });
    expect(Object.keys(state.players)).toContain('mp1');
    expect(Object.keys(state.players)).toContain('mp2');
    expect(state.options.maxTurns).toBe(20);
    expect(state.turn).toBe(1);
  });

  it('cada jogador tem exatamente 1 planeta inicial', () => {
    const state = createGame([p1, p2], 10, { maxTurns: 20 });
    const p1Planets = Object.values(state.planets).filter(p => p.ownerId === 'mp1');
    const p2Planets = Object.values(state.planets).filter(p => p.ownerId === 'mp2');
    expect(p1Planets.length).toBe(1);
    expect(p2Planets.length).toBe(1);
  });

  it('simula turno completo: p1 envia frota, ambos encerram turno', () => {
    let state = createGame([p1, p2], 10, { maxTurns: 20 });
    const p1Planet = Object.values(state.planets).find(p => p.ownerId === 'mp1')!;
    const neutral = Object.values(state.planets).find(p => p.ownerId === 'neutral')!;
    const ships = Math.floor(p1Planet.ships / 2);
    const check = canSendFleet(state, p1Planet.name, neutral.name, ships);
    expect(check.ok).toBe(true);
    state = addOrder(state, p1Planet.name, neutral.name, ships);
    expect(state.pendingOrders.length).toBe(1);
    state = endTurn(state);
    expect(state.currentPlayerId).toBe('mp2');
    state = endTurn(state);
    expect(state.turn).toBe(2);
    expect(state.currentPlayerId).toBe('mp1');
  });

  it('detecta fim de jogo quando um jogador controla tudo', () => {
    let state = createGame([p1, p2], 4, { maxTurns: 50 });
    const updatedPlanets = { ...state.planets };
    for (const name of Object.keys(updatedPlanets)) {
      updatedPlanets[name] = { ...updatedPlanets[name], ownerId: 'mp1' };
    }
    state = { ...state, planets: updatedPlanets };
    state = endTurn(state);
    state = endTurn(state);
    expect(state.gameOver).toBe(true);
    expect(state.winner).toBe('mp1');
  });

  it('respeita o limite máximo de turnos', () => {
    let state = createGame([p1, p2], 4, { maxTurns: 2 });
    state = endTurn(state); state = endTurn(state);
    state = endTurn(state); state = endTurn(state);
    expect(state.gameOver).toBe(true);
  });

  it('valida que jogador não pode enviar mais naves do que possui', () => {
    const state = createGame([p1, p2], 6, { maxTurns: 20 });
    const p1Planet = Object.values(state.planets).find(p => p.ownerId === 'mp1')!;
    const neutral = Object.values(state.planets).find(p => p.ownerId === 'neutral')!;
    const check = canSendFleet(state, p1Planet.name, neutral.name, p1Planet.ships + 1000);
    expect(check.ok).toBe(false);
    expect(check.error).toContain('naves disponíveis');
  });

  it('múltiplas ordens do mesmo planeta reduzem ships corretamente', () => {
    let state = createGame([p1, p2], 8, { maxTurns: 20 });
    const p1Planet = Object.values(state.planets).find(p => p.ownerId === 'mp1')!;
    const neutralPlanets = Object.values(state.planets).filter(p => p.ownerId === 'neutral');
    if (neutralPlanets.length >= 2) {
      const ships1 = 50, ships2 = 30;
      const initialShips = state.planets[p1Planet.name].ships;
      state = addOrder(state, p1Planet.name, neutralPlanets[0].name, ships1);
      state = addOrder(state, p1Planet.name, neutralPlanets[1].name, ships2);
      expect(state.planets[p1Planet.name].ships).toBe(initialShips - ships1 - ships2);
      expect(state.pendingOrders.length).toBe(2);
    }
  });

  it('estado inicial do jogo tem turno 1 e primeiro jogador correto', () => {
    const state = createGame([p1, p2], 8, { maxTurns: 20 });
    expect(state.turn).toBe(1);
    expect(state.currentPlayerId).toBe('mp1');
    expect(state.gameOver).toBe(false);
    expect(state.winner).toBeNull();
  });
});
