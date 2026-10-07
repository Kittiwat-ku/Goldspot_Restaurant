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

      const result = await db.runAsync(
        `INSERT INTO order_items
           (round_id, menu_item_id, item_name, unit_price_satang, quantity, status, note)
         SELECT ?, m.id, m.name, m.price_satang, ?, 'pending', ?
           FROM menu_items AS m
          WHERE m.id = ? AND m.is_available = 1;`,
        [roundId, quantity, item.note ?? null, item.menuItemId]
      );

      if (result.changes !== 1) {
        throw new Error('เมนูบางรายการถูกปิดการขายไปแล้ว กรุณาตรวจสอบตะกร้าอีกครั้ง');
      }
      const orderItemId = result.lastInsertRowId;

      for (const optionId of item.optionIds ?? []) {
        const optionResult = await db.runAsync(
          `INSERT INTO order_item_options
             (order_item_id, option_id, option_name, extra_price_satang)
           SELECT ?, o.id, o.name, o.extra_price_satang
             FROM menu_options      AS o
             JOIN menu_item_options AS mio ON mio.option_id = o.id
            WHERE mio.menu_item_id = ? AND o.id = ?;`,
          [orderItemId, item.menuItemId, optionId]
        );

        if (optionResult.changes !== 1) {
          throw new Error('มีตัวเลือกที่เมนูนี้ไม่มีให้เลือก กรุณาตรวจตะกร้าอีกครั้ง');
        }
      }
    }

    placed = { roundId, roundNo, itemCount: cartItems.length };
  });

  return placed;
}
