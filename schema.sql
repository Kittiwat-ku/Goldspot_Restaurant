PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- 1) หมวดหมู่อาหาร
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  CHECK (length(trim(name)) > 0)
);

-- ---------------------------------------------------------------------------
-- 2) รายการอาหาร  (ราคาเก็บเป็นสตางค์ จำนวนเต็ม ห้ามใช้ REAL)
--    ON DELETE RESTRICT: ห้ามลบหมวดที่ยังมีเมนูค้างอยู่ กันเมนูลอยไร้หมวด
--    image_uri เก็บชื่อไฟล์รูปในโฟลเดอร์ src/menu/ ไม่ได้เก็บตัวไฟล์รูป
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id       INTEGER NOT NULL REFERENCES categories(id)
                      ON UPDATE CASCADE
                      ON DELETE RESTRICT,
  name              TEXT    NOT NULL,
  price_satang      INTEGER NOT NULL,
  is_available      INTEGER NOT NULL DEFAULT 1,
  image_uri         TEXT,
  UNIQUE (category_id, name),
  CHECK (length(trim(name)) > 0),
  CHECK (price_satang > 0),
  CHECK (is_available IN (0, 1))
);

-- ---------------------------------------------------------------------------
-- 3) โต๊ะในร้าน
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dining_tables (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_number  INTEGER NOT NULL UNIQUE,
  seats         INTEGER NOT NULL DEFAULT 4,
  CHECK (table_number > 0),
  CHECK (seats > 0)
);

-- ---------------------------------------------------------------------------
-- 4) บิล  (หนึ่งมื้อของหนึ่งโต๊ะ)
--    ON DELETE RESTRICT: ห้ามลบโต๊ะที่เคยมีบิล เพราะจะทำให้ยอดขายย้อนหลังหาย
--    CHECK คู่ล่าง บังคับให้ open ต้องไม่มีเวลาปิด และ closed ต้องมีเวลาปิดเสมอ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id   INTEGER NOT NULL REFERENCES dining_tables(id)
               ON UPDATE CASCADE
               ON DELETE RESTRICT,
  status     TEXT    NOT NULL DEFAULT 'open',
  opened_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  closed_at  TEXT,
  CHECK (status IN ('open', 'closed')),
  CHECK (
    (status = 'open'   AND closed_at IS NULL) OR
    (status = 'closed' AND closed_at IS NOT NULL)
  )
);

-- หนึ่งโต๊ะเปิดบิลค้างได้ครั้งละหนึ่งใบเท่านั้น (บิลที่ปิดแล้วไม่ถูกนับ)
CREATE UNIQUE INDEX IF NOT EXISTS ux_bills_one_open_per_table
  ON bills (table_id)
  WHERE status = 'open';

-- ---------------------------------------------------------------------------
-- 5) รอบการสั่ง  (ลูกค้ากดยืนยันหนึ่งครั้ง = หนึ่งรอบ)
--    ON DELETE CASCADE: ถ้าบิลถูกลบ รอบที่อยู่ใต้บิลนั้นไม่มีความหมายอีกต่อไป
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_rounds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id     INTEGER NOT NULL REFERENCES bills(id)
                ON UPDATE CASCADE
                ON DELETE CASCADE,
  round_no    INTEGER NOT NULL,
  ordered_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE (bill_id, round_no),
  CHECK (round_no > 0)
);

-- ---------------------------------------------------------------------------
-- 6) รายการที่สั่งในแต่ละรอบ
--    item_name / unit_price_satang คือ "สำเนาราคา ณ เวลาที่สั่ง"
--    ทำให้บิลเก่าคงราคาเดิมแม้เจ้าของร้านจะขึ้นราคาเมนูภายหลัง
--    ON DELETE RESTRICT ที่ menu_item_id: ห้ามลบเมนูที่เคยถูกสั่ง ให้ปิดการขายแทน
--    status: pending (รอครัวรับ) -> cooking (กำลังทำ) -> served (เสิร์ฟแล้ว)
--            หรือ cancelled (ยกเลิก ต้องมีเวลาที่ยกเลิกเสมอ)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id           INTEGER NOT NULL REFERENCES order_rounds(id)
                       ON UPDATE CASCADE
                       ON DELETE CASCADE,
  menu_item_id       INTEGER NOT NULL REFERENCES menu_items(id)
                       ON UPDATE CASCADE
                       ON DELETE RESTRICT,
  item_name          TEXT    NOT NULL,
  unit_price_satang  INTEGER NOT NULL,
  quantity           INTEGER NOT NULL,
  status             TEXT    NOT NULL DEFAULT 'pending',
  note               TEXT,
  cancelled_at       TEXT,
  CHECK (length(trim(item_name)) > 0),
  CHECK (unit_price_satang > 0),
  CHECK (quantity > 0),
  CHECK (status IN ('pending', 'cooking', 'served', 'cancelled')),
  CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status <> 'cancelled' AND cancelled_at IS NULL)
  )
);

