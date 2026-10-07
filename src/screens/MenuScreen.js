import { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import {
  formatBaht,
  getBillTotal,
  getOpenBillForTable,
  listCategories,
  listMenuItemsByCategory,
  openOrGetBill,
  placeOrderRound,
  searchMenuItems,
} from '../db';
import { getMenuImage } from '../lib/menuImages';
import { colors, radius, spacing } from '../style/theme';

export default function MenuScreen({ table, onViewBill }) {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [bill, setBill] = useState(null);
  const [billTotal, setBillTotal] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadFirstTime() {
      const rows = await listCategories(db);
      setCategories(rows);
      if (rows.length > 0) setCategoryId(rows[0].id);
      await reloadBill();
    }
    loadFirstTime();
    // โหลดครั้งเดียวตอนเข้าหน้า จึงปล่อยวงเล็บว่างไว้
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadItems() {
      if (keyword.trim() !== '') {
        setItems(await searchMenuItems(db, keyword.trim(), onlyAvailable));
      } else if (categoryId !== null) {
        setItems(await listMenuItemsByCategory(db, categoryId, onlyAvailable));
      }
    }
    loadItems();
    // db มาจาก useSQLiteContext() เป็นตัวเดิมตลอด ไม่ต้องใส่ในวงเล็บ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, keyword, onlyAvailable]);

  async function reloadBill() {
    const openBill = await getOpenBillForTable(db, table.table_id);
    setBill(openBill);
    if (openBill) {
      const total = await getBillTotal(db, openBill.id);
      setBillTotal(total.total_satang);
    } else {
      setBillTotal(0);
    }
  }

  function addToCart(item) {
    setMessage('');
    const found = cart.find((line) => line.menuItemId === item.id);

    if (found) {
      changeQuantity(item.id, 1);
      return;
    }

    setCart([
      ...cart,
      { menuItemId: item.id, name: item.name, priceSatang: item.price_satang, quantity: 1, note: '' },
    ]);
  }

  function changeQuantity(menuItemId, diff) {
    const next = cart
      .map((line) =>
        line.menuItemId === menuItemId ? { ...line, quantity: line.quantity + diff } : line
      )
      .filter((line) => line.quantity > 0);
    setCart(next);
  }

  function changeNote(menuItemId, note) {
    setCart(cart.map((line) => (line.menuItemId === menuItemId ? { ...line, note } : line)));
  }

  async function handleSend() {
    if (cart.length === 0) return;

    try {
      const activeBill = await openOrGetBill(db, table.table_id);
      const lines = cart.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        note: line.note.trim() === '' ? null : line.note.trim(),
      }));

      const placed = await placeOrderRound(db, activeBill.id, lines);

      setCart([]);
      setCartOpen(false);
      setMessage('ส่งเข้าครัวแล้ว · รอบที่ ' + placed.roundNo + ' · ' + placed.itemCount + ' รายการ');
      await reloadBill();
    } catch (e) {
      Alert.alert('ส่งออร์เดอร์ไม่สำเร็จ', e.message);
    }
  }

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.priceSatang * line.quantity, 0);

  return (
    <View style={styles.screen}>
      <View style={styles.billBar}>
        <Text style={styles.billText}>
          {bill
            ? 'สั่งเพิ่มในบิลเดิมของโต๊ะนี้ · ค้างอยู่ ' + formatBaht(billTotal) + ' ฿'
            : 'ยังไม่มีบิล — ส่งออร์เดอร์รอบแรกแล้วระบบจะเปิดบิลให้เอง'}
        </Text>
        {bill ? (
          <Pressable style={styles.smallButton} onPress={() => onViewBill(bill.id)}>
            <Text style={styles.smallButtonText}>ดูบิล / เช็คบิล</Text>
          </Pressable>
        ) : null}
      </View>

      {message !== '' ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="ค้นหาชื่อเมนู เช่น ผัด, ต้ม, ชา"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.switchLabel}>เฉพาะที่มีของ</Text>
        <Switch value={onlyAvailable} onValueChange={setOnlyAvailable} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipBar}
      >
        {categories.map((category) => {
          const isActive = category.id === categoryId && keyword.trim() === '';

          return (
            <Pressable
              key={category.id}
              onPress={() => {
                setKeyword('');
                setCategoryId(category.id);
              }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={width >= 900 ? 2 : 1}
        key={width >= 900 ? 'wide' : 'narrow'}
        columnWrapperStyle={width >= 900 ? styles.column : undefined}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<Text style={styles.listHeader}>{items.length} รายการ</Text>}
        ListEmptyComponent={<Text style={styles.empty}>ไม่พบเมนูที่ค้นหา</Text>}
        renderItem={({ item }) => {
          const inCart = cart.find((line) => line.menuItemId === item.id);
          const image = getMenuImage(item.image_uri);

          return (
            <View style={styles.menuRow}>
              {image ? (
                <Image source={image} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
                  <Text style={styles.thumbnailText}>ยังไม่มีรูป</Text>
                </View>
              )}

              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuPrice}>{formatBaht(item.price_satang)} ฿</Text>
                {item.is_available === 0 ? <Text style={styles.soldOut}>ของหมด สั่งไม่ได้</Text> : null}
              </View>

              {item.is_available === 1 ? (
                inCart ? (
                  <Stepper
                    quantity={inCart.quantity}
                    onMinus={() => changeQuantity(item.id, -1)}
                    onPlus={() => changeQuantity(item.id, 1)}
                  />
                ) : (
                  <Pressable style={styles.addButton} onPress={() => addToCart(item)}>
                    <Text style={styles.addButtonText}>เพิ่ม</Text>
                  </Pressable>
                )
              ) : null}
            </View>
          );
        }}
      />

      <View style={styles.cartBar}>
        <View>
          <Text style={styles.cartBarCount}>{cartCount} รายการในตะกร้า</Text>
          <Text style={styles.cartBarTotal}>{formatBaht(cartTotal)} ฿</Text>
        </View>
        <Pressable
          style={[styles.bigButton, cart.length === 0 && styles.buttonOff]}
          onPress={() => setCartOpen(true)}
          disabled={cart.length === 0}
        >
          <Text style={styles.bigButtonText}>ดูตะกร้าและส่งเข้าครัว</Text>
        </Pressable>
      </View>

      <Modal visible={cartOpen} animationType="slide" onRequestClose={() => setCartOpen(false)}>
        <View style={styles.cartScreen}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>ตะกร้า · โต๊ะ {table.table_number}</Text>
            <Pressable style={styles.smallButton} onPress={() => setCartOpen(false)}>
              <Text style={styles.smallButtonText}>ปิด</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.cartList} keyboardShouldPersistTaps="handled">
            {cart.map((line) => (
              <View key={line.menuItemId} style={styles.cartLine}>
                <View style={styles.cartLineTop}>
                  <Text style={styles.cartLineName}>{line.name}</Text>
                  <Text style={styles.cartLineTotal}>
                    {formatBaht(line.priceSatang * line.quantity)} ฿
                  </Text>
                </View>

                <View style={styles.cartLineBottom}>
                  <Stepper
                    quantity={line.quantity}
                    onMinus={() => changeQuantity(line.menuItemId, -1)}
                    onPlus={() => changeQuantity(line.menuItemId, 1)}
                  />
                  <Text style={styles.cartLineUnit}>{formatBaht(line.priceSatang)} ฿ / จาน</Text>
                </View>

                <TextInput
                  style={styles.noteInput}
                  value={line.note}
                  onChangeText={(text) => changeNote(line.menuItemId, text)}
                  placeholder="หมายเหตุถึงครัว เช่น ไม่เผ็ด ไม่ใส่ผัก"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.cartFooter}>
            <View style={styles.cartTotalRow}>
              <Text style={styles.cartTotalLabel}>รวมรอบนี้</Text>
              <Text style={styles.cartTotalValue}>{formatBaht(cartTotal)} ฿</Text>
            </View>
            <Pressable style={styles.bigButton} onPress={handleSend}>
              <Text style={styles.bigButtonText}>ส่งเข้าครัว</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stepper({ quantity, onMinus, onPlus }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepperButton} onPress={onMinus}>
        <Text style={styles.stepperSign}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{quantity}</Text>
      <Pressable style={styles.stepperButton} onPress={onPlus}>
        <Text style={styles.stepperSign}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  billBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  billText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },

  message: {
    backgroundColor: colors.freeSoft,
    color: '#1e7c3a',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    minHeight: 40,
  },
  switchLabel: { fontSize: 13, color: colors.textMuted },

  chipScroll: { flexGrow: 0 },
  chipBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextActive: { color: colors.surface, fontWeight: '600' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  column: { gap: spacing.md },
  listHeader: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  empty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  menuRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumbnail: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.background },
  thumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  thumbnailText: { fontSize: 10, color: colors.textMuted },
  menuInfo: { flex: 1, paddingHorizontal: spacing.md },
  menuName: { fontSize: 15, color: colors.text },
  menuPrice: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  soldOut: { fontSize: 12, color: colors.danger, marginTop: 2 },

  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  addButtonText: { color: colors.surface, fontSize: 14, fontWeight: '600' },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  stepperButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  stepperSign: { fontSize: 20, color: colors.primary },
  stepperValue: { fontSize: 15, fontWeight: '700', color: colors.text, minWidth: 24, textAlign: 'center' },

  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cartBarCount: { fontSize: 13, color: colors.textMuted },
  cartBarTotal: { fontSize: 18, fontWeight: '700', color: colors.text },

  smallButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  smallButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },

  bigButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  bigButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  buttonOff: { opacity: 0.4 },

  cartScreen: { flex: 1, backgroundColor: colors.surface },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cartTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cartList: { flex: 1, paddingHorizontal: spacing.lg },
  cartLine: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md, gap: spacing.sm },
  cartLineTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cartLineName: { flex: 1, fontSize: 15, color: colors.text },
  cartLineTotal: { fontSize: 15, fontWeight: '700', color: colors.text },
  cartLineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cartLineUnit: { fontSize: 12, color: colors.textMuted },
  noteInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cartTotalLabel: { fontSize: 14, color: colors.textMuted },
  cartTotalValue: { fontSize: 22, fontWeight: '700', color: colors.text },
});
