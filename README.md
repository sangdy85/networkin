# 🏢 아인스텍(Einstec) / Networkin 통합 사내 포털 & ERP 시스템

대한민국 IT 인프라, 네트워크, IPT 커뮤니케이션 전문 기업 **(주)아인스텍 / Networkin**의 통합 ERP 및 업무 포털 웹 솔루션입니다.

---

## 🌟 주요 기능 (Key Features)

1. **📊 대시보드 (`/`)**:
   - 실시간 시스템 가동 현황, 주간 작업 요약, 공정률 차트 및 사내 공지사항 표출.
2. **✉️ 사내 & 외부 통합 웹메일 (`/mail`)**:
   - 기업용 풀옵션 Rich Text 작성 에디터, 서명 관리 팝업, 외부 메일 계정 연동(Naver, Gmail, Daum, POP3/SMTP) 및 수발신 지원.
3. **📅 전사 통합 일정 관리 (`/schedule`)**:
   - IPT, 네트워크, 시공현장, 회의/컨설팅 모듈의 일정을 **SQLite DB 실시간 SQL 집계(Aggregate Query)** 방식으로 읽기 전용 표출.
   - **`◀` / `▶` 월별 넘김 캘린더** 및 **대한민국 관공서 공휴일 & 대체공휴일(추석, 광복절, 삼일절 등) 빨간색 뱃지 표출**.
4. **📞 IPT 작업 & 장애관리 (`/ipt`)**:
   - IP-PBX, IP폰, 정기점검, 유지보수, 장애처리, 구축 작업 등록 및 `[☑️ 주말/공휴일 포함]` 필터링 체크박스 기능.
5. **🌐 네트워크 작업 & 장애관리 (`/network`)**:
   - 유/무선 네트워크, 백본 스위치, 광배선 작업 등록 및 일정 자동 연동.
6. **🏗️ 시공현장 관리 (`/projects`)**:
   - 공사기간(착공일~준공일) 및 공정률(%) 실시간 관리, 주말/공휴일 포함 옵션 캘린더 연동.
7. **💬 회의/컨설팅 (`/meeting`)**:
   - 고객사 미팅, 기술 제안, 견적 사전 컨설팅 일정 기록.
8. **📦 자재 & 장비 관리 (`/inventory`)**:
   - 네트워크 스위치, 광케이블, UTP 자재 재고 수량 관리.
9. **📁 문서 관리 센터 (`/documents`)**:
   - **`📘 기술문서 (네트워크)`** 및 **`📞 기술문서 (IPT)`** 카테고리 세분화, DWG 도면, 보고서 파일 관리.
10. **📋 사내 게시판 (`/board`)**:
    - 공지사항, 시공 갤러리, 자유게시판.
11. **🔐 계정 & 권한 관리 (`/admin`)**:
    - 마스터 권한 및 부서별 사용자 계정 관리.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: Next.js 16.3 (App Router, Turbopack)
- **Frontend**: React 19, Vanilla CSS (Custom Production Glassmorphism UI)
- **Backend / API**: Next.js Server API Routes (`src/app/api/...`)
- **Database**: SQLite RDBMS (`better-sqlite3`, WAL Mode Enabled)
- **Storage Location**: `data/einstec_portal.db`

---

## 🚀 생산 서버 배포 가이드 (Production Deployment)

### 1. 의존성 설치 (Install Dependencies)
```bash
npm install
```

### 2. 프로덕션 빌드 (Build Production Bundle)
```bash
npm run build
```

### 3. 실서버 구동 (Start Production Server)
```bash
npm run start
```
* 기본 포트는 `3000`번으로 구동되며, PM2 또는 Docker를 통해 Daemon 서비스로 등록 가능합니다.

---

## 🗄️ 백엔드 REST API 엔드포인트

- `GET /api/ipt`, `POST /api/ipt`, `PUT /api/ipt`, `DELETE /api/ipt`
- `GET /api/network`, `POST /api/network`, `PUT /api/network`, `DELETE /api/network`
- `GET /api/projects`, `POST /api/projects`, `PUT /api/projects`, `DELETE /api/projects`
- `GET /api/documents`, `POST /api/documents`, `DELETE /api/documents`
- `GET /api/meeting`, `POST /api/meeting`, `DELETE /api/meeting`
- `GET /api/schedule` (전사 DB 통합 실시간 집계 API)
