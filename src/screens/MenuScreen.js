import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { MOCK_CATEGORIES, getMenuItemsByCategory } from '../data/mockMenu';
import { colors, radius, spacing } from '../theme';

function formatBaht(satang) {
  return (satang / 100).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MenuScreen({ table }) {
  const [activeCategoryId, setActiveCategoryId] = useState(MOCK_CATEGORIES[0].id);


  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const items = useMemo(() => getMenuItemsByCategory(activeCategoryId), [activeCategoryId]);
  const isExistingBill = table.open_bill_id !== null;
  const activeCategory = MOCK_CATEGORIES.find((category) => category.id === activeCategoryId);

  const menuList = (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      numColumns={isWide ? 2 : 1}
      key={isWide ? 'wide' : 'narrow'}
      columnWrapperStyle={isWide ? styles.menuColumn : undefined}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.listHeader}>
          {activeCategory.name} · {items.length} รายการ
        </Text>
      }
      renderItem={({ item }) => (
        <View style={[styles.menuRow, isWide && styles.menuRowWide]}>
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{item.name}</Text>
            {!item.is_available && <Text style={styles.soldOut}>ของหมด</Text>}
          </View>
          <Text style={styles.menuPrice}>{formatBaht(item.price_satang)} ฿</Text>
        </View>
      )}
    />
  );

  return (
    <View style={styles.screen}>
      <View style={styles.billBanner}>
        <Text style={styles.billBannerText}>
          {isExistingBill ? 'สั่งเพิ่มในบิลเดิมของโต๊ะนี้' : 'เปิดบิลใหม่ให้โต๊ะนี้'}
        </Text>
      </View>

      {isWide ? (
        <View style={styles.wideBody}>
          <View style={styles.sidebar}>
            <Text style={styles.sidebarTitle}>หมวดอาหาร</Text>
            {MOCK_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setActiveCategoryId(category.id)}
                  style={({ pressed }) => [
                    styles.sidebarItem,
                    isActive && styles.sidebarItemActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.sidebarText, isActive && styles.sidebarTextActive]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.wideContent}>{menuList}</View>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryBar}
          >
            {MOCK_CATEGORIES.map((category) => {
              const isActive = category.id === activeCategoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setActiveCategoryId(category.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    isActive && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {menuList}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  billBanner: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  billBannerText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  categoryScroll: { flexGrow: 0, flexShrink: 0 },
  categoryBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.6 },
  chipText: { fontSize: 14, color: colors.text },
  chipTextActive: { color: colors.surface, fontWeight: '600' },

  wideBody: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  sidebarTitle: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  sidebarItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  sidebarItemActive: { backgroundColor: colors.primarySoft },
  sidebarText: { fontSize: 15, color: colors.text },
  sidebarTextActive: { color: colors.primary, fontWeight: '600' },
  wideContent: { flex: 1 },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  listHeader: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  menuColumn: { gap: spacing.sm },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  menuRowWide: { flex: 1, paddingVertical: spacing.lg },
  menuInfo: { flex: 1, paddingRight: spacing.md },
  menuName: { fontSize: 15, color: colors.text },
  soldOut: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menuPrice: { fontSize: 15, fontWeight: '600', color: colors.text },
});
