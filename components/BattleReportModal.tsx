import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { TurnReport, GameState } from '@/lib/game-engine';

interface BattleReportModalProps {
  visible: boolean;
  report: TurnReport | null;
  state: GameState;
  onClose: () => void;
}

export function BattleReportModal({
  visible,
  report,
  state,
  onClose,
}: BattleReportModalProps) {
  if (!report) return null;

  const playerName = (id: string) => state.players[id]?.name ?? id;
  const playerColor = (id: string) => state.players[id]?.color ?? '#78909c';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Relatório — Turno {report.turn}</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Battles */}
            {report.battles.length > 0 && (
              <>
                <Text style={styles.section}>⚔️  Batalhas</Text>
                {report.battles.map((b, i) => (
                  <View key={i} style={styles.battleCard}>
                    <Text style={styles.planetLabel}>Planeta {b.planetName}</Text>
                    <View style={styles.battleRow}>
                      <View style={styles.side}>
                        <Text style={[styles.playerName, { color: playerColor(b.attackerName) }]}>
                          {playerName(b.attackerName)}
                        </Text>
                        <Text style={styles.shipsText}>
                          {b.attackerShipsStart} → {b.attackerShipsLeft} naves
                        </Text>
                      </View>
                      <Text style={styles.vs}>VS</Text>
                      <View style={styles.side}>
                        <Text style={[styles.playerName, { color: playerColor(b.defenderName) }]}>
                          {playerName(b.defenderName)}
                        </Text>
                        <Text style={styles.shipsText}>
                          {b.defenderShipsStart} → {b.defenderShipsLeft} naves
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.result, { color: b.planetHeld ? '#66bb6a' : '#ef5350' }]}>
                      {b.planetHeld
                        ? `🛡️ ${playerName(b.defenderName)} defendeu!`
                        : `🚀 ${playerName(b.attackerName)} conquistou!`}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Reinforcements */}
            {report.reinforcements.length > 0 && (
              <>
                <Text style={styles.section}>🚀  Reforços</Text>
                {report.reinforcements.map((r, i) => (
                  <Text key={i} style={styles.infoText}>
                    +{r.ships} naves chegaram em {r.planetName}
                  </Text>
                ))}
              </>
            )}

            {/* No events */}
            {report.battles.length === 0 && report.reinforcements.length === 0 && (
              <Text style={styles.infoText}>Nenhum evento neste turno.</Text>
            )}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Continuar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#0d1b2a',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#4fc3f7',
  },
  title: {
    color: '#4fc3f7',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 400,
  },
  section: {
    color: '#ffd54f',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6,
  },
  battleCard: {
    backgroundColor: '#0a0a1a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  planetLabel: {
    color: '#e0e0e0',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 14,
  },
  battleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  side: {
    flex: 1,
    alignItems: 'center',
  },
  vs: {
    color: '#78909c',
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  playerName: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  shipsText: {
    color: '#78909c',
    fontSize: 12,
    marginTop: 2,
  },
  result: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
  },
  infoText: {
    color: '#e0e0e0',
    fontSize: 13,
    marginBottom: 4,
  },
  closeBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#0a0a1a',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
