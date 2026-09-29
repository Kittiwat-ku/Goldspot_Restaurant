import { DATABASE_NAME, SCHEMA_SQL } from './schema';
import { SEED_CATEGORIES, SEED_MENU_ITEMS, TABLE_COUNT } from './seedData';


export async function initDatabase(db) {
  // ต้องเปิดก่อนทุกครั้งที่เชื่อมต่อ ไม่ใช่ค่าที่ติดมากับไฟล์ฐานข้อมูล
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA_SQL);
  await seedIfNeeded(db);
}

/**
 * ใส่ข้อมูลตั้งต้นเฉพาะครั้งแรก
 * เปิดแอปครั้งที่สองจะไม่ใส่ซ้ำ
 */
export async function seedIfNeeded(db) {
  const flag = await db.getFirstAsync(
    "SELECT value FROM app_meta WHERE key = 'seeded';"
  );
  if (flag) return false;

  for (const category of SEED_CATEGORIES) {
    await db.runAsync(
      'INSERT OR IGNORE INTO categories (name, sort_order) VALUES (?, ?);',
      [category.name, category.sortOrder]
    );
  }

  for (const item of SEED_MENU_ITEMS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO menu_items (category_id, name, price_satang, is_available, image_uri)
       VALUES ((SELECT id FROM categories WHERE name = ?), ?, ?, 1, ?);`,
      [item.categoryName, item.name, item.priceSatang, item.image]
    );
  }

  for (let tableNumber = 1; tableNumber <= TABLE_COUNT; tableNumber += 1) {
    await db.runAsync(
      'INSERT OR IGNORE INTO dining_tables (table_number, seats) VALUES (?, ?);',
      [tableNumber, 4]
    );
  }

  await db.runAsync("INSERT INTO app_meta (key, value) VALUES ('seeded', 'yes');");
  return true;
}

/**
 * ล้างข้อมูลการขาย"
 */
export async function resetSalesData(db) {
  await db.runAsync('DELETE FROM bills;');
  await db.runAsync("DELETE FROM sqlite_sequence WHERE name IN ('bills', 'order_rounds', 'order_items');"
  );
}

/**
 * ล้างทุกอย่างกลับสู่สถานะเปิดแอปครั้งแรก
 */
export async function resetEverything(db) {
  await db.runAsync('DELETE FROM bills;');
  await db.runAsync('DELETE FROM menu_items;');
  await db.runAsync('DELETE FROM categories;');
  await db.runAsync('DELETE FROM dining_tables;');
  await db.runAsync('DELETE FROM app_meta;');
  await db.runAsync(
    `DELETE FROM sqlite_sequence
     WHERE name IN ('bills', 'order_rounds', 'order_items',
                    'menu_items', 'categories', 'dining_tables');`
  );
  await seedIfNeeded(db);
}

export { DATABASE_NAME };
