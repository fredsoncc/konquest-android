import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GameState, Planet, NEUTRAL_ID } from '@/lib/game-engine';
import { PlanetCell } from './PlanetCell';

interface GalaxyMapProps {
  state: GameState;
  selectedPlanet: string | null;
  targetPlanet: string | null;
  onPlanetPress: (name: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GalaxyMap({
  state,
  selectedPlanet,
  targetPlanet,
  onPlanetPress,
}: GalaxyMapProps) {
  const { rows, cols, planets, players, currentPlayerId, options } = state;

  // Calculate cell size to fit the map on screen
  const mapPadding = 8;
  const availableWidth = SCREEN_WIDTH - mapPadding * 2;
  const cellSize = Math.floor(availableWidth / cols) - 2;

  // Build a 2D grid
  const grid = useMemo(() => {
    const g: (Planet | null)[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(null),
    );
    for (const planet of Object.values(planets)) {
      g[planet.coord.row][planet.coord.col] = planet;
    }
    return g;
  }, [planets, rows, cols]);

  return (
    <View style={[styles.container, { padding: mapPadding }]}>
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((planet, c) => {
            if (!planet) {
              // Empty space cell
              return (
                <View
                  key={`${r}-${c}`}
                  style={[
                    styles.emptyCell,
                    { width: cellSize, height: cellSize },
                  ]}
                >
                  {/* Occasional star dot */}
                  {(r * cols + c) % 7 === 0 && (
                    <View style={styles.star} />
                  )}
                </View>
              );
            }

            const ownerId = planet.ownerId ?? NEUTRAL_ID;
            const playerColor =
              ownerId === NEUTRAL_ID
                ? '#78909c'
                : players[ownerId]?.color ?? '#78909c';

            return (
              <PlanetCell
                key={planet.name}
                planet={planet}
                playerColor={playerColor}
                isSelected={selectedPlanet === planet.name}
                isTarget={targetPlanet === planet.name}
                cellSize={cellSize}
                onPress={onPlanetPress}
                currentPlayerId={currentPlayerId}
                blindMap={options.blindMap}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a1a',
  },
  row: {
    flexDirection: 'row',
  },
  emptyCell: {
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a1a',
  },
  star: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff44',
  },
});
