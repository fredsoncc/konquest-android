/**
 * StatusPanel — Painel de status da partida
 *
 * Exibe para cada jogador:
 *  - Cor e nome
 *  - Quantidade de planetas controlados
 *  - Total de naves/soldados em todos os planetas
 *  - Produção total por turno
 *  - Indicador de "vez atual"
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, FlatList,
} from 'react-native';
import { GameState, NEUTRAL_ID, computeScores } from '@/lib/game-engine';

interface StatusPanelProps {
  state: GameState;
  myPlayerId?: string; // para destacar o jogador local
}

export function StatusPanel({ state, myPlayerId }: StatusPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const scores = computeScores(state);

  // Dados extras: produção total por jogador
  const productionByPlayer: Record<string, number> = {};
  for (const planet of Object.values(state.planets)) {
    if (planet.ownerId && planet.ownerId !== NEUTRAL_ID) {
      productionByPlayer[planet.ownerId] = (productionByPlayer[planet.ownerId] ?? 0) + planet.production;
    }
  }

  // Planetas do jogador atual para o resumo compacto
  const myScore = scores.find(s => s.playerId === (myPlayerId ?? state.currentPlayerId));

  return (
    <>
      {/* Barra compacta sempre visível */}
      <TouchableOpacity
        style={styles.compactBar}
        onPress={() => setExpanded(true)}
        activeOpacity={0.8}
      >
        {/* Resumo do jogador atual/local */}
        <View style={styles.compactLeft}>
          {myScore && (
            <>
              <View style={[styles.dot, { backgroundColor: myScore.color }]} />
              <Text style={styles.compactName} numberOfLines={1}>{myScore.playerName}</Text>
              <Text style={styles.compactStat}>🪐 {myScore.planets}</Text>
              <Text style={styles.compactStat}>🚀 {myScore.ships}</Text>
              <Text style={styles.compactStatGreen}>+{productionByPlayer[myScore.playerId] ?? 0}/turno</Text>
            </>
          )}
        </View>

        {/* Mini placar de todos os jogadores */}
        <View style={styles.compactRight}>
          {scores.map(s => (
            <View key={s.playerId} style={styles.miniPlayer}>
              <View style={[styles.miniDot, { backgroundColor: s.color }]} />
              <Text style={[
                styles.miniShips,
                s.playerId === state.currentPlayerId && styles.miniShipsActive,
              ]}>
                {s.ships}
              </Text>
            </View>
          ))}
          <Text style={styles.expandHint}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* Modal expandido com detalhes completos */}
      <Modal
        visible={expanded}
        transparent
        animationType="slide"
        onRequestClose={() => setExpanded(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setExpanded(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>STATUS DA PARTIDA</Text>
              <Text style={styles.modalSubtitle}>Turno {state.turn} / {state.options.maxTurns}</Text>
              <TouchableOpacity onPress={() => setExpanded(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Tabela de jogadores */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableCellName]}>Jogador</Text>
                <Text style={styles.tableCell}>🪐</Text>
                <Text style={styles.tableCell}>🚀 Naves</Text>
                <Text style={styles.tableCell}>⚡ Prod.</Text>
              </View>

              {scores.map(s => {
                const isCurrentTurn = s.playerId === state.currentPlayerId;
                const isMe = s.playerId === myPlayerId;
                return (
                  <View
                    key={s.playerId}
                    style={[
                      styles.tableRow,
                      isCurrentTurn && styles.tableRowActive,
                      isMe && styles.tableRowMe,
                    ]}
                  >
                    <View style={[styles.tableCell, styles.tableCellName, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                      <View style={[styles.dot, { backgroundColor: s.color }]} />
                      <Text style={styles.playerName} numberOfLines={1}>
                        {s.playerName}{isMe ? ' (você)' : ''}
                        {isCurrentTurn ? ' ▶' : ''}
                      </Text>
                    </View>
                    <Text style={[styles.tableCell, styles.tableCellValue]}>{s.planets}</Text>
                    <Text style={[styles.tableCell, styles.tableCellShips]}>{s.ships}</Text>
                    <Text style={[styles.tableCell, styles.tableCellProd]}>+{productionByPlayer[s.playerId] ?? 0}</Text>
                  </View>
                );
              })}

              {/* Lista de planetas do jogador local */}
              {myPlayerId && (
                <>
                  <Text style={styles.sectionTitle}>SEUS PLANETAS</Text>
                  <View style={styles.planetTableHeader}>
                    <Text style={[styles.planetCol, { flex: 1 }]}>Planeta</Text>
                    <Text style={styles.planetCol}>Naves</Text>
                    <Text style={styles.planetCol}>Prod.</Text>
                    <Text style={styles.planetCol}>Def.%</Text>
                  </View>
                  {Object.values(state.planets)
                    .filter(p => p.ownerId === myPlayerId)
                    .sort((a, b) => b.ships - a.ships)
                    .map(planet => (
                      <View key={planet.name} style={styles.planetRow}>
                        <Text style={[styles.planetCol, { flex: 1, color: '#e0f7fa', fontWeight: '700' }]}>
                          {planet.name}
                        </Text>
                        <Text style={[styles.planetCol, { color: '#ffd54f', fontWeight: '900' }]}>
                          {planet.ships}
                        </Text>
                        <Text style={[styles.planetCol, { color: '#66bb6a' }]}>
                          +{planet.production}
                        </Text>
                        <Text style={[styles.planetCol, { color: '#90a4ae' }]}>
                          {Math.round(planet.killPercent * 100)}%
                        </Text>
                      </View>
                    ))}
                </>
              )}

              {/* Frotas em trânsito */}
              {state.fleets.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>FROTAS EM TRÂNSITO</Text>
                  {state.fleets.map(fleet => {
                    const owner = state.players[fleet.ownerId];
                    return (
                      <View key={fleet.id} style={styles.fleetRow}>
                        <View style={[styles.miniDot, { backgroundColor: owner?.color ?? '#78909c' }]} />
                        <Text style={styles.fleetText}>
                          {fleet.sourceName} → {fleet.destName}
                        </Text>
                        <Text style={styles.fleetShips}>{fleet.ships} naves</Text>
                        <Text style={styles.fleetTurn}>T{fleet.arrivalTurn}</Text>
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  compactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1b2a',
    borderTopWidth: 1,
    borderTopColor: '#0a3a4a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  compactLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compactName: {
    color: '#e0f7fa',
    fontWeight: '700',
    fontSize: 13,
    maxWidth: 80,
  },
  compactStat: {
    color: '#90a4ae',
    fontSize: 12,
    fontWeight: '700',
  },
  compactStatGreen: {
    color: '#66bb6a',
    fontSize: 11,
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  miniShips: {
    color: '#546e7a',
    fontSize: 11,
    fontWeight: '700',
  },
  miniShipsActive: {
    color: '#ffd54f',
  },
  expandHint: {
    color: '#546e7a',
    fontSize: 10,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#0d1b2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a4a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#e0f7fa',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
    flex: 1,
  },
  modalSubtitle: {
    color: '#546e7a',
    fontSize: 12,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#546e7a',
    fontSize: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#050510',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0d1b2a',
    backgroundColor: '#0a0f1a',
  },
  tableRowActive: {
    backgroundColor: '#0a2a3a',
  },
  tableRowMe: {
    borderLeftWidth: 3,
    borderLeftColor: '#0a7ea4',
  },
  tableCell: {
    color: '#90a4ae',
    fontSize: 12,
    fontWeight: '700',
    width: 70,
    textAlign: 'center',
  },
  tableCellName: {
    flex: 1,
    textAlign: 'left',
    width: undefined,
  },
  tableCellValue: {
    color: '#e0f7fa',
    fontSize: 14,
  },
  tableCellShips: {
    color: '#ffd54f',
    fontSize: 14,
    fontWeight: '900',
  },
  tableCellProd: {
    color: '#66bb6a',
    fontSize: 13,
  },
  playerName: {
    color: '#e0f7fa',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  sectionTitle: {
    color: '#546e7a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  planetTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#050510',
  },
  planetRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0d1b2a',
  },
  planetCol: {
    color: '#90a4ae',
    fontSize: 12,
    width: 60,
    textAlign: 'center',
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0d1b2a',
  },
  fleetText: {
    flex: 1,
    color: '#90a4ae',
    fontSize: 12,
  },
  fleetShips: {
    color: '#ffd54f',
    fontSize: 12,
    fontWeight: '700',
  },
  fleetTurn: {
    color: '#546e7a',
    fontSize: 11,
    width: 30,
    textAlign: 'right',
  },
});
