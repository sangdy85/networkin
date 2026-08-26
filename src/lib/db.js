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
    file_size TEXT,
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

// Initialize default intranet network docs if intranet_docs table is empty
const intranetDocCount = db.prepare('SELECT COUNT(*) as count FROM intranet_docs').get().count;
if (intranetDocCount === 0) {
  const insertIntranetDoc = db.prepare(`
    INSERT INTO intranet_docs (code, title, category, security_level, version, author, date, target_info, file_name, file_size, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertIntranetDoc.run(
    'INT-NET-001', '[망구성도] 사내 본사/지사 전체 네트워크 토폴로지 및 랙 배치도', '망구성도/토폴로지', '대외비', 'v2.3', '이강욱 팀장', '2026-08-01', '192.168.0.0/16, Core-SW01', 'einstec_network_topology_2026.pdf', '8.4 MB', '본사 및 천안 지사 간 백본 망구성도, DMZ 구간 및 서버랙 위치 배치도 문서입니다.'
  );
  insertIntranetDoc.run(
    'INT-NET-002', '[IP/VLAN] 사내 IP 주소 대역 및 VLAN ID 할당 관리표', 'IP/VLAN 할당표', '사내전용', 'v3.1', '김철수 과장', '2026-08-10', 'VLAN 10(사무), VLAN 20(서버), VLAN 30(VoIP)', 'einstec_ip_vlan_mapping_2026.xlsx', '2.1 MB', '부서별 사내 IP 할당 현황 및 VLAN 구분표. 고정 IP 할당 현황 포함.'
  );
  insertIntranetDoc.run(
    'INT-NET-003', '[방화벽] 사내 UTM 방화벽 인바운드/아웃바운드 보안 정책서', '방화벽/보안 정책', '대외비', 'v1.8', '이강욱 팀장', '2026-08-12', 'UTM-FW-01 (192.168.1.1)', 'Einstec_UTM_Firewall_Policy.pdf', '3.7 MB', '외부 접속 차단 룰 및 내부 포트포워딩(HTTP/HTTPS/SSH) 보안 정책 명세서.'
  );
  insertIntranetDoc.run(
    'INT-NET-004', '[VPN] 임직원 재택/원격 근무용 SSL-VPN 접속 가이드', 'VPN/원격접속', '사내전용', 'v2.0', '박민우 대리', '2026-08-15', 'VPN Gateway (10.8.0.0/24)', 'Einstec_SSL_VPN_User_Guide.pdf', '5.2 MB', '원격 근무 시 사내 망 접속을 위한 OTP 2차 인증 및 Client 설치/설정 가이드.'
  );
  insertIntranetDoc.run(
    'INT-NET-005', '[Wi-Fi] 본사 업무용/게스트 무선 AP 설정 및 보안 지침', '사내 Wi-Fi/AP', '사내전용', 'v1.5', '최현우 과장', '2026-08-18', 'SSID: Einstec_Office_5G', 'Einstec_WiFi_AP_Manual.pdf', '1.9 MB', '본사 내 WPA3 Enterprise 인증 기반 무선 AP 채널 및 게스트 망 분리 설정서.'
  );
  insertIntranetDoc.run(
    'INT-NET-006', '[스위치] Core Switch (Cisco 9300) 백업 설정 및 CLI 구성 문서', '스위치/라우터 설정', '대외비', 'v2.2', '이강욱 팀장', '2026-08-20', '192.168.1.254 (Cisco 9300)', 'Cisco_CoreSwitch_Backup_2026.conf', '480 KB', 'Core Switch 24포트 L3 스위치 백업 설정 파일 및 CLI 명령어 가이드.'
  );
}

export default db;
