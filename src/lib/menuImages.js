const MENU_IMAGES = {
  'm1.jpg': require('../menu/m1.jpg'),
  'm2.jpg': require('../menu/m2.jpg'),
  'm3.webp': require('../menu/m3.webp'),
  'm4.webp': require('../menu/m4.webp'),
  'm5.jpg': require('../menu/m5.jpg'),
  'm6.jpg': require('../menu/m6.jpg'),
  'm7.jpg': require('../menu/m7.jpg'),
  // กับข้าว
  's1.jpg': require('../menu/s1.jpg'),
  's2.jpg': require('../menu/s2.jpg'),
  's3.jpg': require('../menu/s3.jpg'),
  's4.jpg': require('../menu/s4.jpg'),
  's5.jpg': require('../menu/s5.jpg'),
  's6.jpg': require('../menu/s6.jpg'),
  // ของทานเล่น
  'c1.jpg': require('../menu/c1.jpg'),
  'c2.jpg': require('../menu/c2.jpg'),
  'c3.jpg': require('../menu/c3.jpg'),
  'c4.jpg': require('../menu/c4.jpg'),
  'c5.jpg': require('../menu/c5.jpg'),
  // เครื่องดื่ม
  'd1.jpg': require('../menu/d1.jpg'),
  'd2.jpg': require('../menu/d2.jpg'),
  'd3.jpg': require('../menu/d3.jpg'),
  'd4.jpg': require('../menu/d4.jpg'),
  'd5.jpg': require('../menu/d5.jpg'),
  'd6.jpg': require('../menu/d6.jpg'),
  // ของหวาน
  'i1.jpg': require('../menu/i1.jpg'),
  'i2.jpg': require('../menu/i2.jpg'),
  'i3.jpg': require('../menu/i3.jpg'),
  'i4.jpg': require('../menu/i4.jpg'),
  'i5.jpg': require('../menu/i5.jpg'),
};

/**
 * @param {string|null} imageUri ค่าจากคอลัมน์ menu_items.image_uri
 * @returns รูปที่ส่งให้ prop source ของ <Image> ได้เลย หรือ null ถ้ายังไม่มีรูป
 */
export function getMenuImage(imageUri) {
  if (!imageUri) return null;

  // ถ้าเป็นลิงก์จากเน็ต ส่งเป็น uri ให้โหลดเอง
  if (imageUri.startsWith('http')) return { uri: imageUri };

  return MENU_IMAGES[imageUri] ?? null;
}
