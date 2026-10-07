/**
 * เปิดฐานข้อมูล สร้างตาราง และใส่ข้อมูลตั้งต้น
 *
 * ไฟล์นี้เป็นที่เดียวที่แตะเรื่อง "สร้างตาราง / ใส่ข้อมูลตั้งต้น"
 */

import { DATABASE_NAME, SCHEMA_SQL } from './schema';
import { SEED_CATEGORIES, SEED_MENU_ITEMS, SEED_OPTIONS, TABLE_COUNT } from './seedData';


export async function initDatabase(db) {
  // ต้องเปิดก่อนทุกครั้งที่เชื่อมต่อ ไม่ใช่ค่าที่ติดมากับไฟล์ฐานข้อมูล
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA_SQL);
  await seedIfNeeded(db);
}

/**
 * ใส่ข้อมูลตั้งต้นเฉพาะครั้งแรก ดูจากธงในตาราง app_meta
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

  for (const option of SEED_OPTIONS) {
    await db.runAsync(
      'INSERT OR IGNORE INTO menu_options (name, extra_price_satang) VALUES (?, ?);',
      [option.name, option.extraSatang]
    );

    // ผูกตัวเลือกให้ทีละเมนู หา id ทั้งสองฝั่งจากชื่อ ไม่ต้องจำเลข id เอง
    for (const menuName of option.menus) {
      await db.runAsync(
        `INSERT OR IGNORE INTO menu_item_options (menu_item_id, option_id)
         SELECT m.id, o.id
           FROM menu_items   AS m
           JOIN menu_options AS o ON o.name = ?
          WHERE m.name = ?;`,
        [option.name, menuName]
      );
    }
  }

  await db.runAsync("INSERT INTO app_meta (key, value) VALUES ('seeded', 'yes');");
  return true;
}

/**
 * ปุ่ม "ล้างข้อมูลการขาย" สำหรับผู้ตรวจ
 * ลบเฉพาะบิล รอบ และรายการที่สั่ง เมนูกับโต๊ะยังอยู่ครบ ใช้งานต่อได้ทันที
 */
export async function resetSalesData(db) {
  // ลบบิลแล้ว order_rounds, order_items และ order_item_options ตามไปเองด้วย ON DELETE CASCADE
  await db.runAsync('DELETE FROM bills;');
  await db.runAsync(
    "DELETE FROM sqlite_sequence WHERE name IN ('bills', 'order_rounds', 'order_items');"
  );
}

/**
 * ล้างทุกอย่างกลับสู่สถานะเปิดแอปครั้งแรก
 * ใช้ตอนเพิ่มเมนูใหม่หรือเปลี่ยนรูปใน seedData.js แล้วอยากให้ข้อมูลใหม่เข้าเครื่อง
 */
export async function resetEverything(db) {
  await db.runAsync('DELETE FROM bills;');
  await db.runAsync('DELETE FROM menu_items;');
  await db.runAsync('DELETE FROM menu_options;');
  await db.runAsync('DELETE FROM categories;');
  await db.runAsync('DELETE FROM dining_tables;');
  await db.runAsync('DELETE FROM app_meta;');
  await db.runAsync(
    `DELETE FROM sqlite_sequence
     WHERE name IN ('bills', 'order_rounds', 'order_items',
                    'menu_items', 'menu_options', 'categories', 'dining_tables');`
  );
  await seedIfNeeded(db);
}

export { DATABASE_NAME };
