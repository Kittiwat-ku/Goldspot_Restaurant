

export const MOCK_CATEGORIES = [
  { id: 1, name: 'อาหารจานเดียว', sort_order: 1 },
  { id: 2, name: 'กับข้าว', sort_order: 2 },
  { id: 3, name: 'ของทานเล่น', sort_order: 3 },
  { id: 4, name: 'เครื่องดื่ม', sort_order: 4 },
  { id: 5, name: 'ของหวาน', sort_order: 5 },
];

export const MOCK_MENU_ITEMS = [
  // อาหารจานเดียว
  { id: 1, category_id: 1, name: 'ข้าวผัดกะเพราหมูสับ', price_satang: 6000, is_available: true },
  { id: 2, category_id: 1, name: 'ข้าวผัดหมู', price_satang: 5500, is_available: true },
  { id: 3, category_id: 1, name: 'ข้าวหมูกรอบ', price_satang: 7000, is_available: true },
  { id: 4, category_id: 1, name: 'ข้าวไข่เจียวหมูสับ', price_satang: 5000, is_available: true },
  { id: 5, category_id: 1, name: 'ผัดซีอิ๊วหมู', price_satang: 6000, is_available: true },
  { id: 6, category_id: 1, name: 'ข้าวหน้าไก่เทอริยากิ', price_satang: 7500, is_available: true },

  // กับข้าว
  { id: 7, category_id: 2, name: 'ต้มยำกุ้งน้ำข้น', price_satang: 15000, is_available: true },
  { id: 8, category_id: 2, name: 'แกงเขียวหวานไก่', price_satang: 12000, is_available: true },
  { id: 9, category_id: 2, name: 'ผัดผักรวมมิตร', price_satang: 8000, is_available: true },
  { id: 10, category_id: 2, name: 'ปลาทับทิมนึ่งมะนาว', price_satang: 28000, is_available: true },
  { id: 11, category_id: 2, name: 'ไข่เจียวหมูสับ', price_satang: 6000, is_available: true },
  { id: 12, category_id: 2, name: 'หมูผัดพริกแกง', price_satang: 9000, is_available: true },

  // ของทานเล่น
  { id: 13, category_id: 3, name: 'ปีกไก่ทอดน้ำปลา', price_satang: 9000, is_available: true },
  { id: 14, category_id: 3, name: 'เฟรนช์ฟรายส์', price_satang: 6000, is_available: true },
  { id: 15, category_id: 3, name: 'ปอเปี๊ยะทอด', price_satang: 7000, is_available: true },
  { id: 16, category_id: 3, name: 'กุ้งชุบแป้งทอด', price_satang: 12000, is_available: true },
  { id: 17, category_id: 3, name: 'ทอดมันปลากราย', price_satang: 9500, is_available: true },

  // เครื่องดื่ม
  { id: 18, category_id: 4, name: 'น้ำเปล่า', price_satang: 1500, is_available: true },
  { id: 19, category_id: 4, name: 'น้ำอัดลม', price_satang: 2500, is_available: true },
  { id: 20, category_id: 4, name: 'ชาเย็น', price_satang: 4500, is_available: true },
  { id: 21, category_id: 4, name: 'กาแฟเย็น', price_satang: 5000, is_available: true },
  { id: 22, category_id: 4, name: 'น้ำมะนาวโซดา', price_satang: 5500, is_available: true },
  { id: 23, category_id: 4, name: 'น้ำส้มคั้น', price_satang: 6000, is_available: true },

  // ของหวาน
  { id: 24, category_id: 5, name: 'ข้าวเหนียวมะม่วง', price_satang: 9000, is_available: true },
  { id: 25, category_id: 5, name: 'บัวลอยไข่หวาน', price_satang: 5500, is_available: true },
  { id: 26, category_id: 5, name: 'ไอศกรีมกะทิ', price_satang: 5000, is_available: true },
  { id: 27, category_id: 5, name: 'ลอดช่องน้ำกะทิ', price_satang: 5000, is_available: true },
  { id: 28, category_id: 5, name: 'ทับทิมกรอบ', price_satang: 6000, is_available: true },
];

export function getMenuItemsByCategory(categoryId) {
  return MOCK_MENU_ITEMS.filter((item) => item.category_id === categoryId);
}
