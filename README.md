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

## Features

✅ ভর্তি ও অ্যাটেনডেন্স ম্যানেজমেন্ট
✅ এক্সাম, সিট প্ল্যান, রেজাল্ট ও রিপোর্ট
✅ OMR সার্ভিস
✅ পেমেন্ট ও ফি ম্যানেজমেন্ট
✅ হোমওয়ার্ক ও অ্যাসাইনমেন্ট
✅ মোবাইল অ্যাপ
✅ কমিউনিটি ও ট্রান্সপোর্ট ম্যানেজমেন্ট
✅ ডেডিকেটেড সাপোর্ট

## Technology Stack

- **Frontend**: Angular 18
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
