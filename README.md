# School Management System

একটি সম্পূর্ণ স্কুল ম্যানেজমেন্ট সিস্টেম যা Angular, Node.js এবং PostgreSQL দিয়ে তৈরি।

## Project Structure

```
school-management-system/
├── frontend/          # Angular 18 Frontend
├── backend/           # Node.js + Express Backend
├── database-setup/    # PostgreSQL Database Setup
└── docker-compose.yml # Docker configuration
```

## Quick Start

### Option 1: Docker (Recommended)
```bash
docker-compose up -d
```
Access: http://localhost

### Option 2: Manual Setup

1. **Database Setup**:
```bash
cd database-setup
./setup.sh
```

2. **Backend Setup**:
```bash
cd backend
npm install
npm start
```

3. **Frontend Setup**:
```bash
cd frontend
npm install
ng serve
```

## Default Login
- Username: admin
- Password: password

## Upgrading an existing database
Fresh installs (`setup.sh` / `docker-compose up`) get everything automatically since `database-setup/database/schema.sql` already includes it. If you have an **already-running** database from before 2026-08-21, apply the new tables (parent-portal links, password resets, fee structures, teacher assignments, seat plans, audit log, uploads) once:
```bash
psql -U postgres -d school_management -f database-setup/database/migrate-features.sql
```

## Running backend tests
```bash
cd backend
npm test
```
Covers login and the student/parent data-isolation rules in `middleware/auth.js` (17 tests) — see `FEATURE_ROADMAP.md` #11.

## Features (implemented)

✅ ভর্তি (Admissions) ও অ্যাটেনডেন্স ম্যানেজমেন্ট
✅ এক্সাম, রেজাল্ট ও রিপোর্ট কার্ড (PDF)
✅ সিট প্ল্যান (অটো-জেনারেটেড)
✅ পেমেন্ট, ফি কাঠামো ও মাসিক বকেয়া জেনারেশন
✅ হোমওয়ার্ক ও অ্যাসাইনমেন্ট
✅ ট্রান্সপোর্ট ম্যানেজমেন্ট
✅ কর্মচারী (Employees) ও কর্মচারী-অ্যাটেনডেন্স
✅ অভিভাবক (Parent) পোর্টাল
✅ Self-service পাসওয়ার্ড রিসেট
✅ ফাইল আপলোড (student photo)
✅ Bulk student import (CSV)
✅ Audit log
✅ শিক্ষক-বিষয়-শ্রেণী বণ্টন

## Planned / Not yet implemented

⏳ SMS/ইমেইল নোটিফিকেশন (needs a provider account)
⏳ OMR সার্ভিস
⏳ মোবাইল অ্যাপ
⏳ কমিউনিটি ফিচার
⏳ Multi-school/multi-tenant support

See `FEATURE_ROADMAP.md` for detail and `BUG_REPORT.md` for the fixed-bugs history.

## Technology Stack

- **Frontend**: Angular 18
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
