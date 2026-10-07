/**
 * ข้อมูลตั้งต้นของร้าน
 *
 * image = ชื่อไฟล์รูปของเมนูนั้น ลงในคอลัมน์ menu_items.image_uri
 *  - เอารูปไปวางใน src/menu/ ให้ชื่อไฟล์ตรงกับที่เขียนไว้ตรงนี้ แล้วรูปจะขึ้นเอง
 *  - เมนูไหนยังไม่มีรูป หน้าจอจะแสดงกรอบว่างให้แทน
 *  - ถ้าอยากใช้รูปจากอินเทอร์เน็ต ใส่เป็นลิงก์เต็ม 'https://...' ได้เลย
 *
 * ข้อมูลชุดนี้ถูกใส่ครั้งเดียวตอนเปิดแอปครั้งแรก เพิ่มเมนูใหม่ในไฟล์นี้แล้ว
 * ให้กดปุ่ม "ล้างข้อมูลทั้งหมด" ที่หน้าครัว แอปจะใส่ข้อมูลชุดใหม่ให้
 */

export const TABLE_COUNT = 15;

export const SEED_CATEGORIES = [
  { name: 'อาหารจานเดียว', sortOrder: 1 },
  { name: 'กับข้าว', sortOrder: 2 },
  { name: 'ของทานเล่น', sortOrder: 3 },
  { name: 'เครื่องดื่ม', sortOrder: 4 },
  { name: 'ของหวาน', sortOrder: 5 },
];

/** categoryName ต้องตรงกับ name ใน SEED_CATEGORIES */
export const SEED_MENU_ITEMS = [
  // อาหารจานเดียว
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวผัดกะเพราหมูสับ', priceSatang: 6000, image: 'm1.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวผัดหมู', priceSatang: 5500, image: 'm2.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวมัสมั่นไก่', priceSatang: 7000, image: 'm3.webp' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวหมูกระเทียม', priceSatang: 5000, image: 'm4.webp' },
  { categoryName: 'อาหารจานเดียว', name: 'ผัดซีอิ๊วหมู', priceSatang: 6000, image: 'm5.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวซอยไก่', priceSatang: 7500, image: 'm6.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวหมูผัดพริกเกลือ', priceSatang: 6500, image: 'm7.jpg' },

  // กับข้าว
  { categoryName: 'กับข้าว', name: 'ต้มยำกุ้งน้ำข้น', priceSatang: 15000, image: 's1.jpg' },
  { categoryName: 'กับข้าว', name: 'แกงเขียวหวานไก่', priceSatang: 12000, image: 's2.jpg' },
  { categoryName: 'กับข้าว', name: 'ผัดผักรวมมิตร', priceSatang: 8000, image: 's3.jpg' },
  { categoryName: 'กับข้าว', name: 'ปลาทับทิมนึ่งมะนาว', priceSatang: 28000, image: 's4.jpg' },
  { categoryName: 'กับข้าว', name: 'ไข่เจียวหมูสับ', priceSatang: 6000, image: 's5.jpg' },
  { categoryName: 'กับข้าว', name: 'หมูผัดพริกแกง', priceSatang: 9000, image: 's6.jpg' },

  // ของทานเล่น
  { categoryName: 'ของทานเล่น', name: 'ปีกไก่ทอดน้ำปลา', priceSatang: 9000, image: 'c1.jpg' },
  { categoryName: 'ของทานเล่น', name: 'เฟรนช์ฟรายส์', priceSatang: 6000, image: 'c2.jpg' },
  { categoryName: 'ของทานเล่น', name: 'ปอเปี๊ยะทอด', priceSatang: 7000, image: 'c3.jpg' },
  { categoryName: 'ของทานเล่น', name: 'กุ้งชุบแป้งทอด', priceSatang: 12000, image: 'c4.jpg' },
  { categoryName: 'ของทานเล่น', name: 'ทอดมันปลากราย', priceSatang: 9500, image: 'c5.jpg' },

  // เครื่องดื่ม
  { categoryName: 'เครื่องดื่ม', name: 'น้ำเปล่า', priceSatang: 1500, image: 'd1.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'น้ำอัดลม', priceSatang: 2500, image: 'd2.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'ชาเย็น', priceSatang: 4500, image: 'd3.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'กาแฟเย็น', priceSatang: 5000, image: 'd4.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'น้ำมะนาวโซดา', priceSatang: 5500, image: 'd5.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'น้ำส้มคั้น', priceSatang: 6000, image: 'd6.jpg' },

  // ของหวาน
  { categoryName: 'ของหวาน', name: 'ข้าวเหนียวมะม่วง', priceSatang: 9000, image: 'i1.jpg' },
  { categoryName: 'ของหวาน', name: 'บัวลอยไข่หวาน', priceSatang: 5500, image: 'i2.jpg' },
  { categoryName: 'ของหวาน', name: 'ไอศกรีมกะทิ', priceSatang: 5000, image: 'i3.jpg' },
  { categoryName: 'ของหวาน', name: 'ลอดช่องน้ำกะทิ', priceSatang: 5000, image: 'i4.jpg' },
  { categoryName: 'ของหวาน', name: 'ทับทิมกรอบ', priceSatang: 6000, image: 'i5.jpg' },
];