-- ---------------------------------------------------------------------------
-- 7) ตัวเลือกเสริมที่มีผลต่อราคา เช่น พิเศษ +10 บาท, เพิ่มไข่ดาว +10 บาท
--    แยกจาก menu_items เพราะตัวเลือกเดียวใช้ได้กับหลายเมนู
--    ถ้าเก็บไว้ในแถวเมนู ต้องขึ้นราคาไข่ดาวซ้ำทีละเมนู และพลาดง่าย
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_options (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL UNIQUE,
  extra_price_satang  INTEGER NOT NULL,
  CHECK (length(trim(name)) > 0),
  CHECK (extra_price_satang >= 0)
);

-- ---------------------------------------------------------------------------
-- 8) เมนูไหนเลือกตัวเลือกไหนได้ (ความสัมพันธ์แบบหลายต่อหลาย)
--    ไข่ดาวใส่ได้หลายจาน และกะเพราจานเดียวก็เลือกได้หลายตัวเลือก
--    ON DELETE CASCADE ทั้งสองฝั่ง: แถวนี้บอกแค่ว่า "เลือกได้" ไม่มีประวัติการขาย
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_item_options (
  menu_item_id  INTEGER NOT NULL REFERENCES menu_items(id)
                  ON UPDATE CASCADE
                  ON DELETE CASCADE,
  option_id     INTEGER NOT NULL REFERENCES menu_options(id)
                  ON UPDATE CASCADE
                  ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, option_id)
);

-- ---------------------------------------------------------------------------
-- 9) ตัวเลือกที่ลูกค้าเลือกจริงในแต่ละรายการที่สั่ง
--    option_name / extra_price_satang เป็นสำเนา ณ เวลาที่สั่ง เหตุผลเดียวกับ order_items:
--    ขึ้นราคาไข่ดาวภายหลังแล้ว บิลเก่าต้องคงราคาเดิม
--    ON DELETE CASCADE ที่ order_item_id: ลบรายการแล้วตัวเลือกของรายการนั้นไม่มีความหมาย
--    ON DELETE RESTRICT ที่ option_id: ห้ามลบตัวเลือกที่เคยถูกสั่ง
--    PRIMARY KEY คู่นี้กันการเลือกตัวเลือกเดิมซ้ำในจานเดียว และใช้เป็นดัชนีตอนรวมยอดด้วย
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_item_options (
  order_item_id       INTEGER NOT NULL REFERENCES order_items(id)
                        ON UPDATE CASCADE
                        ON DELETE CASCADE,
  option_id           INTEGER NOT NULL REFERENCES menu_options(id)
                        ON UPDATE CASCADE
                        ON DELETE RESTRICT,
  option_name         TEXT    NOT NULL,
  extra_price_satang  INTEGER NOT NULL,
  PRIMARY KEY (order_item_id, option_id),
  CHECK (length(trim(option_name)) > 0),
  CHECK (extra_price_satang >= 0)
);

-- ---------------------------------------------------------------------------
-- 10) ค่าตั้งค่าเล็ก ๆ ของแอป ใช้กันการใส่ข้อมูลตั้งต้นซ้ำ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- ดัชนี: สร้างบนคอลัมน์ที่ถูกค้นบ่อยจริงในแอป
-- ---------------------------------------------------------------------------

-- หน้าเมนูฝั่งลูกค้า: ดึงเมนูของหมวดหนึ่ง เรียงตามชื่อ
CREATE INDEX IF NOT EXISTS idx_menu_items_category
  ON menu_items (category_id, name);

