export async function placeOrderRound(db, billId, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('ตะกร้าว่าง ยังส่งเข้าครัวไม่ได้');
  }

  let placed = null;

  await db.withTransactionAsync(async () => {
    const bill = await db.getFirstAsync(
      "SELECT id FROM bills WHERE id = ? AND status = 'open';",
      [billId]
    );
    if (!bill) {
      throw new Error('ส่งออร์เดอร์ไม่ได้: บิลใบนี้ถูกปิดไปแล้ว');
    }

    // รอบที่เท่าไรของบิลนี้เอาไว้เรียงลำดับรายการในบิล
    const nextRound = await db.getFirstAsync(
      `SELECT COALESCE(MAX(round_no), 0) + 1 AS round_no
         FROM order_rounds
        WHERE bill_id = ?;`,
      [billId]
    );
    const roundNo = nextRound.round_no;

    const roundResult = await db.runAsync(
      `INSERT INTO order_rounds (bill_id, round_no, ordered_at)
       VALUES (?, ?, datetime('now', 'localtime'));`,
      [billId, roundNo]
    );
    const roundId = roundResult.lastInsertRowId;

    for (const item of cartItems) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('จำนวนต้องเป็นจำนวนเต็มที่มากกว่าศูนย์');
      }

      // คงราคาบิลเดิม
      const result = await db.runAsync(
        `INSERT INTO order_items
           (round_id, menu_item_id, item_name, unit_price_satang, quantity, status, note)
         SELECT ?, m.id, m.name, m.price_satang, ?, 'pending', ?
           FROM menu_items AS m
          WHERE m.id = ? AND m.is_available = 1;`,
        [roundId, quantity, item.note ?? null, item.menuItemId]
      );

      if (result.changes !== 1) {
        throw new Error('เมนูบางรายการถูกปิดการขายไปแล้ว กรุณาตรวจตะกร้าอีกครั้ง');
      }
    }

    placed = { roundId, roundNo, itemCount: cartItems.length };
  });

  return placed;
}

