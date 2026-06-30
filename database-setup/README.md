# Database Setup

## PostgreSQL Database for School Management System

### Setup Instructions

1. **Install PostgreSQL** (if not already installed):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

2. **Create Database**:
```bash
sudo -u postgres createdb school_management
```

3. **Import Schema**:
```bash
sudo -u postgres psql -d school_management -f database/schema.sql
```

4. **Verify Setup**:
```bash
sudo -u postgres psql -d school_management -c "\dt"
```

### Database Configuration

- **Database Name**: school_management
- **Default User**: postgres
- **Port**: 5432

### Tables Created

- users (authentication)
- students (student information)
- teachers (teacher information)
- classes (class information)
- attendance (attendance records)
- exams (exam information)
- exam_results (exam results)
- payments (payment records)
- homework (homework assignments)
- homework_submissions (homework submissions)
- transport (transport routes)
- student_transport (student transport assignments)

### Sample Data

The schema includes sample users and classes to get started.
