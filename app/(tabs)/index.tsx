import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

// Star field component
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    top: `${(i * 1.7) % 100}%`,
    left: `${(i * 2.3) % 100}%`,
    size: i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1,
    opacity: 0.3 + (i % 7) * 0.1,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map(s => (
        <View
          key={s.id}
          style={{
            position: 'absolute',
            top: s.top as any,
            left: s.left as any,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: '#ffffff',
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScreenContainer containerClassName="bg-[#0a0a1a]" edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <StarField />

        {/* Logo / Title */}
        <View style={styles.heroSection}>
          <Text style={styles.logoSymbol}>◉</Text>
          <Text style={styles.title}>KONQUEST</Text>
          <Text style={styles.subtitle}>Conquista Galáctica</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>
            Expanda seu império interestelar.{'\n'}Esmague seus rivais.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsSection}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/new-game')}
          >
            <Text style={styles.primaryBtnText}>🚀  Novo Jogo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/help')}
          >
            <Text style={styles.secondaryBtnText}>📖  Como Jogar</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Baseado em Konquest — KDE Games{'\n'}
          GPL-2.0+ · Porte React Native
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#0a0a1a',
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoSymbol: {
    fontSize: 72,
    color: '#4fc3f7',
    marginBottom: 8,
    textShadowColor: '#4fc3f7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#e0e0e0',
    letterSpacing: 8,
    textShadowColor: '#4fc3f7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#4fc3f7',
    letterSpacing: 4,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#4fc3f7',
    marginVertical: 20,
    opacity: 0.5,
  },
  tagline: {
    color: '#78909c',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#0a0a1a',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#4fc3f7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: '#4fc3f7',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  footer: {
    color: '#1e3a5f',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
});