/**
 * ตัวเลือกเสริมที่มีผลต่อราคา
 */
export const SEED_OPTIONS = [
  // อาหารจานเดียว
  {
    name: 'พิเศษ',
    extraSatang: 1000,
    menus: [
      'ข้าวผัดกะเพราหมูสับ', 'ข้าวผัดหมู', 'ข้าวมัสมั่นไก่', 'ข้าวหมูกระเทียม',
      'ผัดซีอิ๊วหมู', 'ข้าวซอยไก่', 'ข้าวหมูผัดพริกเกลือ',
    ],
  },
  {
    name: 'เพิ่มไข่ดาว',
    extraSatang: 1000,
    menus: ['ข้าวผัดกะเพราหมูสับ', 'ข้าวผัดหมู', 'ข้าวหมูกระเทียม', 'ข้าวหมูผัดพริกเกลือ'],
  },
  { name: 'เพิ่มไข่เจียว', extraSatang: 1500, menus: ['ข้าวผัดกะเพราหมูสับ', 'ข้าวหมูกระเทียม'] },
  // ข้าวผัดเป็นข้าวอยู่แล้ว ผัดซีอิ๊วกับข้าวซอยเป็นเส้น เลยไม่มี "เพิ่มข้าว"
  {
    name: 'เพิ่มข้าว',
    extraSatang: 1000,
    menus: ['ข้าวผัดกะเพราหมูสับ', 'ข้าวมัสมั่นไก่', 'ข้าวหมูกระเทียม', 'ข้าวหมูผัดพริกเกลือ'],
  },
  { name: 'เพิ่มเส้น', extraSatang: 1000, menus: ['ผัดซีอิ๊วหมู', 'ข้าวซอยไก่'] },
  { name: 'เปลี่ยนเป็นหมูกรอบ', extraSatang: 1500, menus: ['ข้าวผัดกะเพราหมูสับ', 'หมูผัดพริกแกง'] },
  { name: 'เพิ่มน่องไก่', extraSatang: 2500, menus: ['ข้าวมัสมั่นไก่', 'ข้าวซอยไก่'] },

  // กับข้าว
  {
    name: 'จานใหญ่',
    extraSatang: 4000,
    menus: ['ต้มยำกุ้งน้ำข้น', 'แกงเขียวหวานไก่', 'ผัดผักรวมมิตร', 'หมูผัดพริกแกง'],
  },
  { name: 'เพิ่มกุ้ง', extraSatang: 4000, menus: ['ต้มยำกุ้งน้ำข้น', 'ผัดผักรวมมิตร'] },
  { name: 'เสิร์ฟในหม้อไฟ', extraSatang: 3000, menus: ['ต้มยำกุ้งน้ำข้น'] },
  { name: 'เพิ่มขนมจีน', extraSatang: 1500, menus: ['แกงเขียวหวานไก่'] },
  { name: 'ปลาตัวใหญ่', extraSatang: 8000, menus: ['ปลาทับทิมนึ่งมะนาว'] },
  { name: 'เพิ่มหมูสับ', extraSatang: 1500, menus: ['ไข่เจียวหมูสับ'] },

  // ของทานเล่น
  { name: 'ถาดใหญ่', extraSatang: 3000, menus: ['เฟรนช์ฟรายส์', 'กุ้งชุบแป้งทอด'] },
  { name: 'ราดชีส', extraSatang: 2000, menus: ['เฟรนช์ฟรายส์'] },
  { name: 'เพิ่มปีกไก่ 3 ชิ้น', extraSatang: 4000, menus: ['ปีกไก่ทอดน้ำปลา'] },

  // เครื่องดื่ม
  {
    name: 'แก้วใหญ่',
    extraSatang: 1000,
    menus: ['น้ำอัดลม', 'ชาเย็น', 'กาแฟเย็น', 'น้ำมะนาวโซดา', 'น้ำส้มคั้น'],
  },
  { name: 'หวานน้อย', extraSatang: 0, menus: ['ชาเย็น', 'กาแฟเย็น', 'น้ำมะนาวโซดา'] },
  { name: 'เพิ่มไข่มุก', extraSatang: 1000, menus: ['ชาเย็น', 'กาแฟเย็น'] },
  { name: 'เพิ่มช็อต', extraSatang: 1500, menus: ['กาแฟเย็น'] },
  { name: 'เพิ่มน้ำผึ้ง', extraSatang: 1000, menus: ['น้ำมะนาวโซดา'] },

  // ของหวาน
  { name: 'เพิ่มมะม่วง', extraSatang: 4000, menus: ['ข้าวเหนียวมะม่วง'] },
  { name: 'เพิ่มข้าวเหนียว', extraSatang: 1500, menus: ['ข้าวเหนียวมะม่วง'] },
  { name: 'เพิ่มไข่หวาน', extraSatang: 1000, menus: ['บัวลอยไข่หวาน'] },
  { name: 'เพิ่ม 1 สกู๊ป', extraSatang: 2500, menus: ['ไอศกรีมกะทิ'] },
];
