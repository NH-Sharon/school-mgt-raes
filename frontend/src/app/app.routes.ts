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
import { ParentPortalComponent } from './components/parent-portal.component';
import { AdminPanelComponent } from './components/admin-panel.component';
import { ForgotPasswordComponent } from './components/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'admin', component: AdminPanelComponent, canActivate: [authGuard] },
  { path: 'dashboard', redirectTo: '/admin', pathMatch: 'full' },
  { path: 'students', component: StudentsComponent, canActivate: [authGuard] },
  { path: 'teachers', component: TeachersComponent, canActivate: [authGuard] },
  { path: 'attendance', component: AttendanceComponent, canActivate: [authGuard] },
  { path: 'exams', component: ExamsComponent, canActivate: [authGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [authGuard] },
  { path: 'homework', component: HomeworkComponent, canActivate: [authGuard] },
  { path: 'transport', component: TransportComponent, canActivate: [authGuard] },
  { path: 'student-portal', component: StudentPortalComponent, canActivate: [authGuard] },
  { path: 'teacher-portal', component: TeacherPortalComponent, canActivate: [authGuard] },
  { path: 'parent-portal', component: ParentPortalComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/' }
];
