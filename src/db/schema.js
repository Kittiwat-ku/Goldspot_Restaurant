export const DATABASE_NAME = 'goldspot_restaurant_order_v1.db';

// ราคาเก็บเป็นสตางค์ (จำนวนเต็ม) หารด้วยค่านี้ตอนแสดงผลอย่างเดียว
export const SATANG_PER_BAHT = 100;

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- 1) หมวดหมู่อาหาร

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  CHECK (length(trim(name)) > 0)
);

-- 2) รายการอาหาร  (ราคาเก็บเป็นสตางค์ จำนวนเต็ม ห้ามใช้ REAL)

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


-- 3) โต๊ะในร้าน

CREATE TABLE IF NOT EXISTS dining_tables (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_number  INTEGER NOT NULL UNIQUE,
  seats         INTEGER NOT NULL DEFAULT 4,
  CHECK (table_number > 0),
  CHECK (seats > 0)
);


-- 4) บิล  (หนึ่งมื้อของหนึ่งโต๊ะ)

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


-- 5) รอบการสั่ง  (ลูกค้ากดยืนยันหนึ่งครั้ง = หนึ่งรอบ)

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


-- 6) รายการที่สั่งในแต่ละรอบ

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


-- 7) ตัวเลือกเสริมที่มีผลต่อราคา เช่น พิเศษ +10 บาท, เพิ่มไข่ดาว +10 บาท

CREATE TABLE IF NOT EXISTS menu_options (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL UNIQUE,
  extra_price_satang  INTEGER NOT NULL,
  CHECK (length(trim(name)) > 0),
  CHECK (extra_price_satang >= 0)
);


-- 8) เมนูไหนเลือกตัวเลือกไหนได้

CREATE TABLE IF NOT EXISTS menu_item_options (
  menu_item_id  INTEGER NOT NULL REFERENCES menu_items(id)
                  ON UPDATE CASCADE
                  ON DELETE CASCADE,
  option_id     INTEGER NOT NULL REFERENCES menu_options(id)
                  ON UPDATE CASCADE
                  ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, option_id)
);


-- 9) ตัวเลือกที่ลูกค้าเลือกจริงในแต่ละรายการที่สั่ง

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


-- 10) ค่าตั้งค่าเล็ก ๆ ของแอป ใช้กันการใส่ข้อมูลตั้งต้นซ้ำ

CREATE TABLE IF NOT EXISTS app_meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);


-- ดัชนี: สร้างบนคอลัมน์ที่ถูกค้นบ่อยจริงในแอป


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
`;
