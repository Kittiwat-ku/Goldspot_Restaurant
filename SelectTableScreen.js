import { useState, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { formatBaht, listTablesWithStatus } from '../db';
import { colors, radius, spacing } from '../style/theme';

/** หน้าเลือกโต๊ะ โต๊ะที่มีบิลค้างจะเป็นการ์ดสีส้มพร้อมยอดที่ค้างอยู่ */
export default function SelectTableScreen({ onSelectTable }) {
  const db = useSQLiteContext();
  const [tables, setTables] = useState([]);

  // แท็บเล็ตประจำโต๊ะจอกว้างกว่ามือถือมาก คำนวณจำนวนคอลัมน์จากความกว้างจริง
  const { width } = useWindowDimensions();
  const numColumns = Math.min(6, Math.max(3, Math.floor(width / 200)));

  // SQLite ไม่ได้บอก React ว่ามีอะไรเปลี่ยน ต้องสั่งอ่านเอง
  async function reload() {
    setTables(await listTablesWithStatus(db));
  }

  useEffect(() => {
    async function loadFirstTime() {
      await reload();
    }
    loadFirstTime();
    // โหลดครั้งเดียวตอนเข้าหน้า ไม่ใส่ reload ในวงเล็บ ไม่งั้นจะวนโหลดไม่จบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const occupied = tables.filter((table) => table.open_bill_id !== null).length;

  return (
    <FlatList
      data={tables}
      keyExtractor={(table) => String(table.table_id)}
      numColumns={numColumns}
      key={numColumns}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.column}
      onRefresh={reload}
      refreshing={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>เลือกโต๊ะของคุณ</Text>
          <View style={styles.legendRow}>
            <Text style={styles.legendFree}>● ว่าง {tables.length - occupied} โต๊ะ</Text>
            <Text style={styles.legendOccupied}>● มีบิลค้าง {occupied} โต๊ะ</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const isOccupied = item.open_bill_id !== null;

        return (
          <Pressable
            onPress={() => onSelectTable(item)}
            style={[styles.card, isOccupied ? styles.cardOccupied : styles.cardFree]}
          >
            <Text style={styles.tableNumber}>{item.table_number}</Text>
            <Text style={styles.seats}>{item.seats} ที่นั่ง</Text>

            {isOccupied ? (
              <View style={styles.statusBlock}>
                <Text style={styles.statusOccupied}>มีบิลค้าง</Text>
                <Text style={styles.amount}>{formatBaht(item.total_satang)} ฿</Text>
                {/* opened_at เก็บเป็น "2026-09-29 19:37:35" ตัดเอาเฉพาะเวลา */}
                <Text style={styles.openedAt}>เปิด {item.opened_at.slice(11, 16)} น.</Text>
              </View>
            ) : (
              <Text style={styles.statusFree}>ว่าง</Text>
            )}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  column: { gap: spacing.md },
  header: { marginBottom: spacing.lg, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  legendRow: { flexDirection: 'row', gap: spacing.lg },
  legendFree: { fontSize: 13, color: colors.free },
  legendOccupied: { fontSize: 13, color: colors.occupied },

  card: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
    minHeight: 124,
    maxWidth: 260,
  },
  cardFree: { backgroundColor: colors.surface, borderColor: colors.border },
  cardOccupied: { backgroundColor: colors.occupiedSoft, borderColor: colors.occupied },

  tableNumber: { fontSize: 28, fontWeight: '700', color: colors.text },
  seats: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  statusBlock: { marginTop: spacing.sm, alignItems: 'center', gap: 2 },
  statusFree: { marginTop: spacing.sm, fontSize: 13, fontWeight: '600', color: colors.free },
  statusOccupied: { fontSize: 13, fontWeight: '600', color: '#b26a00' },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text },
  openedAt: { fontSize: 11, color: colors.textMuted },
});
