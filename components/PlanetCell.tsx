import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Planet, NEUTRAL_ID } from '@/lib/game-engine';

interface PlanetCellProps {
  planet: Planet;
  playerColor: string;
  isSelected: boolean;
  isTarget: boolean;
  cellSize: number;
  onPress: (name: string) => void;
  currentPlayerId: string;
  blindMap: boolean;
}

// Planet shape symbols (inspired by Konquest visual styles)
const PLANET_SYMBOLS = ['◉', '◎', '⊕', '⊙', '◈', '◆', '●', '◐', '◑'];

export function PlanetCell({
  planet,
  playerColor,
  isSelected,
  isTarget,
  cellSize,
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

  return (
    <Pressable
      onPress={() => onPress(planet.name)}
      style={[
        styles.cell,
        {
          width: cellSize,
          height: cellSize,
          borderColor,
          borderWidth: isSelected || isTarget ? 2 : 1.5,
          backgroundColor: isSelected
            ? `${playerColor}33`
            : isTarget
            ? '#ef535022'
            : '#0d1b2a',
        },
      ]}
    >
      {/* Planet symbol */}
      <Text
        style={[
          styles.symbol,
          { color: playerColor, fontSize: cellSize * 0.38 },
        ]}
      >
        {symbol}
      </Text>

      {/* Planet name */}
      <Text
        style={[
          styles.name,
          { color: '#e0e0e0', fontSize: cellSize * 0.22 },
        ]}
        numberOfLines={1}
      >
        {planet.name}
      </Text>

      {/* Ship count */}
      {showInfo && (
        <Text
          style={[
            styles.ships,
            { color: '#ffd54f', fontSize: cellSize * 0.2 },
          ]}
          numberOfLines={1}
        >
          {planet.ships}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    overflow: 'hidden',
  },
  symbol: {
    fontWeight: 'bold',
    lineHeight: undefined,
  },
  name: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontWeight: 'bold',
  },
  ships: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontWeight: 'bold',
  },
});
