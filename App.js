import { useState } from 'react';
import { Platform, Pressable, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';

import MenuScreen from './src/screens/MenuScreen';
import SelectTableScreen from './src/screens/SelectTableScreen';
import { colors, spacing } from './src/theme';

export default function App() {

  const [activeTable, setActiveTable] = useState(null);

  const title = activeTable ? `เมนู · โต๊ะ ${activeTable.table_number}` : 'เลือกโต๊ะ';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        {activeTable ? (
          <Pressable
            onPress={() => setActiveTable(null)}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>‹ ย้อนกลับ</Text>
          </Pressable>
        ) : null}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {activeTable ? (
        <MenuScreen table={activeTable} />
      ) : (
        <SelectTableScreen onSelectTable={setActiveTable} />
      )}
    </View>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
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
  backButton: { paddingVertical: spacing.xs, paddingRight: spacing.sm },
  backText: { fontSize: 16, color: colors.primary },
  pressed: { opacity: 0.6 },
});
