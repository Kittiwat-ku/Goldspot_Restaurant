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
  addMenuItem,
  formatBaht,
  listCategories,
  listMenuItemsByCategory,
  setMenuAvailability,
  toSatang,
  updateMenuImage,
  updateMenuPrice,
} from '../db';
import { MENU_IMAGE_NAMES, getMenuImage } from '../lib/menuImages';
import { colors, radius, spacing } from '../style/theme';


export default function MenuSettingsScreen() {
  const db = useSQLiteContext();
  const { width } = useWindowDimensions();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [items, setItems] = useState([]);

  // แถวที่กำลังแก้ราคา: null = ไม่มี
  const [editingId, setEditingId] = useState(null);
  const [editingPrice, setEditingPrice] = useState('');

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newImageName, setNewImageName] = useState(null);


  const [imageTarget, setImageTarget] = useState(null);

  useEffect(() => {
    async function loadFirstTime() {
      const rows = await listCategories(db);
      setCategories(rows);
      if (rows.length > 0) setCategoryId(rows[0].id);
    }
    loadFirstTime();
    // โหลดครั้งเดียวตอนเข้าหน้า
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadItems() {
      await reload();
    }
    loadItems();
    // โหลดรายการใหม่ทุกครั้งที่เปลี่ยนหมวด
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function reload() {
    if (categoryId === null) return;
    setItems(await listMenuItemsByCategory(db, categoryId, false));
  }

  function startEditPrice(item) {
    setEditingId(item.id);
    setEditingPrice(formatBaht(item.price_satang));
  }

  async function savePrice(item) {
    const priceSatang = toSatang(editingPrice);
    if (priceSatang === null) {
      Alert.alert('ราคาไม่ถูกต้อง', 'พิมพ์เป็นตัวเลขบาทที่มากกว่าศูนย์ เช่น 65 หรือ 65.50');
      return;
    }

    try {
      await updateMenuPrice(db, item.id, priceSatang);
      setEditingId(null);
      await reload();
    } catch (e) {
      Alert.alert('แก้ราคาไม่สำเร็จ', e.message);
    }
  }

  /** แตะรูปในหน้าต่างเลือกรูป imageName = null คือเอารูปออก */
  async function chooseImage(imageName) {
    const target = imageTarget;
    setImageTarget(null);

    if (target === 'new') {
      setNewImageName(imageName);
      return;
    }

    try {
      await updateMenuImage(db, target.id, imageName);
      await reload();
    } catch (e) {
      Alert.alert('เปลี่ยนรูปไม่สำเร็จ', e.message);
    }
  }

  async function toggleAvailable(item, isAvailable) {
    await setMenuAvailability(db, item.id, isAvailable);
    await reload();
  }

  async function handleAdd() {
    const name = newName.trim();
    const priceSatang = toSatang(newPrice);

    if (name === '') {
      Alert.alert('ยังไม่ได้ใส่ชื่อเมนู');
      return;
    }
    if (priceSatang === null) {
      Alert.alert('ราคาไม่ถูกต้อง', 'พิมพ์เป็นตัวเลขบาทที่มากกว่าศูนย์ เช่น 65 หรือ 65.50');
      return;
    }

    try {
      await addMenuItem(db, categoryId, name, priceSatang, newImageName);
      setNewName('');
      setNewPrice('');
      setNewImageName(null);
      await reload();
    } catch (e) {
      // ชื่อซ้ำในหมวดเดียวกัน ฐานข้อมูลปฏิเสธด้วย UNIQUE (category_id, name)
      if (String(e.message).includes('UNIQUE')) {
        Alert.alert('เพิ่มไม่ได้', 'มีเมนูชื่อ "' + name + '" ในหมวดนี้อยู่แล้ว');
      } else {
        Alert.alert('เพิ่มไม่ได้', e.message);
      }
    }
  }

  const categoryName = categories.find((category) => category.id === categoryId)?.name ?? '';

  return (
    <View style={styles.screen}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipBar}
      >
        {categories.map((category) => {
          const isActive = category.id === categoryId;
          return (
            <Pressable
              key={category.id}
              onPress={() => {
                setEditingId(null);
                setCategoryId(category.id);
              }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{category.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>เพิ่มเมนูใหม่ในหมวด {categoryName}</Text>
        <View style={styles.addRow}>
          <Pressable onPress={() => setImageTarget('new')}>
            {newImageName ? (
              <Image source={getMenuImage(newImageName)} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
                <Text style={styles.thumbnailText}>+ ใส่รูป</Text>
              </View>
            )}
          </Pressable>
          <TextInput
            style={[styles.input, styles.inputName]}
            value={newName}
            onChangeText={setNewName}
            placeholder="ชื่อเมนู"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.inputPrice]}
            value={newPrice}
            onChangeText={setNewPrice}
            placeholder="ราคา (บาท)"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
          <Pressable style={styles.mainButton} onPress={handleAdd}>
            <Text style={styles.mainButtonText}>เพิ่มเมนู</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          แก้ราคามีผลกับออร์เดอร์ใหม่เท่านั้น บิลที่สั่งไปแล้วยังคิดราคาเดิม
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={width >= 900 ? 2 : 1}
        key={width >= 900 ? 'wide' : 'narrow'}
        columnWrapperStyle={width >= 900 ? styles.column : undefined}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<Text style={styles.listHeader}>{items.length} รายการ</Text>}
        renderItem={({ item }) => {
          const isEditing = item.id === editingId;
          const isAvailable = item.is_available === 1;
          const image = getMenuImage(item.image_uri);

          return (
            <View style={[styles.row, !isAvailable && styles.rowOff]}>
              <Pressable onPress={() => setImageTarget(item)} style={styles.imageBox}>
                {image ? (
                  <Image source={image} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailEmpty]}>
                    <Text style={styles.thumbnailText}>ยังไม่มีรูป</Text>
                  </View>
                )}
                <Text style={styles.changeImageText}>เปลี่ยนรูป</Text>
              </Pressable>

              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.name}</Text>
                {isEditing ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.input, styles.inputEdit]}
                      value={editingPrice}
                      onChangeText={setEditingPrice}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                    <Text style={styles.baht}>฿</Text>
                    <Pressable style={styles.mainButton} onPress={() => savePrice(item)}>
                      <Text style={styles.mainButtonText}>บันทึก</Text>
                    </Pressable>
                    <Pressable style={styles.lightButton} onPress={() => setEditingId(null)}>
                      <Text style={styles.lightButtonText}>ยกเลิก</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.editRow}>
                    <Text style={styles.rowPrice}>{formatBaht(item.price_satang)} ฿</Text>
                    <Pressable style={styles.lightButton} onPress={() => startEditPrice(item)}>
                      <Text style={styles.lightButtonText}>แก้ราคา</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View style={styles.switchBox}>
                <Switch value={isAvailable} onValueChange={(value) => toggleAvailable(item, value)} />
                <Text style={isAvailable ? styles.onText : styles.offText}>
                  {isAvailable ? 'เปิดขาย' : 'ปิดขาย'}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* หน้าต่างเลือกรูปจาก src/menu/ แตะรูปเพื่อเลือก */}
      <Modal
        visible={imageTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setImageTarget(null)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {imageTarget === 'new' || imageTarget === null
                  ? 'เลือกรูปให้เมนูใหม่'
                  : 'เลือกรูปให้ ' + imageTarget.name}
              </Text>
              <Pressable style={styles.lightButton} onPress={() => chooseImage(null)}>
                <Text style={styles.lightButtonText}>ไม่ใส่รูป</Text>
              </Pressable>
              <Pressable style={styles.lightButton} onPress={() => setImageTarget(null)}>
                <Text style={styles.lightButtonText}>ปิด</Text>
              </Pressable>
            </View>

            <FlatList
              data={MENU_IMAGE_NAMES}
              keyExtractor={(name) => name}
              numColumns={6}
              columnWrapperStyle={styles.pickerColumn}
              renderItem={({ item: name }) => (
                <Pressable onPress={() => chooseImage(name)} style={styles.pickerItem}>
                  <Image source={getMenuImage(name)} style={styles.pickerImage} />
                  <Text style={styles.pickerName}>{name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // flexGrow: 0 กันไม่ให้แถบหมวดยืดสูงเต็มจอ เพราะอยู่ในคอนเทนเนอร์แนวตั้ง
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

  addCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hint: { fontSize: 12, color: colors.textMuted },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    minHeight: 40,
  },
  inputName: { flex: 1 },
  inputPrice: { width: 140 },
  inputEdit: { width: 110 },

  mainButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  mainButtonText: { color: colors.surface, fontSize: 14, fontWeight: '600' },
  lightButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  lightButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },

  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  column: { gap: spacing.md },
  listHeader: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },

  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rowOff: { backgroundColor: colors.background },

  imageBox: { alignItems: 'center', gap: 2 },
  thumbnail: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.background },
  thumbnailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  thumbnailText: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  changeImageText: { fontSize: 11, color: colors.primary },

  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pickerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  pickerColumn: { gap: spacing.sm },
  // ขนาดคงที่ ไม่ใช้ flex: 1 เพราะแถวสุดท้ายที่รูปไม่ครบ 6 จะยืดกว้างกว่าแถวอื่น
  pickerItem: { width: 112, alignItems: 'center', marginBottom: spacing.sm },
  pickerImage: { width: 112, height: 112, borderRadius: radius.sm },
  pickerName: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rowInfo: { flex: 1, gap: spacing.xs },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowPrice: { fontSize: 15, color: colors.text, minWidth: 80 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  baht: { fontSize: 15, color: colors.text },

  switchBox: { alignItems: 'center', gap: 2 },
  onText: { fontSize: 12, fontWeight: '600', color: colors.free },
  offText: { fontSize: 12, fontWeight: '600', color: colors.danger },
});
