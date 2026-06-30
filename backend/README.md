# School Management System Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Start server:
```bash
npm start
```

## API Endpoints

- **Base URL**: http://localhost:3000/api

### Authentication
- POST `/auth/login` - Login
- POST `/auth/register` - Register

### Students
- GET `/students` - Get all students
- POST `/students` - Add student
- PUT `/students/:id` - Update student
- DELETE `/students/:id` - Delete student

### Other endpoints available for attendance, exams, payments, homework, transport
