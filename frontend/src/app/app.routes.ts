import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { LandingComponent } from './components/landing.component';
import { DashboardComponent } from './components/dashboard.component';
import { StudentsComponent } from './components/students.component';
import { TeachersComponent } from './components/teachers.component';
import { AttendanceComponent } from './components/attendance.component';
import { ExamsComponent } from './components/exams.component';
import { PaymentsComponent } from './components/payments.component';
import { HomeworkComponent } from './components/homework.component';
import { TransportComponent } from './components/transport.component';
import { StudentPortalComponent } from './components/student-portal.component';
import { TeacherPortalComponent } from './components/teacher-portal.component';
import { AdminPanelComponent } from './components/admin-panel.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminPanelComponent },
  { path: 'dashboard', redirectTo: '/admin', pathMatch: 'full' },
  { path: 'students', component: StudentsComponent },
  { path: 'teachers', component: TeachersComponent },
  { path: 'attendance', component: AttendanceComponent },
  { path: 'exams', component: ExamsComponent },
  { path: 'payments', component: PaymentsComponent },
  { path: 'homework', component: HomeworkComponent },
  { path: 'transport', component: TransportComponent },
  { path: 'student-portal', component: StudentPortalComponent },
  { path: 'teacher-portal', component: TeacherPortalComponent },
  { path: '**', redirectTo: '/' }
];
