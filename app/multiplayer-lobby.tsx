import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Alert, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useMultiplayer } from '@/lib/multiplayer-client';
import type { GameState } from '@/lib/game-engine';

export default function MultiplayerLobbyScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [totalPlanets, setTotalPlanets] = useState(20);
  const [maxTurns, setMaxTurns] = useState(30);
  const [chatInput, setChatInput] = useState('');

  const handleGameStarted = useCallback((_state: GameState, myPlayerId: string) => {
    router.push({ pathname: '/multiplayer-game', params: { myPlayerId } });
  }, [router]);

  const { mpState, actions } = useMultiplayer(handleGameStarted);
  const isInRoom = mpState.phase === 'lobby';
  const isConnecting = mpState.phase === 'connecting';

  function handleCreate() {
    actions.createRoom(playerName.trim() || 'Jogador 1', maxPlayers, totalPlanets, maxTurns);
  }

  function handleJoin() {
    if (!joinCode.trim()) { Alert.alert('Código inválido', 'Digite o código da sala.'); return; }
    actions.joinRoom(joinCode.trim(), playerName.trim() || 'Jogador');
  }

  function handleChat() {
    if (!chatInput.trim()) return;
    actions.sendChat(chatInput.trim());
    setChatInput('');
  }

  // ── Lobby (dentro da sala) ───────────────────────────────────────────────────
  if (isInRoom) {
    const me = mpState.players.find(p => p.id === mpState.myPlayerId);
    const isReady = me?.isReady ?? false;
    const allReady = mpState.players.length >= 2 && mpState.players.every(p => p.isReady);

    return (
      <ScreenContainer containerClassName="bg-[#0a0a1a]">
        <ScrollView contentContainerStyle={styles.lobbyContainer}>
          <View style={styles.lobbyHeader}>
            <Text style={styles.lobbyTitle}>SALA DE ESPERA</Text>
            <View style={styles.roomCodeBox}>
              <Text style={styles.roomCodeLabel}>CÓDIGO DA SALA</Text>
              <Text style={styles.roomCode}>{mpState.roomCode}</Text>
              <Text style={styles.roomCodeHint}>Compartilhe com seus amigos</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>JOGADORES ({mpState.players.length}/{maxPlayers})</Text>
          {mpState.players.map(player => (
            <View key={player.id} style={styles.playerRow}>
              <View style={[styles.playerColor, { backgroundColor: player.color }]} />
              <Text style={styles.playerName}>{player.name}{player.id === mpState.myPlayerId ? ' (você)' : ''}</Text>
              <View style={[styles.readyBadge, player.isReady ? styles.readyBadgeOn : styles.readyBadgeOff]}>
                <Text style={styles.readyBadgeText}>{player.isReady ? 'PRONTO' : 'AGUARDANDO'}</Text>
              </View>
            </View>
          ))}

          {allReady && (
            <View style={styles.allReadyBanner}>
              <Text style={styles.allReadyText}>Todos prontos! Iniciando...</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>CHAT</Text>
          <View style={styles.chatBox}>
            <FlatList
              data={mpState.chat}
              keyExtractor={(_, i) => String(i)}
              style={styles.chatList}
              renderItem={({ item }) => (
                <Text style={styles.chatMsg}>
                  <Text style={{ color: '#42a5f5' }}>{item.playerName}: </Text>
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
                onSubmitEditing={handleChat}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={handleChat}>
                <Text style={styles.chatSendText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {mpState.error && <Text style={styles.errorText}>{mpState.error}</Text>}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.readyBtn, isReady ? styles.readyBtnOn : styles.readyBtnOff]}
              onPress={actions.toggleReady}
            >
              <Text style={styles.readyBtnText}>{isReady ? '✓ PRONTO' : 'MARCAR PRONTO'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leaveBtn} onPress={actions.disconnect}>
              <Text style={styles.leaveBtnText}>SAIR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Formulário criar/entrar ──────────────────────────────────────────────────
  return (
    <ScreenContainer containerClassName="bg-[#0a0a1a]">
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>MULTIPLAYER</Text>
        <Text style={styles.subtitle}>Jogue com amigos via Wi-Fi ou pela internet</Text>

        <View style={styles.tabs}>
          {(['create', 'join'] as const).map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'create' ? 'Criar Sala' : 'Entrar na Sala'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Seu nome</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Ex: Almirante Silva"
          placeholderTextColor="#555"
          maxLength={20}
        />

        {tab === 'create' ? (
          <>
            <Text style={styles.label}>Número de jogadores: {maxPlayers}</Text>
            <View style={styles.stepper}>
              {[2, 3, 4].map(n => (
                <TouchableOpacity key={n} style={[styles.stepBtn, maxPlayers === n && styles.stepBtnActive]} onPress={() => setMaxPlayers(n)}>
                  <Text style={[styles.stepBtnText, maxPlayers === n && styles.stepBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Planetas no mapa: {totalPlanets}</Text>
            <View style={styles.stepper}>
              {[12, 16, 20, 24].map(n => (
                <TouchableOpacity key={n} style={[styles.stepBtn, totalPlanets === n && styles.stepBtnActive]} onPress={() => setTotalPlanets(n)}>
                  <Text style={[styles.stepBtnText, totalPlanets === n && styles.stepBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Turnos máximos: {maxTurns}</Text>
            <View style={styles.stepper}>
              {[20, 30, 40, 50].map(n => (
                <TouchableOpacity key={n} style={[styles.stepBtn, maxTurns === n && styles.stepBtnActive]} onPress={() => setMaxTurns(n)}>
                  <Text style={[styles.stepBtnText, maxTurns === n && styles.stepBtnTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mpState.error && <Text style={styles.errorText}>{mpState.error}</Text>}
            <TouchableOpacity style={[styles.mainBtn, isConnecting && styles.mainBtnDisabled]} onPress={handleCreate} disabled={isConnecting}>
              {isConnecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>🚀 CRIAR SALA</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Código da sala</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={joinCode}
              onChangeText={t => setJoinCode(t.toUpperCase())}
              placeholder="Ex: AB3X7K"
              placeholderTextColor="#555"
              maxLength={6}
              autoCapitalize="characters"
            />
            {mpState.error && <Text style={styles.errorText}>{mpState.error}</Text>}
            <TouchableOpacity style={[styles.mainBtn, isConnecting && styles.mainBtnDisabled]} onPress={handleJoin} disabled={isConnecting}>
              {isConnecting ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>🌌 ENTRAR NA SALA</Text>}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Como funciona</Text>
          <Text style={styles.infoText}>
            {'• '}
            <Text style={{ color: '#42a5f5' }}>Wi-Fi local:</Text>
            {' todos na mesma rede\n• '}
            <Text style={{ color: '#66bb6a' }}>Online:</Text>
            {' qualquer lugar via servidor na nuvem\n• Compartilhe o código de 6 letras\n• Todos marcam "Pronto" para iniciar\n• Cada jogador envia ordens e encerra o turno'}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  lobbyContainer: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#42a5f5', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#e0f7fa', letterSpacing: 4, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#546e7a', textAlign: 'center', marginBottom: 24 },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#1a3a4a' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#0d1b2a' },
  tabActive: { backgroundColor: '#0a7ea4' },
  tabText: { color: '#546e7a', fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  label: { color: '#90a4ae', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0d1b2a', borderWidth: 1, borderColor: '#1a3a4a', borderRadius: 10, color: '#e0f7fa', padding: 12, fontSize: 16 },
  codeInput: { fontSize: 24, fontWeight: '900', letterSpacing: 8, textAlign: 'center' },
  stepper: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  stepBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#0d1b2a', borderWidth: 1, borderColor: '#1a3a4a', alignItems: 'center' },
  stepBtnActive: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  stepBtnText: { color: '#546e7a', fontWeight: '700' },
  stepBtnTextActive: { color: '#fff' },
  mainBtn: { backgroundColor: '#0a7ea4', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  mainBtnDisabled: { opacity: 0.5 },
  mainBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  errorText: { color: '#ef5350', textAlign: 'center', marginTop: 8, fontSize: 13 },
  infoBox: { marginTop: 28, backgroundColor: '#0d1b2a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1a3a4a' },
  infoTitle: { color: '#90a4ae', fontWeight: '700', marginBottom: 8, fontSize: 13 },
  infoText: { color: '#546e7a', fontSize: 12, lineHeight: 20 },
  lobbyHeader: { alignItems: 'center', marginBottom: 20 },
  lobbyTitle: { fontSize: 22, fontWeight: '900', color: '#e0f7fa', letterSpacing: 4, marginBottom: 12 },
  roomCodeBox: { backgroundColor: '#0d1b2a', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#0a7ea4', width: '100%' },
  roomCodeLabel: { color: '#546e7a', fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  roomCode: { fontSize: 36, fontWeight: '900', color: '#0a7ea4', letterSpacing: 10 },
  roomCodeHint: { color: '#546e7a', fontSize: 11, marginTop: 4 },
  sectionTitle: { color: '#90a4ae', fontSize: 12, letterSpacing: 2, marginBottom: 8, marginTop: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1b2a', borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  playerColor: { width: 14, height: 14, borderRadius: 7 },
  playerName: { flex: 1, color: '#e0f7fa', fontWeight: '700' },
  readyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  readyBadgeOn: { backgroundColor: '#1b5e20' },
  readyBadgeOff: { backgroundColor: '#1a2a3a' },
  readyBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  allReadyBanner: { backgroundColor: '#1b5e20', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  allReadyText: { color: '#66bb6a', fontWeight: '900', fontSize: 15 },
  chatBox: { backgroundColor: '#0d1b2a', borderRadius: 12, borderWidth: 1, borderColor: '#1a3a4a', overflow: 'hidden', height: 180 },
  chatList: { flex: 1, padding: 8 },
  chatMsg: { color: '#90a4ae', fontSize: 12, marginBottom: 4 },
  chatInputRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1a3a4a' },
  chatInput: { flex: 1, color: '#e0f7fa', padding: 10, fontSize: 13 },
  chatSendBtn: { paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#0a7ea4' },
  chatSendText: { color: '#fff', fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  readyBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  readyBtnOn: { backgroundColor: '#1b5e20' },
  readyBtnOff: { backgroundColor: '#0a7ea4' },
  readyBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  leaveBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a2a3a', borderWidth: 1, borderColor: '#ef5350' },
  leaveBtnText: { color: '#ef5350', fontWeight: '700' },
});
