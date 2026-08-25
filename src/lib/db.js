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

  CREATE TABLE IF NOT EXISTS mail_signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// DB Schema is initialized cleanly without initial dummy seed data.

export default db;
