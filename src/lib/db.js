import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'einstec_portal.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Create Tables Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS ipt_items (
    id TEXT PRIMARY KEY,
    work_type TEXT NOT NULL,
    custom_work_type TEXT,
    title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_date TEXT NOT NULL,
    end_time TEXT NOT NULL,
    include_weekends INTEGER DEFAULT 0,
    site TEXT NOT NULL,
    workers TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT '진행중',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS network_items (
    id TEXT PRIMARY KEY,
    work_type TEXT NOT NULL,
    custom_work_type TEXT,
    title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_date TEXT NOT NULL,
    end_time TEXT NOT NULL,
    include_weekends INTEGER DEFAULT 0,
    site TEXT NOT NULL,
    workers TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT '진행중',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    pm TEXT NOT NULL,
    workers TEXT NOT NULL,
    period TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    include_weekends INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT '시공중',
    budget TEXT,
    badge_class TEXT DEFAULT 'badge-active',
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meeting_items (
    id TEXT PRIMARY KEY,
    primary_category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    title TEXT NOT NULL,
    site TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    attendees TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    version TEXT DEFAULT 'v1.0',
    date TEXT NOT NULL,
    file_size TEXT,
    file_name TEXT NOT NULL,
    downloads INTEGER DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intranet_docs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    security_level TEXT DEFAULT '사내전용',
    version TEXT DEFAULT 'v1.0',
    author TEXT NOT NULL,
    date TEXT NOT NULL,
    target_info TEXT,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size TEXT,
    preview_img_path TEXT,
    is_primary INTEGER DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mail_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mails (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    sender_email TEXT,
    recipient TEXT,
    subject TEXT NOT NULL,
    snippet TEXT,
    content TEXT,
    date TEXT NOT NULL,
    folder TEXT DEFAULT 'inbox',
    unread INTEGER DEFAULT 1,
    is_external INTEGER DEFAULT 0,
    has_attachment INTEGER DEFAULT 0,
    owner_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '일반',
    password TEXT NOT NULL DEFAULT '1234',
    is_first_login INTEGER DEFAULT 0,
    department TEXT,
    rank TEXT,
    duty TEXT,
    hire_date TEXT,
    task TEXT,
    phone TEXT,
    mobile TEXT,
    fax TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    author_id TEXT,
    date TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT '개',
    location TEXT,
    unit_price INTEGER DEFAULT 0,
    updated_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id TEXT PRIMARY KEY,
    ticket_no TEXT NOT NULL,
    site TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT '네트워크',
    priority TEXT DEFAULT '보통',
    status TEXT DEFAULT '접수',
    workers TEXT,
    resolution_note TEXT,
    date TEXT NOT NULL,
    file_name TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    industry TEXT DEFAULT '제조업',
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    contract_status TEXT DEFAULT '유지보수 계약중',
    contract_date TEXT,
    assigned_pm TEXT,
    memo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '기타',
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size TEXT,
    uploaded_by TEXT DEFAULT '담당자',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_inspection_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size TEXT,
    version TEXT DEFAULT 'v1.0',
    is_primary INTEGER DEFAULT 0,
    uploaded_by TEXT DEFAULT '담당자',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_inspection_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    inspection_date TEXT NOT NULL,
    inspector TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size TEXT,
    memo TEXT,
    uploaded_by TEXT DEFAULT '담당자',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Initialize default admin accounts if users table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, role, password, is_first_login, department, rank, duty, hire_date, task, phone, mobile, fax, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    'netadmin', '마스터 관리자', '마스터 관리자', '1234', 0,
    '네트워크사업부', '총괄이사', '마스터 총괄', '2020-01-01',
    '시스템 총괄 및 인프라 보안', '02-6207-8000', '010-1234-5678', '02-6207-8001', '서울특별시 중구 남대문로 84'
  );
  insertUser.run(
    'leekw', '이강욱 팀장', '관리자', '1234', 0,
    '네트워크사업부', '팀장', '시공총괄', '2022-03-15',
    '인프라 시공 및 프로젝트 관리', '041-550-1000', '010-9876-5432', '041-550-1001', '충청남도 천안시 서북구 벤처로 10'
  );
}

// Migration helper for clients table
try {
  const clientCols = db.prepare("PRAGMA table_info(clients)").all();
  if (!clientCols.some(c => c.name === 'contacts')) {
    db.exec("ALTER TABLE clients ADD COLUMN contacts TEXT");
  }
  if (!clientCols.some(c => c.name === 'engineer_primary')) {
    db.exec("ALTER TABLE clients ADD COLUMN engineer_primary TEXT");
  }
  if (!clientCols.some(c => c.name === 'engineer_secondary')) {
    db.exec("ALTER TABLE clients ADD COLUMN engineer_secondary TEXT");
  }
  if (!clientCols.some(c => c.name === 'network_config')) {
    db.exec("ALTER TABLE clients ADD COLUMN network_config TEXT");
  }
  if (!clientCols.some(c => c.name === 'has_periodic_inspection')) {
    db.exec("ALTER TABLE clients ADD COLUMN has_periodic_inspection INTEGER DEFAULT 0");
  }
  if (!clientCols.some(c => c.name === 'inspection_cycle')) {
    db.exec("ALTER TABLE clients ADD COLUMN inspection_cycle TEXT DEFAULT '매월'");
  }
} catch (e) {
  console.warn('Clients migration error', e);
}

// Migration helper for intranet_docs
try {
  const columns = db.prepare("PRAGMA table_info(intranet_docs)").all();
  const hasFilePath = columns.some(c => c.name === 'file_path');
  const hasPreviewImgPath = columns.some(c => c.name === 'preview_img_path');
  const hasIsPrimary = columns.some(c => c.name === 'is_primary');

  if (!hasFilePath) {
    db.exec("ALTER TABLE intranet_docs ADD COLUMN file_path TEXT");
  }
  if (!hasPreviewImgPath) {
    db.exec("ALTER TABLE intranet_docs ADD COLUMN preview_img_path TEXT");
  }
  if (!hasIsPrimary) {
    db.exec("ALTER TABLE intranet_docs ADD COLUMN is_primary INTEGER DEFAULT 0");
  }

  // Clean up any preview_img_path records that accidentally store non-image file paths
  db.exec(`
    UPDATE intranet_docs
    SET preview_img_path = ''
    WHERE preview_img_path NOT LIKE '%.png'
      AND preview_img_path NOT LIKE '%.jpg'
      AND preview_img_path NOT LIKE '%.jpeg'
      AND preview_img_path NOT LIKE '%.webp'
      AND preview_img_path NOT LIKE '%.gif'
      AND preview_img_path NOT LIKE '%.svg'
      AND preview_img_path IS NOT NULL
      AND preview_img_path != ''
  `);
} catch (e) {
  console.warn('Migration error for intranet_docs:', e.message);
}

// Migration helper for mails
try {
  const mailCols = db.prepare("PRAGMA table_info(mails)").all();
  if (!mailCols.some(c => c.name === 'owner_id')) {
    db.exec("ALTER TABLE mails ADD COLUMN owner_id TEXT");
  }
} catch (e) {
  console.warn('Migration error for mails:', e.message);
}

// Migration helper for maintenance_tickets
try {
  const maintCols = db.prepare("PRAGMA table_info(maintenance_tickets)").all();
  if (!maintCols.some(c => c.name === 'file_name')) {
    db.exec("ALTER TABLE maintenance_tickets ADD COLUMN file_name TEXT");
  }
  if (!maintCols.some(c => c.name === 'file_path')) {
    db.exec("ALTER TABLE maintenance_tickets ADD COLUMN file_path TEXT");
  }
} catch (e) {
  console.warn('Migration error for maintenance_tickets:', e.message);
}

export default db;