-- หน้าเลือกโต๊ะ: หาบิลที่ยังเปิดอยู่ของโต๊ะนั้น
CREATE INDEX IF NOT EXISTS idx_bills_table_status
  ON bills (table_id, status);

-- หน้าสรุปบิล: ไล่รอบทั้งหมดของบิลเดียวตามลำดับรอบ
CREATE INDEX IF NOT EXISTS idx_order_rounds_bill
  ON order_rounds (bill_id, round_no);

-- หน้าสรุปบิล / การรวมยอด: ดึงรายการทั้งหมดของรอบหนึ่ง
CREATE INDEX IF NOT EXISTS idx_order_items_round
  ON order_items (round_id);

-- หน้าจอครัว: ดึงเฉพาะรายการที่ยังไม่เสิร์ฟ เรียงเก่าสุดขึ้นก่อน
CREATE INDEX IF NOT EXISTS idx_order_items_status
  ON order_items (status, id);

-- ===========================================================================
-- ข้อมูลตั้งต้น (ชุดเดียวกับ src/db/seedData.js ที่แอปใส่ให้ตอนเปิดครั้งแรก)
-- ใช้ INSERT OR IGNORE จึงรันไฟล์นี้ซ้ำได้โดยไม่เกิดข้อมูลซ้ำ
-- ราคาทุกช่องเป็นสตางค์ เช่น 6000 = 60 บาท
-- id ของหมวด/เมนู/ตัวเลือก หาจากชื่อด้วย subquery ไม่ต้องจำเลข id เอง
-- ===========================================================================

-- หมวดอาหาร
INSERT OR IGNORE INTO categories (name, sort_order) VALUES
  ('อาหารจานเดียว', 1),
  ('กับข้าว', 2),
  ('ของทานเล่น', 3),
  ('เครื่องดื่ม', 4),
  ('ของหวาน', 5);

-- เมนูอาหาร
INSERT OR IGNORE INTO menu_items (category_id, name, price_satang, is_available, image_uri) VALUES
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ข้าวผัดกะเพราหมูสับ', 6000, 1, 'm1.jpg'),
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ข้าวผัดหมู', 5500, 1, 'm2.jpg'),
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ข้าวมัสมั่นไก่', 7000, 1, 'm3.webp'),
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ข้าวหมูกระเทียม', 5000, 1, 'm4.webp'),
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ผัดซีอิ๊วหมู', 6000, 1, 'm5.jpg'),
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ข้าวซอยไก่', 7500, 1, 'm6.jpg'),
  ((SELECT id FROM categories WHERE name = 'อาหารจานเดียว'), 'ข้าวหมูผัดพริกเกลือ', 6500, 1, 'm7.jpg'),
  ((SELECT id FROM categories WHERE name = 'กับข้าว'), 'ต้มยำกุ้งน้ำข้น', 15000, 1, 's1.jpg'),
  ((SELECT id FROM categories WHERE name = 'กับข้าว'), 'แกงเขียวหวานไก่', 12000, 1, 's2.jpg'),
  ((SELECT id FROM categories WHERE name = 'กับข้าว'), 'ผัดผักรวมมิตร', 8000, 1, 's3.jpg'),
  ((SELECT id FROM categories WHERE name = 'กับข้าว'), 'ปลาทับทิมนึ่งมะนาว', 28000, 1, 's4.jpg'),
  ((SELECT id FROM categories WHERE name = 'กับข้าว'), 'ไข่เจียวหมูสับ', 6000, 1, 's5.jpg'),
  ((SELECT id FROM categories WHERE name = 'กับข้าว'), 'หมูผัดพริกแกง', 9000, 1, 's6.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของทานเล่น'), 'ปีกไก่ทอดน้ำปลา', 9000, 1, 'c1.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของทานเล่น'), 'เฟรนช์ฟรายส์', 6000, 1, 'c2.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของทานเล่น'), 'ปอเปี๊ยะทอด', 7000, 1, 'c3.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของทานเล่น'), 'กุ้งชุบแป้งทอด', 12000, 1, 'c4.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของทานเล่น'), 'ทอดมันปลากราย', 9500, 1, 'c5.jpg'),
  ((SELECT id FROM categories WHERE name = 'เครื่องดื่ม'), 'น้ำเปล่า', 1500, 1, 'd1.jpg'),
  ((SELECT id FROM categories WHERE name = 'เครื่องดื่ม'), 'น้ำอัดลม', 2500, 1, 'd2.jpg'),
  ((SELECT id FROM categories WHERE name = 'เครื่องดื่ม'), 'ชาเย็น', 4500, 1, 'd3.jpg'),
  ((SELECT id FROM categories WHERE name = 'เครื่องดื่ม'), 'กาแฟเย็น', 5000, 1, 'd4.jpg'),
  ((SELECT id FROM categories WHERE name = 'เครื่องดื่ม'), 'น้ำมะนาวโซดา', 5500, 1, 'd5.jpg'),
  ((SELECT id FROM categories WHERE name = 'เครื่องดื่ม'), 'น้ำส้มคั้น', 6000, 1, 'd6.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของหวาน'), 'ข้าวเหนียวมะม่วง', 9000, 1, 'i1.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของหวาน'), 'บัวลอยไข่หวาน', 5500, 1, 'i2.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของหวาน'), 'ไอศกรีมกะทิ', 5000, 1, 'i3.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของหวาน'), 'ลอดช่องน้ำกะทิ', 5000, 1, 'i4.jpg'),
  ((SELECT id FROM categories WHERE name = 'ของหวาน'), 'ทับทิมกรอบ', 6000, 1, 'i5.jpg');

