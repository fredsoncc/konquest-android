import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, TextInput, FlatList, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { GalaxyMap } from '@/components/GalaxyMap';
import { BattleReportModal } from '@/components/BattleReportModal';
import { useMultiplayer } from '@/lib/multiplayer-client';
import type { GameState, TurnReport } from '@/lib/game-engine';
import { addOrder, canSendFleet } from '@/lib/game-engine';

export default function MultiplayerGameScreen() {
  const router = useRouter();
  const { myPlayerId } = useLocalSearchParams<{ myPlayerId: string }>();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [targetPlanet, setTargetPlanet] = useState<string | null>(null);
  const [shipInput, setShipInput] = useState('');
  const [pendingOrders, setPendingOrders] = useState<{ sourceName: string; destName: string; ships: number }[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [lastReport, setLastReport] = useState<TurnReport | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [turnEnded, setTurnEnded] = useState(false);

  const handleGameStarted = useCallback((state: GameState, _pid: string) => {
    setGameState(state);
    setTurnEnded(false);
  }, []);

  const handleTurnResult = useCallback((state: GameState) => {
    setGameState(state);
    setTurnEnded(false);
    setPendingOrders([]);
    setSelectedPlanet(null);
    setTargetPlanet(null);
    if (state.lastReport) {
      setLastReport(state.lastReport);
      setShowReport(true);
    }
  }, []);

  const handleGameOver = useCallback((state: GameState, winner: string | null) => {
    setGameState(state);
    const winnerName = winner ? state.players[winner]?.name ?? winner : 'Ninguém';
    Alert.alert('Fim de Jogo', `Vencedor: ${winnerName}`, [
      { text: 'Voltar ao Início', onPress: () => router.replace('/') },
    ]);
  }, [router]);

  const { mpState, actions } = useMultiplayer(handleGameStarted, handleTurnResult, handleGameOver);

  useEffect(() => {
    if (mpState.gameState) setGameState(mpState.gameState);
  }, [mpState.gameState]);

  const isMyTurn = gameState?.currentPlayerId === myPlayerId;

  function handlePlanetPress(planetName: string) {
    if (!gameState || !isMyTurn || turnEnded) return;
    if (!selectedPlanet) {
      if (gameState.planets[planetName]?.ownerId === myPlayerId) {
        setSelectedPlanet(planetName);
        setTargetPlanet(null);
        setShipInput('');
      }
      return;
    }
    if (selectedPlanet === planetName) { setSelectedPlanet(null); setTargetPlanet(null); return; }
    setTargetPlanet(planetName);
  }

  function handleSendFleet() {
    if (!gameState || !selectedPlanet || !targetPlanet) return;
    const ships = parseInt(shipInput, 10);
    if (isNaN(ships) || ships <= 0) { Alert.alert('Inválido', 'Digite um número válido de naves.'); return; }
    const check = canSendFleet(gameState, selectedPlanet, targetPlanet, ships);
    if (!check.ok) { Alert.alert('Ordem inválida', check.error ?? 'Erro.'); return; }
    setPendingOrders(prev => [...prev, { sourceName: selectedPlanet, destName: targetPlanet, ships }]);
    setGameState(addOrder(gameState, selectedPlanet, targetPlanet, ships));
    setSelectedPlanet(null);
    setTargetPlanet(null);
    setShipInput('');
  }

  function handleEndTurn() {
    if (!gameState || turnEnded) return;
    if (pendingOrders.length > 0) actions.submitOrders(pendingOrders);
    actions.endTurn();
    setTurnEnded(true);
  }

  function handleSendChat() {
    if (!chatInput.trim()) return;
    actions.sendChat(chatInput.trim());
    setChatInput('');
  }

  if (!gameState) {
    return (
      <ScreenContainer containerClassName="bg-[#0a0a1a]">
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Aguardando início da partida...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const currentPlayerName = gameState.players[gameState.currentPlayerId]?.name ?? '';
  const myPlanetCount = Object.values(gameState.planets).filter(p => p.ownerId === myPlayerId).length;

  return (
    <ScreenContainer containerClassName="bg-[#0a0a1a]" edges={['top', 'left', 'right']}>
      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <Text style={styles.hudTurn}>Turno {gameState.turn}</Text>
          <Text style={styles.hudPlayer} numberOfLines={1}>
            {isMyTurn ? '▶ Sua vez' : `Vez de: ${currentPlayerName}`}
          </Text>
        </View>
        <View style={styles.hudRight}>
          <Text style={styles.hudPlanets}>🪐 {myPlanetCount}</Text>
          <TouchableOpacity style={styles.chatToggle} onPress={() => setShowChat(v => !v)}>
            <Text style={styles.chatToggleText}>💬</Text>
            {mpState.chat.length > 0 && <View style={styles.chatBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Status dos turnos */}
      <View style={styles.turnStatus}>
        {mpState.players.map(p => (
          <View key={p.id} style={styles.turnStatusPlayer}>
            <View style={[styles.turnStatusDot, { backgroundColor: p.color }]} />
            <Text style={styles.turnStatusName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
            {mpState.playersEndedTurn.has(p.id) && <Text style={styles.turnStatusCheck}>✓</Text>}
          </View>
        ))}
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <GalaxyMap
          state={gameState}
          selectedPlanet={selectedPlanet}
          targetPlanet={targetPlanet}
          onPlanetPress={handlePlanetPress}
        />
      </View>

      {/* Painel de ordem */}
      {selectedPlanet && targetPlanet && isMyTurn && !turnEnded && (
        <View style={styles.orderPanel}>
          <Text style={styles.orderText}>{selectedPlanet} → {targetPlanet}</Text>
          <TextInput
            style={styles.orderInput}
            value={shipInput}
            onChangeText={setShipInput}
            keyboardType="numeric"
            placeholder={`Máx: ${gameState.planets[selectedPlanet]?.ships ?? 0}`}
            placeholderTextColor="#546e7a"
            returnKeyType="done"
            onSubmitEditing={handleSendFleet}
          />
          <TouchableOpacity style={styles.orderBtn} onPress={handleSendFleet}>
            <Text style={styles.orderBtnText}>ENVIAR</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Ordens pendentes */}
      {pendingOrders.length > 0 && (
        <ScrollView horizontal style={styles.pendingScroll} showsHorizontalScrollIndicator={false}>
          {pendingOrders.map((o, i) => (
            <View key={i} style={styles.pendingChip}>
              <Text style={styles.pendingChipText}>{o.sourceName}→{o.destName} ({o.ships})</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Barra inferior */}
      <View style={styles.bottomBar}>
        {isMyTurn && !turnEnded ? (
          <TouchableOpacity style={styles.endTurnBtn} onPress={handleEndTurn}>
            <Text style={styles.endTurnText}>ENCERRAR TURNO ▶</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingTurn}>
            <Text style={styles.waitingTurnText}>
              {turnEnded ? '✓ Aguardando outros jogadores...' : `Vez de ${currentPlayerName}...`}
            </Text>
          </View>
        )}
      </View>

      {/* Relatório de batalha */}
      {showReport && lastReport && (
        <BattleReportModal
          visible={showReport}
          report={lastReport}
          state={gameState}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Chat modal */}
      <Modal visible={showChat} transparent animationType="slide" onRequestClose={() => setShowChat(false)}>
        <View style={styles.chatModal}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatModalHeader}>
              <Text style={styles.chatModalTitle}>CHAT</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Text style={styles.chatModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={mpState.chat}
              keyExtractor={(_, i) => String(i)}
              style={styles.chatList}
              renderItem={({ item }) => (
                <Text style={styles.chatMsg}>
                  <Text style={{ color: item.playerId === myPlayerId ? '#66bb6a' : '#42a5f5' }}>
                    {item.playerName}:{' '}
                  </Text>
                  {item.message}
                </Text>
              )}
            />
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Mensagem..."
                placeholderTextColor="#555"
                onSubmitEditing={handleSendChat}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChat}>
                <Text style={styles.chatSendText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#546e7a', fontSize: 16 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#050510', borderBottomWidth: 1, borderBottomColor: '#0a3a4a' },
  hudLeft: { flex: 1 },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hudTurn: { color: '#0a7ea4', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  hudPlayer: { color: '#90a4ae', fontSize: 12 },
  hudPlanets: { color: '#e0f7fa', fontWeight: '700', fontSize: 14 },
  chatToggle: { padding: 4, position: 'relative' },
  chatToggleText: { fontSize: 20 },
  chatBadge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef5350' },
  turnStatus: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#050510', gap: 12, flexWrap: 'wrap' },
  turnStatusPlayer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  turnStatusDot: { width: 8, height: 8, borderRadius: 4 },
  turnStatusName: { color: '#546e7a', fontSize: 11, maxWidth: 60 },
  turnStatusCheck: { color: '#66bb6a', fontSize: 11, fontWeight: '900' },
  mapContainer: { flex: 1 },
  orderPanel: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#1a3a4a', gap: 8 },
  orderText: { color: '#e0f7fa', fontWeight: '700', fontSize: 14, flex: 1 },
  orderInput: { backgroundColor: '#050510', borderWidth: 1, borderColor: '#1a3a4a', borderRadius: 8, color: '#e0f7fa', padding: 8, width: 90, textAlign: 'center' },
  orderBtn: { backgroundColor: '#0a7ea4', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  orderBtnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  pendingScroll: { maxHeight: 36, paddingHorizontal: 8 },
  pendingChip: { backgroundColor: '#0a3a4a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6 },
  pendingChipText: { color: '#42a5f5', fontSize: 11 },
  bottomBar: { padding: 10, backgroundColor: '#050510', borderTopWidth: 1, borderTopColor: '#0a3a4a' },
  endTurnBtn: { backgroundColor: '#0a7ea4', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  endTurnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  waitingTurn: { backgroundColor: '#0d1b2a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  waitingTurnText: { color: '#546e7a', fontSize: 13 },
  chatModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  chatModalContent: { backgroundColor: '#0d1b2a', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', overflow: 'hidden' },
  chatModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a3a4a' },
  chatModalTitle: { color: '#e0f7fa', fontWeight: '900', letterSpacing: 2 },
  chatModalClose: { color: '#546e7a', fontSize: 18 },
  chatList: { flex: 1, padding: 12 },
  chatMsg: { color: '#90a4ae', fontSize: 13, marginBottom: 6 },
  chatInputRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1a3a4a' },
  chatInput: { flex: 1, color: '#e0f7fa', padding: 12, fontSize: 14 },
  chatSendBtn: { paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#0a7ea4' },
  chatSendText: { color: '#fff', fontWeight: '900' },
});
