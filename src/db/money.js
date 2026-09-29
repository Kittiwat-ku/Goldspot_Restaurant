/**
 * แปลงหน่วยเงิน
 * ในฐานข้อมูลเก็บเป็นสตางค์ (จำนวนเต็ม) เพื่อเลี่ยงความคลาดเคลื่อนของเลขทศนิยม
 */

import { SATANG_PER_BAHT } from './schema';

/** 6050 -> "60.50" */
export function formatBaht(satang) {
  return (Number(satang ?? 0) / SATANG_PER_BAHT).toFixed(2);
}
