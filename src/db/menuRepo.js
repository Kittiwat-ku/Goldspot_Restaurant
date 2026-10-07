/** หมวดหมู่อาหารทั้งหมด*/
export function listCategories(db) {
  return db.getAllAsync(
    'SELECT id, name, sort_order FROM categories ORDER BY sort_order, name;'
  );
}

export function listMenuItemsByCategory(db, categoryId, onlyAvailable) {
  return db.getAllAsync(
    `SELECT m.id, m.category_id, m.name, m.price_satang, m.is_available, m.image_uri,
            (SELECT COUNT(*) FROM menu_item_options AS mio
              WHERE mio.menu_item_id = m.id) AS option_count
       FROM menu_items AS m
      WHERE m.category_id = ?
        AND (? = 0 OR m.is_available = 1)
      ORDER BY m.name;`,
    [categoryId, onlyAvailable ? 1 : 0]
  );
}

/** ค้นหาเมนูจากชื่อ */
export function searchMenuItems(db, keyword, onlyAvailable) {
  return db.getAllAsync(
    `SELECT m.id,
            m.name,
            m.price_satang,
            m.is_available,
            m.image_uri,
            c.name AS category_name,
            (SELECT COUNT(*) FROM menu_item_options AS mio
              WHERE mio.menu_item_id = m.id) AS option_count
       FROM menu_items AS m
       JOIN categories AS c ON c.id = m.category_id
      WHERE m.name LIKE '%' || ? || '%'
        AND (? = 0 OR m.is_available = 1)
      ORDER BY c.sort_order, m.name;`,
    [keyword, onlyAvailable ? 1 : 0]
  );
}

export async function addMenuItem(db, categoryId, name, priceSatang, imageUri) {
  const result = await db.runAsync(
    `INSERT INTO menu_items (category_id, name, price_satang, is_available, image_uri)
     VALUES (?, ?, ?, 1, ?);`,
    [categoryId, name, priceSatang, imageUri ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateMenuImage(db, menuItemId, imageUri) {
  const result = await db.runAsync('UPDATE menu_items SET image_uri = ? WHERE id = ?;', [
    imageUri ?? null,
    menuItemId,
  ]);
  if (result.changes === 0) {
    throw new Error('เปลี่ยนรูปไม่สำเร็จ: ไม่พบเมนูนี้');
  }
}

export async function updateMenuPrice(db, menuItemId, priceSatang) {
  const result = await db.runAsync(
    'UPDATE menu_items SET price_satang = ? WHERE id = ?;',
    [priceSatang, menuItemId]
  );
  if (result.changes === 0) {
    throw new Error('แก้ราคาไม่สำเร็จ: ไม่พบเมนูนี้');
  }
}

export async function setMenuAvailability(db, menuItemId, isAvailable) {
  await db.runAsync('UPDATE menu_items SET is_available = ? WHERE id = ?;', [
    isAvailable ? 1 : 0,
    menuItemId,
  ]);
}

export function listOptionsForMenuItem(db, menuItemId) {
  return db.getAllAsync(
    `SELECT o.id, o.name, o.extra_price_satang
       FROM menu_item_options AS mio
       JOIN menu_options      AS o ON o.id = mio.option_id
      WHERE mio.menu_item_id = ?
      ORDER BY o.extra_price_satang, o.name;`,
    [menuItemId]
  );
}
