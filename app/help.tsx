import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

export default function HelpScreen() {
  return (
    <ScreenContainer containerClassName="bg-[#0a0a1a]" edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Como Jogar</Text>
        <Text style={styles.subtitle}>Konquest — Conquista Galáctica</Text>

        <Section title="🎯 Objetivo">
          <Text style={styles.body}>
            Conquiste todos os planetas da galáxia enviando frotas de naves. O último jogador com planetas vence, ou quem tiver mais planetas ao final dos turnos.
          </Text>
        </Section>

        <Section title="🪐 Planetas">
          <Text style={styles.body}>
            Cada planeta possui três atributos importantes:{'\n\n'}
            <Text style={styles.bold}>Nome</Text> — letra identificadora (A, B, C...){'\n'}
            <Text style={styles.bold}>Naves</Text> — número atual de naves defensoras{'\n'}
            <Text style={styles.bold}>Produção</Text> — naves geradas por turno{'\n'}
            <Text style={styles.bold}>Kill %</Text> — eficácia de combate (0.30–0.90)
          </Text>
        </Section>

        <Section title="🚀 Enviando Frotas">
          <Text style={styles.body}>
            1. Toque em um planeta que você controla (origem){'\n'}
            2. Toque no planeta de destino{'\n'}
            3. Digite o número de naves a enviar{'\n'}
            4. Toque em "Enviar"{'\n\n'}
            As naves chegam após turnos proporcionais à distância. Você pode enviar múltiplas frotas por turno.
          </Text>
        </Section>

        <Section title="⚔️ Combate">
          <Text style={styles.body}>
            Quando uma frota chega a um planeta inimigo, ocorre batalha. A cada rodada:{'\n\n'}
            • O defensor rola contra seu Kill % — se menor, destrói 1 nave atacante{'\n'}
            • O atacante rola contra o Kill % do planeta de origem — se menor, destrói 1 nave defensora{'\n\n'}
            O combate continua até um lado ser eliminado. Se o atacante vencer, conquista o planeta com as naves restantes.
          </Text>
        </Section>

        <Section title="🔄 Turno">
          <Text style={styles.body}>
            Cada jogador faz suas ordens e clica "Fim de Turno". Quando todos terminam, as frotas se movem, batalhas ocorrem e planetas produzem novas naves.
          </Text>
        </Section>

        <Section title="🤖 Inteligência Artificial">
          <Text style={styles.body}>
            Jogadores marcados como "IA" jogam automaticamente, atacando os alvos mais vulneráveis próximos a seus planetas.
          </Text>
        </Section>

        <Section title="🏆 Vitória">
          <Text style={styles.body}>
            Vence quem conquistar todos os planetas. Se o limite de turnos for atingido, vence quem tiver mais planetas. Em caso de empate, vence quem tiver mais naves.
          </Text>
        </Section>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: {
    color: '#4fc3f7',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#78909c',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#0d1b2a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  sectionTitle: {
    color: '#ffd54f',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#4fc3f7',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backBtnText: {
    color: '#78909c',
    fontSize: 14,
  },
});
