/**
 * แปลงหน่วยเงิน
 * ในฐานข้อมูลเก็บเป็นสตางค์ (จำนวนเต็ม) เพื่อเลี่ยงความคลาดเคลื่อนของเลขทศนิยม
 */

import { SATANG_PER_BAHT } from './schema';

/** 6050 -> "60.50" */
export function formatBaht(satang) {
  return (Number(satang ?? 0) / SATANG_PER_BAHT).toFixed(2);
}

/**
 * แปลงราคาที่พนักงานพิมพ์เป็นบาท ("65" หรือ "65.50") ให้เป็นสตางค์ (6500, 6550)
 * คืน null ถ้าไม่ใช่ตัวเลขบวก หรือมีทศนิยมเกินสองตำแหน่ง
 */
export function toSatang(bahtText) {
  const text = String(bahtText ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

  const [baht, fraction = ''] = text.split('.');
  const satang = Number(baht) * SATANG_PER_BAHT + Number(fraction.padEnd(2, '0'));
  return satang > 0 ? satang : null;
}