-- โต๊ะ 15 โต๊ะ โต๊ะละ 4 ที่นั่ง
INSERT OR IGNORE INTO dining_tables (table_number, seats) VALUES
  (1, 4),
  (2, 4),
  (3, 4),
  (4, 4),
  (5, 4),
  (6, 4),
  (7, 4),
  (8, 4),
  (9, 4),
  (10, 4),
  (11, 4),
  (12, 4),
  (13, 4),
  (14, 4),
  (15, 4);

-- ตัวเลือกเสริมที่มีผลต่อราคา
INSERT OR IGNORE INTO menu_options (name, extra_price_satang) VALUES
  ('พิเศษ', 1000),
  ('เพิ่มไข่ดาว', 1000),
  ('เพิ่มไข่เจียว', 1500),
  ('เพิ่มข้าว', 1000),
  ('เพิ่มเส้น', 1000),
  ('เปลี่ยนเป็นหมูกรอบ', 1500),
  ('เพิ่มน่องไก่', 2500),
  ('จานใหญ่', 4000),
  ('เพิ่มกุ้ง', 4000),
  ('เสิร์ฟในหม้อไฟ', 3000),
  ('เพิ่มขนมจีน', 1500),
  ('ปลาตัวใหญ่', 8000),
  ('เพิ่มหมูสับ', 1500),
  ('ถาดใหญ่', 3000),
  ('ราดชีส', 2000),
  ('เพิ่มปีกไก่ 3 ชิ้น', 4000),
  ('แก้วใหญ่', 1000),
  ('หวานน้อย', 0),
  ('เพิ่มไข่มุก', 1000),
  ('เพิ่มช็อต', 1500),
  ('เพิ่มน้ำผึ้ง', 1000),
  ('เพิ่มมะม่วง', 4000),
  ('เพิ่มข้าวเหนียว', 1500),
  ('เพิ่มไข่หวาน', 1000),
  ('เพิ่ม 1 สกู๊ป', 2500);

