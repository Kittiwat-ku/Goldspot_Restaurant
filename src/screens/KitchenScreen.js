import { useState, useEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import {
  cancelOrderItem,
  countKitchenQueueByStatus,
  listKitchenQueue,
  resetEverything,
  resetSalesData,
  updateItemStatus,
} from '../db';
import { colors, radius, spacing } from '../style/theme';

export default function KitchenScreen({ onOpenMenuSettings, onOpenHistory }) {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();

  const [items, setItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [cookingCount, setCookingCount] = useState(0);

  async function reload() {
    setItems(await listKitchenQueue(db));

    const counts = await countKitchenQueueByStatus(db);
    const pending = counts.find((row) => row.status === 'pending');
    const cooking = counts.find((row) => row.status === 'cooking');
    setPendingCount(pending ? pending.item_count : 0);
    setCookingCount(cooking ? cooking.item_count : 0);
  }

  useEffect(() => {
    async function loadFirstTime() {
      await reload();
    }
    loadFirstTime();

    const timer = setInterval(reload, 5000);
    return () => clearInterval(timer);

  }, []);

  async function handleStatus(item, nextStatus) {
    try {
      await updateItemStatus(db, item.order_item_id, nextStatus);
    } catch (e) {

      Alert.alert('เปลี่ยนสถานะไม่ได้', e.message);
    }
    await reload();
  }

  function handleCancel(item) {
    Alert.alert(
      'ยกเลิกรายการนี้?',
      item.item_name + ' × ' + item.quantity + ' ของโต๊ะ ' + item.table_number +
        ' ระบบจะบันทึกเวลาที่ยกเลิกไว้ และตัดออกจากยอดบิลให้',
      [
        { text: 'ไม่ยกเลิก', style: 'cancel' },
        {
          text: 'ยกเลิกรายการ',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrderItem(db, item.order_item_id);
            } catch (e) {
              Alert.alert('ยกเลิกไม่ได้', e.message);
            }
            await reload();
          },
        },
      ]
    );
  }

  function handleReset() {
    Alert.alert('ล้างข้อมูล', 'เลือกว่าจะล้างแค่ไหน', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ล้างเฉพาะการขาย',
        onPress: async () => {
          await resetSalesData(db);
          await reload();
        },
      },
      {
        text: 'ล้างทั้งหมด',
        style: 'destructive',
        onPress: async () => {
          await resetEverything(db);
          await reload();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.statsBar}>
        <Text style={styles.statPending}>● รอครัวรับ {pendingCount}</Text>
        <Text style={styles.statCooking}>● กำลังทำ {cookingCount}</Text>
        <View style={styles.spacer} />
        <Pressable style={styles.smallButton} onPress={onOpenMenuSettings}>
          <Text style={styles.smallButtonText}>ตั้งค่าเมนู</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={onOpenHistory}>
          <Text style={styles.smallButtonText}>บิลย้อนหลัง</Text>
        </Pressable>
        <Pressable style={styles.smallButton} onPress={reload}>
          <Text style={styles.smallButtonText}>รีเฟรช</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.order_item_id)}
        numColumns={width >= 900 ? 2 : 1}
        key={width >= 900 ? 'wide' : 'narrow'}
        columnWrapperStyle={width >= 900 ? styles.column : undefined}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>ไม่มีรายการค้างในครัว</Text>}
        renderItem={({ item }) => {
          const isPending = item.status === 'pending';

          return (
            <View style={[styles.card, isPending ? styles.cardPending : styles.cardCooking]}>
              <View style={styles.cardHeader}>
                <Text style={styles.tableName}>โต๊ะ {item.table_number}</Text>
                <Text style={isPending ? styles.badgePending : styles.badgeCooking}>
                  {isPending ? 'รอครัวรับ' : 'กำลังทำ'}
                </Text>
              </View>

              <Text style={styles.itemName}>
                {item.item_name} × {item.quantity}
              </Text>
              {item.options_text ? <Text style={styles.itemOptions}>+ {item.options_text}</Text> : null}
              {/* ordered_at เก็บเป็น "2026-09-29 19:37:35" ตัดเอาเฉพาะเวลา */}
              <Text style={styles.itemMeta}>
                รอบที่ {item.round_no} · สั่งเมื่อ {item.ordered_at.slice(11, 16)} น.
              </Text>
              {item.note ? <Text style={styles.itemNote}>หมายเหตุ: {item.note}</Text> : null}

              <View style={styles.cardButtons}>
                {isPending ? (
                  <>
                    <Pressable
                      style={[styles.button, styles.buttonMain]}
                      onPress={() => handleStatus(item, 'cooking')}
                    >
                      <Text style={styles.buttonMainText}>เริ่มทำ</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.button, styles.buttonDanger]}
                      onPress={() => handleCancel(item)}
                    >
                      <Text style={styles.buttonMainText}>ยกเลิก</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[styles.button, styles.buttonMain]}
                    onPress={() => handleStatus(item, 'served')}
                  >
                    <Text style={styles.buttonMainText}>เสิร์ฟแล้ว</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerNote}>คิวอัปเดตเองทุก 5 วินาที</Text>
        <Pressable style={styles.smallButton} onPress={handleReset}>
          <Text style={styles.smallButtonText}>ล้างข้อมูล</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statPending: { fontSize: 14, fontWeight: '600', color: colors.occupied },
  statCooking: { fontSize: 14, fontWeight: '600', color: colors.cooking },
  spacer: { flex: 1 },

  list: { padding: spacing.lg, paddingBottom: spacing.xl },
  column: { gap: spacing.md },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  card: {
    flex: 1,
    maxWidth: 620,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPending: { borderColor: colors.border, borderLeftColor: colors.occupied },
  cardCooking: { borderColor: colors.border, borderLeftColor: colors.cooking },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableName: { fontSize: 15, fontWeight: '700', color: colors.text },
  badgePending: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b26a00',
    backgroundColor: colors.occupiedSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  badgeCooking: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cooking,
    backgroundColor: colors.cookingSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
  },

  itemName: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  itemOptions: { fontSize: 15, fontWeight: '600', color: colors.cooking, marginTop: 2 },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemNote: { fontSize: 13, color: colors.primary, marginTop: spacing.xs },

  cardButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  button: { flex: 1, borderRadius: radius.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  buttonMain: { backgroundColor: colors.primary },
  buttonDanger: { backgroundColor: colors.danger },
  buttonMainText: { fontSize: 14, fontWeight: '700', color: colors.surface },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  footerNote: { fontSize: 12, color: colors.textMuted },

  smallButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  smallButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },
});
