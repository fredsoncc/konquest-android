import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { GameState, Planet, NEUTRAL_ID } from '@/lib/game-engine';
import { PlanetCell } from './PlanetCell';

interface GalaxyMapProps {
  state: GameState;
  selectedPlanet: string | null;
  targetPlanet: string | null;
  onPlanetPress: (name: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Tamanho mínimo de célula para boa usabilidade em toque
const MIN_CELL_SIZE = 64;
// Tamanho máximo para não desperdiçar espaço em mapas pequenos
const MAX_CELL_SIZE = 90;

export function GalaxyMap({
  state,
  selectedPlanet,
  targetPlanet,
  onPlanetPress,
}: GalaxyMapProps) {
  const { rows, cols, planets, players, currentPlayerId, options } = state;

  // Calcula o tamanho ideal da célula:
  // Tenta caber na tela sem scroll; se não couber, usa o mínimo (scroll ativado)
  const mapPadding = 8;
  const cellMargin = 2;
  const availableWidth = SCREEN_WIDTH - mapPadding * 2;
  const fittedSize = Math.floor((availableWidth - cellMargin * 2 * cols) / cols);
  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, fittedSize));

  const mapWidth = cols * (cellSize + cellMargin * 2) + mapPadding * 2;
  const mapHeight = rows * (cellSize + cellMargin * 2) + mapPadding * 2;

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

  const mapContent = (
    <View style={[styles.mapInner, { width: mapWidth, height: mapHeight, padding: mapPadding }]}>
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((planet, c) => {
            if (!planet) {
              return (
                <View
                  key={`${r}-${c}`}
                  style={[
                    styles.emptyCell,
                    { width: cellSize, height: cellSize, margin: cellMargin },
                  ]}
                >
                  {(r * cols + c) % 7 === 0 && <View style={styles.star} />}
                  {(r * cols + c) % 13 === 0 && <View style={styles.starSmall} />}
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
                cellMargin={cellMargin}
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

  // Se o mapa cabe na tela → sem scroll. Se não cabe → scroll em ambas as direções.
  const needsHScroll = mapWidth > SCREEN_WIDTH;
  const needsVScroll = mapHeight > SCREEN_HEIGHT * 0.55;

  if (!needsHScroll && !needsVScroll) {
    return (
      <View style={styles.container}>
        {mapContent}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={needsVScroll}
      scrollEnabled={needsVScroll}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={needsHScroll}
        scrollEnabled={needsHScroll}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {mapContent}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  mapInner: {
    backgroundColor: '#0a0a1a',
  },
  row: {
    flexDirection: 'row',
  },
  emptyCell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a1a',
  },
  star: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#ffffff55',
  },
  starSmall: {
    width: 1.5,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: '#ffffff33',
    position: 'absolute',
    top: '30%',
    left: '70%',
  },
});