-- เมนูไหนเลือกตัวเลือกไหนได้ (column1 = ชื่อตัวเลือก, column2 = ชื่อเมนู)
INSERT OR IGNORE INTO menu_item_options (menu_item_id, option_id)
SELECT m.id, o.id
  FROM (VALUES
    ('พิเศษ', 'ข้าวผัดกะเพราหมูสับ'),
    ('พิเศษ', 'ข้าวผัดหมู'),
    ('พิเศษ', 'ข้าวมัสมั่นไก่'),
    ('พิเศษ', 'ข้าวหมูกระเทียม'),
    ('พิเศษ', 'ผัดซีอิ๊วหมู'),
    ('พิเศษ', 'ข้าวซอยไก่'),
    ('พิเศษ', 'ข้าวหมูผัดพริกเกลือ'),
    ('เพิ่มไข่ดาว', 'ข้าวผัดกะเพราหมูสับ'),
    ('เพิ่มไข่ดาว', 'ข้าวผัดหมู'),
    ('เพิ่มไข่ดาว', 'ข้าวหมูกระเทียม'),
    ('เพิ่มไข่ดาว', 'ข้าวหมูผัดพริกเกลือ'),
    ('เพิ่มไข่เจียว', 'ข้าวผัดกะเพราหมูสับ'),
    ('เพิ่มไข่เจียว', 'ข้าวหมูกระเทียม'),
    ('เพิ่มข้าว', 'ข้าวผัดกะเพราหมูสับ'),
    ('เพิ่มข้าว', 'ข้าวมัสมั่นไก่'),
    ('เพิ่มข้าว', 'ข้าวหมูกระเทียม'),
    ('เพิ่มข้าว', 'ข้าวหมูผัดพริกเกลือ'),
    ('เพิ่มเส้น', 'ผัดซีอิ๊วหมู'),
    ('เพิ่มเส้น', 'ข้าวซอยไก่'),
    ('เปลี่ยนเป็นหมูกรอบ', 'ข้าวผัดกะเพราหมูสับ'),
    ('เปลี่ยนเป็นหมูกรอบ', 'หมูผัดพริกแกง'),
    ('เพิ่มน่องไก่', 'ข้าวมัสมั่นไก่'),
    ('เพิ่มน่องไก่', 'ข้าวซอยไก่'),
    ('จานใหญ่', 'ต้มยำกุ้งน้ำข้น'),
    ('จานใหญ่', 'แกงเขียวหวานไก่'),
    ('จานใหญ่', 'ผัดผักรวมมิตร'),
    ('จานใหญ่', 'หมูผัดพริกแกง'),
    ('เพิ่มกุ้ง', 'ต้มยำกุ้งน้ำข้น'),
    ('เพิ่มกุ้ง', 'ผัดผักรวมมิตร'),
    ('เสิร์ฟในหม้อไฟ', 'ต้มยำกุ้งน้ำข้น'),
    ('เพิ่มขนมจีน', 'แกงเขียวหวานไก่'),
    ('ปลาตัวใหญ่', 'ปลาทับทิมนึ่งมะนาว'),
    ('เพิ่มหมูสับ', 'ไข่เจียวหมูสับ'),
    ('ถาดใหญ่', 'เฟรนช์ฟรายส์'),
    ('ถาดใหญ่', 'กุ้งชุบแป้งทอด'),
    ('ราดชีส', 'เฟรนช์ฟรายส์'),
    ('เพิ่มปีกไก่ 3 ชิ้น', 'ปีกไก่ทอดน้ำปลา'),
    ('แก้วใหญ่', 'น้ำอัดลม'),
    ('แก้วใหญ่', 'ชาเย็น'),
    ('แก้วใหญ่', 'กาแฟเย็น'),
    ('แก้วใหญ่', 'น้ำมะนาวโซดา'),
    ('แก้วใหญ่', 'น้ำส้มคั้น'),
    ('หวานน้อย', 'ชาเย็น'),
    ('หวานน้อย', 'กาแฟเย็น'),
    ('หวานน้อย', 'น้ำมะนาวโซดา'),
    ('เพิ่มไข่มุก', 'ชาเย็น'),
    ('เพิ่มไข่มุก', 'กาแฟเย็น'),
    ('เพิ่มช็อต', 'กาแฟเย็น'),
    ('เพิ่มน้ำผึ้ง', 'น้ำมะนาวโซดา'),
    ('เพิ่มมะม่วง', 'ข้าวเหนียวมะม่วง'),
    ('เพิ่มข้าวเหนียว', 'ข้าวเหนียวมะม่วง'),
    ('เพิ่มไข่หวาน', 'บัวลอยไข่หวาน'),
    ('เพิ่ม 1 สกู๊ป', 'ไอศกรีมกะทิ')
  ) AS pair
  JOIN menu_options AS o ON o.name = pair.column1
  JOIN menu_items   AS m ON m.name = pair.column2;
