

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
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวผัดกะเพราหมูสับ', priceSatang: 6000, image: '' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวผัดหมู', priceSatang: 5500, image: 'khao-pad-moo.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวหมูกรอบ', priceSatang: 7000, image: 'khao-moo-krob.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวไข่เจียวหมูสับ', priceSatang: 5000, image: 'khao-kai-jiao.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ผัดซีอิ๊วหมู', priceSatang: 6000, image: 'pad-see-ew-moo.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวหน้าไก่เทอริยากิ', priceSatang: 7500, image: 'khao-na-kai-teriyaki.jpg' },
  { categoryName: 'อาหารจานเดียว', name: 'ข้าวหมูผัดเห็ด', priceSatang: 6500, image: 'khao-moo-pad-het.jpg' },

  // กับข้าว
  { categoryName: 'กับข้าว', name: 'ต้มยำกุ้งน้ำข้น', priceSatang: 15000, image: 'tom-yum-kung.jpg' },
  { categoryName: 'กับข้าว', name: 'แกงเขียวหวานไก่', priceSatang: 12000, image: 'kaeng-khiao-wan-kai.jpg' },
  { categoryName: 'กับข้าว', name: 'ผัดผักรวมมิตร', priceSatang: 8000, image: 'pad-pak-ruam.jpg' },
  { categoryName: 'กับข้าว', name: 'ปลาทับทิมนึ่งมะนาว', priceSatang: 28000, image: 'pla-thapthim-neung-manao.jpg' },
  { categoryName: 'กับข้าว', name: 'ไข่เจียวหมูสับ', priceSatang: 6000, image: 'kai-jiao-moo-sap.jpg' },
  { categoryName: 'กับข้าว', name: 'หมูผัดพริกแกง', priceSatang: 9000, image: 'moo-pad-prik-kaeng.jpg' },

  // ของทานเล่น
  { categoryName: 'ของทานเล่น', name: 'ปีกไก่ทอดน้ำปลา', priceSatang: 9000, image: 'peek-kai-tod-nam-pla.jpg' },
  { categoryName: 'ของทานเล่น', name: 'เฟรนช์ฟรายส์', priceSatang: 6000, image: 'french-fries.jpg' },
  { categoryName: 'ของทานเล่น', name: 'ปอเปี๊ยะทอด', priceSatang: 7000, image: 'popia-tod.jpg' },
  { categoryName: 'ของทานเล่น', name: 'กุ้งชุบแป้งทอด', priceSatang: 12000, image: 'kung-chup-paeng-tod.jpg' },
  { categoryName: 'ของทานเล่น', name: 'ทอดมันปลากราย', priceSatang: 9500, image: 'tod-man-pla-krai.jpg' },

  // เครื่องดื่ม
  { categoryName: 'เครื่องดื่ม', name: 'น้ำเปล่า', priceSatang: 1500, image: 'nam-plao.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'น้ำอัดลม', priceSatang: 2500, image: 'nam-adlom.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'ชาเย็น', priceSatang: 4500, image: 'cha-yen.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'กาแฟเย็น', priceSatang: 5000, image: 'kafae-yen.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'น้ำมะนาวโซดา', priceSatang: 5500, image: 'nam-manao-soda.jpg' },
  { categoryName: 'เครื่องดื่ม', name: 'น้ำส้มคั้น', priceSatang: 6000, image: 'nam-som-khan.jpg' },

  // ของหวาน
  { categoryName: 'ของหวาน', name: 'ข้าวเหนียวมะม่วง', priceSatang: 9000, image: 'khao-niao-mamuang.jpg' },
  { categoryName: 'ของหวาน', name: 'บัวลอยไข่หวาน', priceSatang: 5500, image: 'bua-loy.jpg' },
  { categoryName: 'ของหวาน', name: 'ไอศกรีมกะทิ', priceSatang: 5000, image: 'ice-cream-kathi.jpg' },
  { categoryName: 'ของหวาน', name: 'ลอดช่องน้ำกะทิ', priceSatang: 5000, image: 'lod-chong.jpg' },
  { categoryName: 'ของหวาน', name: 'ทับทิมกรอบ', priceSatang: 6000, image: 'thapthim-krob.jpg' },
];
