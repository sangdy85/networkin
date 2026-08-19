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

// Seed initial data if tables are empty
const seedCount = db.prepare('SELECT COUNT(*) as count FROM ipt_items').get().count;
if (seedCount === 0) {
  // IPT Seed
  db.prepare(`
    INSERT INTO ipt_items (id, work_type, custom_work_type, title, start_date, start_time, end_date, end_time, include_weekends, site, workers, content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('IPT-2026-001', '장애처리', '', '(주)대성물류 IPT 교환기 연동 감쇄 및 포트 전면 수리', '2026-08-19', '09:00', '2026-08-19', '18:00', 1, '대성물류 천안센터 3층', JSON.stringify(['최현우 과장', '김철수 과장']), 'IP-PBX 교환기 포트 감쇄 원인 파악 후 카드 교체.', '완료');

  // Network Seed
  db.prepare(`
    INSERT INTO network_items (id, work_type, custom_work_type, title, start_date, start_time, end_date, end_time, include_weekends, site, workers, content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('NET-2026-001', '작업', '', '천안 1공장 2구역 UTP 배선 120라인 포설 및 기계실 랙 정돈', '2026-08-19', '09:00', '2026-08-19', '18:00', 1, '천안 1공장 현장', JSON.stringify(['김철수 과장', '박민우 대리']), '생산라인 2구역 천장 트레이 배선 포설 및 Cisco 2960 PoE 스위치 패치패널 케이블링 완료.', '진행중');

  // Projects Seed
  db.prepare(`
    INSERT INTO projects (name, client, type, category, pm, workers, period, start_date, end_date, include_weekends, progress, status, budget, badge_class, memo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('천안 A공장 생산라인 2구역 UTP/광배선 구축', '(주)천안정밀', '인프라구축', '공장자동화', '김철수 과장', JSON.stringify(['김철수 과장', '박민우 대리']), '2026.08.01 ~ 2026.08.28', '2026-08-01', '2026-08-28', 1, 85, '시공중', '4,500만원', 'badge-active', '천안 1공장 2구역 UTP 120라인 포설 및 광케이블 접속 완료.');

  // Documents Seed
  db.prepare(`
    INSERT INTO documents (code, title, category, author, version, date, file_size, file_name, downloads, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('DOC-2026-TECH-NET-01', 'Cisco Catalyst 백본 스위치 VSS 이중화 및 STP 기술 매뉴얼 (PDF)', '기술문서 (네트워크)', '이강욱 팀장', 'v3.2', '2026-08-14', '8.7 MB', 'Cisco_스위치_VSS이중화_기술매뉴얼.pdf', 65, '백본 스위치 이중화 가상화 VSS 구성 및 포트채널 링크 트래픽 장애 절체 기술 표준 가이드');

  db.prepare(`
    INSERT INTO documents (code, title, category, author, version, date, file_size, file_name, downloads, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('DOC-2026-TECH-IPT-02', 'Cisco IP-PBX 연동 SIP 게이트웨이 및 IP폰 내선 세팅 가이드 (PDF)', '기술문서 (IPT)', '최현우 과장', 'v2.0', '2026-08-16', '6.4 MB', 'IPT_SIP게이트웨이_세팅가이드.pdf', 51, 'CUCM 교환기 단말 SIP 트렁크 연동, G.711 코덱 세팅 및 CP-7821 IP폰 내선 번호 설정 매뉴얼');

  // Signatures Seed
  db.prepare(`
    INSERT INTO mail_signatures (name, is_default, text)
    VALUES (?, ?, ?)
  `).run('기본 사내 서명', 1, `--------------------------------------------------
이 강 욱 / lku@networkin.co.kr
BI 사업부   과장
Tel. 02) 6207 - 8004  Fax. 02) 6207 - 1010
Mobile. 010 - 2062 - 7701
서울특별시 송파구 오금로 36길 28-1 (가락동, 2층)`);
}

export default db;
