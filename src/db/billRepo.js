/** โต๊ะทั้งหมด */
export function listTablesWithStatus(db) {
  return db.getAllAsync(
    `SELECT t.id                AS table_id,
            t.table_number,
            t.seats,
            b.id                AS open_bill_id,
            b.opened_at,
            COALESCE(SUM(oi.unit_price_satang * oi.quantity), 0) AS total_satang
       FROM dining_tables AS t
       LEFT JOIN bills        AS b  ON b.table_id = t.id AND b.status = 'open'
       LEFT JOIN order_rounds AS r  ON r.bill_id  = b.id
       LEFT JOIN order_items  AS oi ON oi.round_id = r.id
                                   AND oi.status <> 'cancelled'
      GROUP BY t.id, t.table_number, t.seats, b.id, b.opened_at
      ORDER BY t.table_number;`
  );
}

export function getOpenBillForTable(db, tableId) {
  return db.getFirstAsync(
    `SELECT id, table_id, status, opened_at
       FROM bills
      WHERE table_id = ? AND status = 'open';`,
    [tableId]
  );
}

export async function openOrGetBill(db, tableId) {
  const existing = await getOpenBillForTable(db, tableId);
  if (existing) return existing;

  const result = await db.runAsync(
    `INSERT INTO bills (table_id, status, opened_at)
     VALUES (?, 'open', datetime('now', 'localtime'));`,
    [tableId]
  );
  return getBillById(db, result.lastInsertRowId);
}

export function getBillById(db, billId) {
  return db.getFirstAsync(
    `SELECT b.id, b.table_id, b.status, b.opened_at, b.closed_at, t.table_number
       FROM bills AS b
       JOIN dining_tables AS t ON t.id = b.table_id
      WHERE b.id = ?;`,
    [billId]
  );
}

/**
 * ยอดรวมทั้งบิล
 * รายการที่ถูกยกเลิกไม่ถูกนับ
 */
export function getBillTotal(db, billId) {
  return db.getFirstAsync(
    `SELECT COALESCE(SUM(oi.unit_price_satang * oi.quantity), 0) AS total_satang,
            COALESCE(SUM(oi.quantity), 0)                        AS total_quantity,
            COUNT(oi.id)                                         AS line_count
       FROM order_rounds AS r
       JOIN order_items  AS oi ON oi.round_id = r.id
      WHERE r.bill_id = ?
        AND oi.status <> 'cancelled';`,
    [billId]
  );
}

export function listBillLines(db, billId) {
  return db.getAllAsync(
    `SELECT r.id                                AS round_id,
            r.round_no,
            r.ordered_at,
            oi.id                               AS order_item_id,
            oi.item_name,
            oi.unit_price_satang,
            oi.quantity,
            oi.unit_price_satang * oi.quantity  AS line_total_satang,
            oi.status,
            oi.note
       FROM order_rounds AS r
       JOIN order_items  AS oi ON oi.round_id = r.id
      WHERE r.bill_id = ?
      ORDER BY r.round_no, oi.id;`,
    [billId]
  );
}

/** ยอดรวมแยกตามรอบ */
export function listRoundTotals(db, billId) {
  return db.getAllAsync(
    `SELECT r.id AS round_id,
            r.round_no,
            r.ordered_at,
            COALESCE(SUM(CASE WHEN oi.status <> 'cancelled'
                              THEN oi.unit_price_satang * oi.quantity END), 0) AS round_total_satang
       FROM order_rounds AS r
       LEFT JOIN order_items AS oi ON oi.round_id = r.id
      WHERE r.bill_id = ?
      GROUP BY r.id, r.round_no, r.ordered_at
      ORDER BY r.round_no;`,
    [billId]
  );
}

/**
 * ปิดบิล ปิดแล้วโต๊ะนั้นเปิดบิลใหม่ได้ทันที และบิลเก่ายังเรียกดูย้อนหลังได้
 */
export async function closeBill(db, billId) {
  const result = await db.runAsync(
    `UPDATE bills
        SET status = 'closed',
            closed_at = datetime('now', 'localtime')
      WHERE id = ? AND status = 'open';`,
    [billId]
  );
  if (result.changes === 0) {
    throw new Error('ปิดบิลไม่สำเร็จ: ไม่พบบิลใบนี้ หรือบิลถูกปิดไปแล้ว');
  }
  return result.changes;
}

