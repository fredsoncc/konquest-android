import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Planet, NEUTRAL_ID } from '@/lib/game-engine';

interface PlanetCellProps {
  planet: Planet;
  playerColor: string;
  isSelected: boolean;
  isTarget: boolean;
  cellSize: number;
  cellMargin?: number;
  onPress: (name: string) => void;
  currentPlayerId: string;
  blindMap: boolean;
}

// Símbolos de planetas (estilo Konquest)
const PLANET_SYMBOLS = ['◉', '◎', '⊕', '⊙', '◈', '◆', '●', '◐', '◑'];

export function PlanetCell({
  planet,
  playerColor,
  isSelected,
  isTarget,
  cellSize,
  cellMargin = 2,
  onPress,
  currentPlayerId,
  blindMap,
}: PlanetCellProps) {
  const isOwned = planet.ownerId === currentPlayerId;
  const isNeutral = planet.ownerId === NEUTRAL_ID || planet.ownerId === null;
  const symbol = PLANET_SYMBOLS[planet.look % PLANET_SYMBOLS.length];

  const showInfo = !blindMap || isOwned || !isNeutral;

  const borderColor = isSelected
    ? '#ffd54f'
    : isTarget
    ? '#ef5350'
    : playerColor;

  const bgColor = isSelected
    ? `${playerColor}44`
    : isTarget
    ? '#ef535033'
    : `${playerColor}18`;

  // Tamanhos proporcionais ao cellSize
  const symbolSize = Math.round(cellSize * 0.42);
  const nameFontSize = Math.max(9, Math.round(cellSize * 0.18));
  const shipsFontSize = Math.max(10, Math.round(cellSize * 0.22));

  return (
    <Pressable
      onPress={() => onPress(planet.name)}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          margin: cellMargin,
          borderColor,
          borderWidth: isSelected || isTarget ? 2.5 : 1.5,
          backgroundColor: bgColor,
          borderRadius: Math.round(cellSize * 0.14),
        },
      ]}
    >
      {/* Planeta símbolo — centro */}
      <Text
        style={[styles.symbol, { color: playerColor, fontSize: symbolSize }]}
        numberOfLines={1}
      >
        {symbol}
      </Text>

      {/* Nome do planeta — canto superior esquerdo */}
      <Text
        style={[styles.name, { color: '#cfd8dc', fontSize: nameFontSize }]}
        numberOfLines={1}
      >
        {planet.name}
      </Text>

      {/* Quantidade de naves — canto inferior direito */}
      {showInfo && (
        <View style={styles.shipsContainer}>
          <Text
            style={[styles.ships, { color: isOwned ? '#ffd54f' : '#90a4ae', fontSize: shipsFontSize }]}
            numberOfLines={1}
          >
            {planet.ships}
          </Text>
        </View>
      )}

      {/* Indicador de produção — canto inferior esquerdo (só planetas do jogador) */}
      {isOwned && (
        <View style={styles.prodContainer}>
          <Text style={[styles.prod, { fontSize: Math.max(8, nameFontSize - 1) }]}>
            +{planet.production}
          </Text>
        </View>
      )}

      {/* Borda de seleção pulsante */}
      {(isSelected || isTarget) && (
        <View
          style={[
            styles.selectionGlow,
            {
              borderColor,
              borderRadius: Math.round(cellSize * 0.14) + 3,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  symbol: {
    fontWeight: 'bold',
  },
  name: {
    position: 'absolute',
    top: 3,
    left: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  shipsContainer: {
    position: 'absolute',
    bottom: 3,
    right: 4,
  },
  ships: {
    fontWeight: '900',
  },
  prodContainer: {
    position: 'absolute',
    bottom: 3,
    left: 4,
  },
  prod: {
    color: '#66bb6a',
    fontWeight: '700',
  },
  selectionGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 1.5,
    opacity: 0.5,
  },
});
