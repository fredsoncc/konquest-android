import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useGame } from '@/lib/game-context';
import { GalaxyMap } from '@/components/GalaxyMap';
import { FleetOrderPanel } from '@/components/FleetOrderPanel';
import { BattleReportModal } from '@/components/BattleReportModal';
import { NEUTRAL_ID, computeScores } from '@/lib/game-engine';
import { ScreenContainer } from '@/components/screen-container';

export default function GameScreen() {
  const { state, sendFleet, cancelFleet, finishTurn, resetGame } = useGame();

  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [targetPlanet, setTargetPlanet] = useState<string | null>(null);
  const [shipInput, setShipInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [pendingReport, setPendingReport] = useState<import('@/lib/game-engine').TurnReport | null>(null);

  // Redirect if no game
  useEffect(() => {
    if (!state) {
      router.replace('/');
    }
  }, [state]);

  // Show battle report when turn advances
  useEffect(() => {
    if (state && state.lastReport && state.lastReport !== pendingReport) {
      setPendingReport(state.lastReport);
      setShowReport(true);
    }
  }, [state?.lastReport]);

  // Show game over
  useEffect(() => {
    if (state?.gameOver) {
      const scores = computeScores(state);
      const winner = state.winner ? state.players[state.winner]?.name : 'Ninguém';
      Alert.alert(
        '🏆 Fim de Jogo',
        `Vencedor: ${winner}\n\n${scores.map(s => `${s.playerName}: ${s.planets} planetas`).join('\n')}`,
        [
          { text: 'Jogar Novamente', onPress: () => { resetGame(); router.replace('/'); } },
        ],
      );
    }
  }, [state?.gameOver]);

  const handlePlanetPress = useCallback((name: string) => {
    if (!state) return;

    if (!selectedPlanet) {
      // First tap: select source (must own it)
      const planet = state.planets[name];
      if (planet?.ownerId === state.currentPlayerId) {
        setSelectedPlanet(name);
        setTargetPlanet(null);
        setShipInput('');
      }
    } else if (name === selectedPlanet) {
      // Deselect
      setSelectedPlanet(null);
      setTargetPlanet(null);
      setShipInput('');
    } else {
      // Second tap: select target
      setTargetPlanet(name);
      // Default to half ships
      const src = state.planets[selectedPlanet];
      if (src) setShipInput(String(Math.floor(src.ships / 2)));
    }
  }, [state, selectedPlanet]);

  const handleSendFleet = useCallback(() => {
    if (!selectedPlanet || !targetPlanet || !shipInput) return;
    const ships = parseInt(shipInput, 10);
    if (isNaN(ships) || ships <= 0) return;

    sendFleet(selectedPlanet, targetPlanet, ships);
    setSelectedPlanet(null);
    setTargetPlanet(null);
    setShipInput('');
  }, [selectedPlanet, targetPlanet, shipInput, sendFleet]);

  const handleEndTurn = useCallback(() => {
    setSelectedPlanet(null);
    setTargetPlanet(null);
    setShipInput('');
    finishTurn();
  }, [finishTurn]);

  if (!state) return null;

  const currentPlayer = state.players[state.currentPlayerId];
  const currentPlayerColor = currentPlayer?.color ?? '#78909c';
  const selectedPlanetData = selectedPlanet ? state.planets[selectedPlanet] : null;
  const targetPlanetData = targetPlanet ? state.planets[targetPlanet] : null;

  return (
    <ScreenContainer containerClassName="bg-[#0a0a1a]" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.turnLabel}>Turno {state.turn}/{state.options.maxTurns}</Text>
            <View style={[styles.playerDot, { backgroundColor: currentPlayerColor }]} />
            <Text style={[styles.playerLabel, { color: currentPlayerColor }]}>
              {currentPlayer?.name ?? '?'}
            </Text>
          </View>
          <Pressable
            style={styles.menuBtn}
            onPress={() =>
              Alert.alert('Menu', '', [
                { text: 'Novo Jogo', onPress: () => { resetGame(); router.replace('/'); } },
                { text: 'Cancelar', style: 'cancel' },
              ])
            }
          >
            <Text style={styles.menuBtnText}>☰</Text>
          </Pressable>
        </View>

        {/* Galaxy Map */}
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          style={styles.mapScroll}
        >
          <GalaxyMap
            state={state}
            selectedPlanet={selectedPlanet}
            targetPlanet={targetPlanet}
            onPlanetPress={handlePlanetPress}
          />
        </ScrollView>

        {/* Bottom Panel */}
        <View style={styles.bottomPanel}>
          {/* Planet info row */}
          {selectedPlanetData && (
            <View style={styles.selectionRow}>
              <View style={styles.planetInfo}>
                <Text style={styles.planetInfoLabel}>De:</Text>
                <Text style={styles.planetInfoName}>{selectedPlanetData.name}</Text>
                <Text style={styles.planetInfoShips}>{selectedPlanetData.ships} naves</Text>
              </View>
              {targetPlanetData && (
                <>
                  <Text style={styles.arrow}>→</Text>
                  <View style={styles.planetInfo}>
                    <Text style={styles.planetInfoLabel}>Para:</Text>
                    <Text style={styles.planetInfoName}>{targetPlanetData.name}</Text>
                    <Text style={[styles.planetInfoShips, { color: '#ef5350' }]}>
                      {targetPlanetData.ownerId === NEUTRAL_ID ? 'Neutro' : state.players[targetPlanetData.ownerId ?? '']?.name ?? '?'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* Ship input + send */}
          {selectedPlanet && targetPlanet && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.shipInput}
                value={shipInput}
                onChangeText={setShipInput}
                keyboardType="numeric"
                placeholder="Naves"
                placeholderTextColor="#78909c"
                returnKeyType="done"
                onSubmitEditing={handleSendFleet}
              />
              <Pressable style={styles.sendBtn} onPress={handleSendFleet}>
                <Text style={styles.sendBtnText}>🚀 Enviar</Text>
              </Pressable>
            </View>
          )}

          {/* Pending orders */}
          <View style={styles.ordersSection}>
            <Text style={styles.ordersTitle}>Ordens ({state.pendingOrders.length})</Text>
            <FleetOrderPanel
              orders={state.pendingOrders}
              onCancel={cancelFleet}
            />
          </View>

          {/* End Turn */}
          <Pressable
            style={[styles.endTurnBtn, { borderColor: currentPlayerColor }]}
            onPress={handleEndTurn}
          >
            <Text style={[styles.endTurnText, { color: currentPlayerColor }]}>
              Fim de Turno ▶
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Battle Report Modal */}
      <BattleReportModal
        visible={showReport}
        report={pendingReport}
        state={state}
        onClose={() => setShowReport(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0d1b2a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnLabel: {
    color: '#78909c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  playerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playerLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  menuBtn: {
    padding: 8,
  },
  menuBtnText: {
    color: '#4fc3f7',
    fontSize: 20,
  },
  mapScroll: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  bottomPanel: {
    backgroundColor: '#0d1b2a',
    borderTopWidth: 1,
    borderTopColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  planetInfo: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  planetInfoLabel: {
    color: '#78909c',
    fontSize: 10,
  },
  planetInfoName: {
    color: '#e0e0e0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  planetInfoShips: {
    color: '#ffd54f',
    fontSize: 12,
  },
  arrow: {
    color: '#4fc3f7',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  shipInput: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4fc3f7',
    color: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#0a0a1a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ordersSection: {
    marginBottom: 8,
  },
  ordersTitle: {
    color: '#78909c',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  endTurnBtn: {
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 12,
    alignItems: 'center',
  },
  endTurnText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
