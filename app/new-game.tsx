import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useGame, buildPlayers } from '@/lib/game-context';
import { PLAYER_COLORS } from '@/lib/game-engine';
import { ScreenContainer } from '@/components/screen-container';

interface PlayerConfig {
  name: string;
  isAI: boolean;
}

const DEFAULT_PLAYERS: PlayerConfig[] = [
  { name: 'Jogador 1', isAI: false },
  { name: 'Computador', isAI: true },
];

export default function NewGameScreen() {
  const { startGame } = useGame();

  const [players, setPlayers] = useState<PlayerConfig[]>(DEFAULT_PLAYERS);
  const [numPlanets, setNumPlanets] = useState('10');
  const [maxTurns, setMaxTurns] = useState('20');

  const addPlayer = () => {
    if (players.length >= 4) return;
    setPlayers(prev => [
      ...prev,
      { name: `Jogador ${prev.length + 1}`, isAI: false },
    ]);
  };

  const removePlayer = (idx: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePlayer = (idx: number, field: keyof PlayerConfig, value: string | boolean) => {
    setPlayers(prev =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  };

  const handleStart = () => {
    const planets = parseInt(numPlanets, 10);
    const turns = parseInt(maxTurns, 10);

    if (isNaN(planets) || planets < players.length + 1 || planets > 20) {
      return;
    }
    if (isNaN(turns) || turns < 5 || turns > 100) {
      return;
    }

    const playerDefs = buildPlayers(
      players.map(p => p.name),
      players.map(p => p.isAI),
    );

    startGame(playerDefs, planets, { maxTurns: turns });
    router.replace('/game');
  };

  return (
    <ScreenContainer containerClassName="bg-[#0a0a1a]" edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Nova Galáxia</Text>
        <Text style={styles.subtitle}>Configure sua conquista estelar</Text>

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogadores</Text>
          {players.map((p, i) => (
            <View key={i} style={styles.playerRow}>
              <View style={[styles.colorDot, { backgroundColor: PLAYER_COLORS[i] }]} />
              <TextInput
                style={styles.nameInput}
                value={p.name}
                onChangeText={v => updatePlayer(i, 'name', v)}
                placeholder="Nome"
                placeholderTextColor="#78909c"
                maxLength={16}
              />
              <View style={styles.aiToggle}>
                <Text style={styles.aiLabel}>IA</Text>
                <Switch
                  value={p.isAI}
                  onValueChange={v => updatePlayer(i, 'isAI', v)}
                  trackColor={{ false: '#1e3a5f', true: '#4fc3f7' }}
                  thumbColor={p.isAI ? '#0a0a1a' : '#78909c'}
                />
              </View>
              {players.length > 2 && (
                <Pressable style={styles.removeBtn} onPress={() => removePlayer(i)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}

          {players.length < 4 && (
            <Pressable style={styles.addPlayerBtn} onPress={addPlayer}>
              <Text style={styles.addPlayerText}>+ Adicionar Jogador</Text>
            </Pressable>
          )}
        </View>

        {/* Game Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Planetas no mapa</Text>
            <TextInput
              style={styles.numberInput}
              value={numPlanets}
              onChangeText={setNumPlanets}
              keyboardType="numeric"
              maxLength={2}
              returnKeyType="done"
            />
          </View>
          <Text style={styles.optionHint}>
            Mínimo: {players.length + 1} | Máximo: 20
          </Text>

          <View style={[styles.optionRow, { marginTop: 12 }]}>
            <Text style={styles.optionLabel}>Turnos máximos</Text>
            <TextInput
              style={styles.numberInput}
              value={maxTurns}
              onChangeText={setMaxTurns}
              keyboardType="numeric"
              maxLength={3}
              returnKeyType="done"
            />
          </View>
          <Text style={styles.optionHint}>Entre 5 e 100 turnos</Text>
        </View>

        {/* Start Button */}
        <Pressable style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>🚀 Iniciar Conquista</Text>
        </Pressable>

        {/* Back */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#4fc3f7',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#78909c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffd54f',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1b2a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nameInput: {
    flex: 1,
    color: '#e0e0e0',
    fontSize: 15,
    paddingVertical: 4,
  },
  aiToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiLabel: {
    color: '#78909c',
    fontSize: 12,
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnText: {
    color: '#ef5350',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addPlayerBtn: {
    borderWidth: 1,
    borderColor: '#4fc3f7',
    borderRadius: 10,
    borderStyle: 'dashed',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addPlayerText: {
    color: '#4fc3f7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    color: '#e0e0e0',
    fontSize: 15,
  },
  optionHint: {
    color: '#78909c',
    fontSize: 11,
    marginTop: 2,
  },
  numberInput: {
    backgroundColor: '#0d1b2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4fc3f7',
    color: '#e0e0e0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    width: 70,
  },
  startBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  startBtnText: {
    color: '#0a0a1a',
    fontWeight: 'bold',
    fontSize: 18,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#78909c',
    fontSize: 14,
  },
});
