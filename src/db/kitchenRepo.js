/** คิวในครัว */
export function listKitchenQueue(db) {
  return db.getAllAsync(
    `SELECT oi.id           AS order_item_id,
            oi.item_name,
            oi.quantity,
            oi.note,
            oi.status,
            (SELECT GROUP_CONCAT(oio.option_name, ', ')
               FROM order_item_options AS oio
              WHERE oio.order_item_id = oi.id) AS options_text,
            r.round_no,
            r.ordered_at,
            t.table_number,
            b.id            AS bill_id
       FROM order_items  AS oi
       JOIN order_rounds AS r ON r.id = oi.round_id
       JOIN bills        AS b ON b.id = r.bill_id
       JOIN dining_tables AS t ON t.id = b.table_id
      WHERE oi.status IN ('pending', 'cooking')
      ORDER BY r.ordered_at, oi.id;`
  );
}

/** จำนวนรายการค้างในครัว */
export function countKitchenQueueByStatus(db) {
  return db.getAllAsync(
    `SELECT status, COUNT(*) AS item_count
       FROM order_items
      WHERE status IN ('pending', 'cooking')
      GROUP BY status;`
  );
}

/** เปลี่ยนสถานะการทำอาหาร  */
export async function updateItemStatus(db, orderItemId, nextStatus) {
  const result = await db.runAsync(
    `UPDATE order_items
        SET status = ?
      WHERE id = ?
        AND status IN ('pending', 'cooking');`,
    [nextStatus, orderItemId]
  );

  if (result.changes === 0) {
    throw new Error('เปลี่ยนสถานะไม่ได้: รายการนี้เสิร์ฟแล้วหรือถูกยกเลิกไปแล้ว');
  }
  return result.changes;
}

/** ยกเลิกรายการที่ครัวยังไม่ลงมือทำ พร้อมบันทึกเวลาที่ยกเลิก*/
export async function cancelOrderItem(db, orderItemId) {
  const result = await db.runAsync(
    `UPDATE order_items
        SET status = 'cancelled',
            cancelled_at = datetime('now', 'localtime')
      WHERE id = ? AND status = 'pending';`,
    [orderItemId]
  );

  if (result.changes === 0) {
    throw new Error('ยกเลิกไม่ได้: ครัวลงมือทำรายการนี้ไปแล้ว');
  }
  return result.changes;
}
