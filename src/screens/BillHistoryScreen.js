import { useState, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { formatBaht, listClosedBills } from '../db';
import { colors, radius, spacing } from '../style/theme';


export default function BillHistoryScreen({ onOpenBill }) {
  const db = useSQLiteContext();
  const [bills, setBills] = useState([]);

  async function reload() {
    setBills(await listClosedBills(db));
  }

  useEffect(() => {
    async function loadFirstTime() {
      await reload();
    }
    loadFirstTime();
    // โหลดครั้งเดียวตอนเข้าหน้า ไม่ใส่ reload ในวงเล็บ ไม่งั้นจะวนโหลดไม่จบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FlatList
      data={bills}
      keyExtractor={(bill) => String(bill.bill_id)}
      contentContainerStyle={styles.content}
      onRefresh={reload}
      refreshing={false}
      ListHeaderComponent={
        <Text style={styles.summary}>บิลที่ปิดแล้ว {bills.length} ใบ · ปิดล่าสุดอยู่บนสุด</Text>
      }
      ListEmptyComponent={<Text style={styles.empty}>ยังไม่มีบิลที่ปิดแล้ว</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpenBill(item)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.cardLeft}>
            <Text style={styles.billTitle}>
              บิลเลขที่ {item.bill_id} · โต๊ะ {item.table_number}
            </Text>
            {/* เวลาเก็บเป็น "2026-09-29 19:37:35" ตัดเอาวันที่กับชั่วโมง:นาที */}
            <Text style={styles.billMeta}>
              {item.closed_at.slice(0, 10)} · เปิด {item.opened_at.slice(11, 16)} น. · ปิด{' '}
              {item.closed_at.slice(11, 16)} น.
            </Text>
            <Text style={styles.billMeta}>{item.total_quantity} จาน</Text>
          </View>
          <Text style={styles.billTotal}>{formatBaht(item.total_satang)} ฿</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  summary: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.6 },
  cardLeft: { flex: 1, gap: 2 },
  billTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  billMeta: { fontSize: 13, color: colors.textMuted },
  billTotal: { fontSize: 18, fontWeight: '700', color: colors.text },
  chevron: { fontSize: 24, color: colors.textMuted },
});
