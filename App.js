import { useState } from 'react';
import {
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { DATABASE_NAME, initDatabase } from './src/db';
import BillHistoryScreen from './src/screens/BillHistoryScreen';
import BillScreen from './src/screens/BillScreen';
import KitchenScreen from './src/screens/KitchenScreen';
import MenuScreen from './src/screens/MenuScreen';
import MenuSettingsScreen from './src/screens/MenuSettingsScreen';
import SelectTableScreen from './src/screens/SelectTableScreen';
import { colors, radius, spacing } from './src/style/theme';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <Screens />
      </SQLiteProvider>
    </View>
  );
}


function Screens() {

  const [side, setSide] = useState('customer');
  const [page, setPage] = useState('tables');
  const [table, setTable] = useState(null);
  const [billId, setBillId] = useState(null);
  const [kitchenPage, setKitchenPage] = useState('queue');
  const [historyTable, setHistoryTable] = useState(null);
  const [historyBillId, setHistoryBillId] = useState(null);

  const isKitchen = side === 'kitchen';

  let title = 'เลือกโต๊ะ';
  if (isKitchen && kitchenPage === 'settings') title = 'ครัว · ตั้งค่าเมนู';
  else if (isKitchen && kitchenPage === 'history') title = 'ครัว · บิลย้อนหลัง';
  else if (isKitchen && kitchenPage === 'historyBill') {
    title = 'ครัว · บิลย้อนหลัง · โต๊ะ ' + historyTable.table_number;
  } else if (isKitchen) title = 'ครัว · คิวออร์เดอร์';
  else if (page === 'menu') title = 'สั่งอาหาร · โต๊ะ ' + table.table_number;
  else if (page === 'bill') title = 'บิล · โต๊ะ ' + table.table_number;

  // ฝั่งครัวมีปุ่มย้อนกลับทุกหน้ายกเว้นหน้าคิว ฝั่งลูกค้ามีทุกหน้ายกเว้นหน้าเลือกโต๊ะ
  const showBack = isKitchen ? kitchenPage !== 'queue' : page !== 'tables';

  function handleBack() {
    if (isKitchen && kitchenPage === 'historyBill') setKitchenPage('history');
    else if (isKitchen) setKitchenPage('queue');
    else if (page === 'bill') setPage('menu');
    else setPage('tables');
  }

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        {showBack ? (
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>‹ ย้อนกลับ</Text>
          </Pressable>
        ) : null}

        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.spacer} />

        <View style={styles.sideSwitch}>
          <Pressable
            onPress={() => setSide('customer')}
            style={[styles.sideTab, !isKitchen && styles.sideTabActive]}
          >
            <Text style={[styles.sideTabText, !isKitchen && styles.sideTabTextActive]}>
              ลูกค้า
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSide('kitchen')}
            style={[styles.sideTab, isKitchen && styles.sideTabActive]}
          >
            <Text style={[styles.sideTabText, isKitchen && styles.sideTabTextActive]}>
              ครัว
            </Text>
          </Pressable>
        </View>
      </View>

      {isKitchen && kitchenPage === 'queue' ? (
        <KitchenScreen
          onOpenMenuSettings={() => setKitchenPage('settings')}
          onOpenHistory={() => setKitchenPage('history')}
        />
      ) : null}

      {isKitchen && kitchenPage === 'settings' ? <MenuSettingsScreen /> : null}

      {isKitchen && kitchenPage === 'history' ? (
        <BillHistoryScreen
          onOpenBill={(row) => {
            setHistoryTable({ table_id: row.table_id, table_number: row.table_number });
            setHistoryBillId(row.bill_id);
            setKitchenPage('historyBill');
          }}
        />
      ) : null}

      {/* บิลที่ปิดแล้ว BillScreen ซ่อนปุ่มสั่งเพิ่ม/ปิดบิลเอง สองปุ่มนี้เลยแค่พากลับหน้ารายการ */}
      {isKitchen && kitchenPage === 'historyBill' ? (
        <BillScreen
          table={historyTable}
          billId={historyBillId}
          onAddMore={() => setKitchenPage('history')}
          onBillClosed={() => setKitchenPage('history')}
        />
      ) : null}

      {!isKitchen && page === 'tables' ? (
        <SelectTableScreen
          onSelectTable={(selected) => {
            setTable(selected);
            setPage('menu');
          }}
        />
      ) : null}

      {!isKitchen && page === 'menu' ? (
        <MenuScreen
          table={table}
          onViewBill={(id) => {
            setBillId(id);
            setPage('bill');
          }}
        />
      ) : null}

      {!isKitchen && page === 'bill' ? (
        <BillScreen
          table={table}
          billId={billId}
          onAddMore={() => setPage('menu')}
          onBillClosed={() => setPage('tables')}
        />
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  shell: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  spacer: { flex: 1 },
  backButton: { paddingVertical: spacing.xs, paddingRight: spacing.sm },
  backText: { fontSize: 16, color: colors.primary },

  sideSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 2,
  },
  sideTab: { paddingVertical: spacing.xs, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  sideTabActive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sideTabText: { fontSize: 14, color: colors.textMuted },
  sideTabTextActive: { color: colors.text, fontWeight: '600' },
});