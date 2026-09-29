/** หมวดหมู่อาหารทั้งหมด*/
export function listCategories(db) {
  return db.getAllAsync(
    'SELECT id, name, sort_order FROM categories ORDER BY sort_order, name;'
  );
}


export function listMenuItemsByCategory(db, categoryId, onlyAvailable) {
  return db.getAllAsync(
    `SELECT id, category_id, name, price_satang, is_available, image_uri
       FROM menu_items
      WHERE category_id = ?
        AND (? = 0 OR is_available = 1)
      ORDER BY name;`,
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
            c.name AS category_name
       FROM menu_items AS m
       JOIN categories AS c ON c.id = m.category_id
      WHERE m.name LIKE '%' || ? || '%'
        AND (? = 0 OR m.is_available = 1)
      ORDER BY c.sort_order, m.name;`,
    [keyword, onlyAvailable ? 1 : 0]
  );
}
