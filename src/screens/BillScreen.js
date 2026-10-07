import { useState, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import {
  closeBill,
  formatBaht,
  getBillById,
  getBillTotal,
  listBillLines,
  listRoundTotals,
} from '../db';
import { colors, radius, spacing } from '../style/theme';

const STATUS_TEXT = {
  pending: 'รอครัวรับ',
  cooking: 'กำลังทำ',
  served: 'เสิร์ฟแล้ว',
  cancelled: 'ยกเลิกแล้ว',
};

export default function BillScreen({ table, billId, onAddMore, onBillClosed }) {
  const db = useSQLiteContext();

  const [bill, setBill] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [lines, setLines] = useState([]);
  const [total, setTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);

  async function reload() {
    setBill(await getBillById(db, billId));
    setRounds(await listRoundTotals(db, billId));
    setLines(await listBillLines(db, billId));

    const sum = await getBillTotal(db, billId);
    setTotal(sum.total_satang);
    setQuantity(sum.total_quantity);
  }

  useEffect(() => {
    async function loadFirstTime() {
      await reload();
    }
    loadFirstTime();
    // โหลดครั้งเดียวตอนเข้าหน้า ไม่ใส่ reload ในวงเล็บ ไม่งั้นจะวนโหลดไม่จบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCloseBill() {
    Alert.alert(
      'ปิดบิลโต๊ะนี้?',
      'เก็บเงิน ' + formatBaht(total) + ' ฿ แล้วปิดบิล ปิดแล้วโต๊ะจะกลับมาว่างและสั่งเพิ่มไม่ได้อีก',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ปิดบิล',
          onPress: async () => {
            try {
              await closeBill(db, billId);
              onBillClosed();
            } catch (e) {
              Alert.alert('ปิดบิลไม่สำเร็จ', e.message);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.tableName}>โต๊ะ {table.table_number}</Text>
          <Text style={styles.cardLine}>บิลเลขที่ {billId}</Text>
          <Text style={styles.cardLine}>เปิดบิล {bill ? bill.opened_at : '-'} น.</Text>
        </View>

        {rounds.map((round) => (
          <View key={round.round_id} style={styles.card}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundTitle}>รอบที่ {round.round_no}</Text>
              <Text style={styles.roundTotal}>{formatBaht(round.round_total_satang)} ฿</Text>
            </View>
            <Text style={styles.roundTime}>สั่งเมื่อ {round.ordered_at} น.</Text>

            {lines
              .filter((line) => line.round_id === round.round_id)
              .map((line) => {
                const isCancelled = line.status === 'cancelled';

                return (
                  <View key={line.order_item_id} style={styles.line}>
                    <View style={styles.lineInfo}>
                      <Text style={[styles.lineName, isCancelled && styles.cancelled]}>
                        {line.item_name} × {line.quantity}
                      </Text>
                      <Text style={styles.lineMeta}>
                        {formatBaht(line.unit_price_satang)} ฿ / จาน · {STATUS_TEXT[line.status]}
                      </Text>
                      {line.note ? <Text style={styles.lineNote}>หมายเหตุ: {line.note}</Text> : null}
                    </View>
                    <Text style={[styles.lineTotal, isCancelled && styles.cancelled]}>
                      {formatBaht(line.line_total_satang)} ฿
                    </Text>
                  </View>
                );
              })}
          </View>
        ))}

        {rounds.length === 0 ? <Text style={styles.empty}>บิลใบนี้ยังไม่มีรายการ</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>ยอดรวมทั้งบิล</Text>
            <Text style={styles.totalNote}>{quantity} จาน (ไม่นับที่ยกเลิก)</Text>
          </View>
          <Text style={styles.totalValue}>{formatBaht(total)} ฿</Text>
        </View>

        <View style={styles.footerButtons}>
          <Pressable style={[styles.button, styles.buttonLight]} onPress={onAddMore}>
            <Text style={styles.buttonLightText}>สั่งเพิ่ม</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonMain]} onPress={handleCloseBill}>
            <Text style={styles.buttonMainText}>ชำระเงินและปิดบิล</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  tableName: { fontSize: 20, fontWeight: '700', color: colors.text },
  cardLine: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  roundHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  roundTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  roundTotal: { fontSize: 16, fontWeight: '700', color: colors.text },
  roundTime: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },

  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  lineInfo: { flex: 1, gap: 2 },
  lineName: { fontSize: 15, color: colors.text },
  lineMeta: { fontSize: 12, color: colors.textMuted },
  lineNote: { fontSize: 12, color: colors.primary },
  lineTotal: { fontSize: 15, fontWeight: '600', color: colors.text },
  cancelled: { textDecorationLine: 'line-through', color: colors.textMuted },

  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },

  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: colors.textMuted },
  totalNote: { fontSize: 12, color: colors.textMuted },
  totalValue: { fontSize: 26, fontWeight: '700', color: colors.text },

  footerButtons: { flexDirection: 'row', gap: spacing.md },
  button: { flex: 1, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  buttonLight: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  buttonLightText: { fontSize: 15, fontWeight: '600', color: colors.text },
  buttonMain: { backgroundColor: colors.primary },
  buttonMainText: { fontSize: 15, fontWeight: '700', color: colors.surface },
});
