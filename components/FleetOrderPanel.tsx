import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { AttackFleet } from '@/lib/game-engine';

interface FleetOrderPanelProps {
  orders: AttackFleet[];
  onCancel: (id: string) => void;
}

export function FleetOrderPanel({ orders, onCancel }: FleetOrderPanelProps) {
  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nenhuma ordem enviada.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item.id}
      style={styles.list}
      renderItem={({ item }) => (
        <View style={styles.orderRow}>
          <Text style={styles.orderText} numberOfLines={1}>
            🚀 {item.sourceName} → {item.destName}
            {'  '}
            <Text style={styles.ships}>{item.ships} naves</Text>
            {'  '}
            <Text style={styles.arrival}>chega T{item.arrivalTurn}</Text>
          </Text>
          <Pressable
            style={styles.cancelBtn}
            onPress={() => onCancel(item.id)}
          >
            <Text style={styles.cancelText}>✕</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 120,
  },
  empty: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  emptyText: {
    color: '#78909c',
    fontSize: 12,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  orderText: {
    flex: 1,
    color: '#e0e0e0',
    fontSize: 12,
  },
  ships: {
    color: '#ffd54f',
    fontWeight: 'bold',
  },
  arrival: {
    color: '#78909c',
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    color: '#ef5350',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
