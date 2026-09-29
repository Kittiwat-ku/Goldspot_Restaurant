import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { MOCK_TABLES } from '../data/mockTables';
import { colors, radius, spacing } from '../theme';


function formatBaht(satang) {
  return (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SelectTableScreen({ onSelectTable }) {

  const { width } = useWindowDimensions();
  const numColumns = Math.min(6, Math.max(3, Math.floor(width / 200)));

  const summary = useMemo(() => {
    const occupied = MOCK_TABLES.filter((table) => table.open_bill_id !== null);
    return {
      occupiedCount: occupied.length,
      freeCount: MOCK_TABLES.length - occupied.length,
    };
  }, []);


  const gridData = useMemo(() => {
    const remainder = MOCK_TABLES.length % numColumns;
    if (remainder === 0) return MOCK_TABLES;
    const fillers = Array.from({ length: numColumns - remainder }, (unused, index) => ({
      table_id: `filler-${index}`,
      isFiller: true,
    }));
    return [...MOCK_TABLES, ...fillers];
  }, [numColumns]);

  return (
    <FlatList
      data={gridData}
      keyExtractor={(table) => String(table.table_id)}
      numColumns={numColumns}
      key={numColumns}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.column}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>เลือกโต๊ะของคุณ</Text>
          <View style={styles.legendRow}>
            <Legend color={colors.free} label={`ว่าง ${summary.freeCount} โต๊ะ`} />
            <Legend color={colors.occupied} label={`มีบิลค้าง ${summary.occupiedCount} โต๊ะ`} />
          </View>
        </View>
      }
      renderItem={({ item }) =>
        item.isFiller ? (
          <View style={styles.cardFiller} />
        ) : (
          <TableCard table={item} onPress={() => onSelectTable(item)} />
        )
      }
    />
  );
}

function Legend({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function TableCard({ table, onPress }) {
  const isOccupied = table.open_bill_id !== null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isOccupied ? styles.cardOccupied : styles.cardFree,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={[styles.tableNumber, isOccupied && styles.tableNumberOccupied]}>
        {table.table_number}
      </Text>
      <Text style={styles.seats}>{table.seats} ที่นั่ง</Text>

      {isOccupied ? (
        <View style={styles.statusBlock}>
          <Text style={styles.statusOccupied}>มีบิลค้าง</Text>
          <Text style={styles.amount}>{formatBaht(table.total_satang)} ฿</Text>
          <Text style={styles.openedAt}>เปิด {table.opened_at} น.</Text>
        </View>
      ) : (
        <View style={styles.statusBlock}>
          <Text style={styles.statusFree}>ว่าง</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  column: { gap: spacing.md },
  header: { marginBottom: spacing.lg, gap: spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  legendRow: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: colors.textMuted },

  card: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
    minHeight: 124,
  },
  cardFree: { backgroundColor: colors.surface, borderColor: colors.border },
  cardOccupied: { backgroundColor: colors.occupiedSoft, borderColor: colors.occupied },
  cardPressed: { opacity: 0.6 },
  cardFiller: { flex: 1, marginBottom: spacing.md },

  tableNumber: { fontSize: 28, fontWeight: '700', color: colors.text },
  tableNumberOccupied: { color: '#b26a00' },
  seats: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  statusBlock: { marginTop: spacing.sm, alignItems: 'center', gap: 2 },
  statusFree: { fontSize: 13, fontWeight: '600', color: colors.free },
  statusOccupied: { fontSize: 13, fontWeight: '600', color: '#b26a00' },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text },
  openedAt: { fontSize: 11, color: colors.textMuted },
});
