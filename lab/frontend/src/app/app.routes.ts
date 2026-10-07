import { Routes } from '@angular/router';
import { authGuard, roleGuard, labLaunchGuard } from './guards/auth.guard';

import { LandingComponent } from './components/landing.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { ForgotPasswordComponent } from './components/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password.component';
import { DashboardComponent } from './components/dashboard.component';
import { SubjectsComponent } from './components/subjects.component';
import { ChapterDetailComponent } from './components/chapter-detail.component';
import { SimulationPhysicsComponent } from './components/simulation-physics.component';
import { SimulationBiologyComponent } from './components/simulation-biology.component';
import { SimulationIctComponent } from './components/simulation-ict.component';
import { SimulationCircuitComponent } from './components/simulation-circuit.component';
import { SimulationLensComponent } from './components/simulation-lens.component';
import { SimulationTitrationComponent } from './components/simulation-titration.component';
import { SimulationPhotosynthesisComponent } from './components/simulation-photosynthesis.component';
import { SimulationHtmlEditorComponent } from './components/simulation-html-editor.component';
import { McqExamComponent } from './components/mcq-exam.component';
import { ExamResultComponent } from './components/exam-result.component';
import { ExamHistoryComponent } from './components/exam-history.component';
import { AdminComponent } from './components/admin.component';
import { LabsComponent } from './components/labs.component';
import { LabLaunchComponent } from './components/lab-launch.component';
import { PracticeSetupComponent } from './components/practice-setup.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'subjects', component: SubjectsComponent, canActivate: [authGuard] },
  { path: 'practice', component: PracticeSetupComponent, canActivate: [authGuard] },
  { path: 'subjects/:subjectId/chapters/:chapterId', component: ChapterDetailComponent, canActivate: [authGuard] },
  { path: 'labs', component: LabsComponent, canActivate: [authGuard] },
  { path: 'lab-launch/:key', component: LabLaunchComponent, canActivate: [authGuard] },
  { path: 'simulate/chemistry', loadComponent: () => import('./components/chem-bench.component').then(m => m.ChemBenchComponent), canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/physics', component: SimulationPhysicsComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/biology', component: SimulationBiologyComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/ict', component: SimulationIctComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/circuit', component: SimulationCircuitComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/lens', component: SimulationLensComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/titration', component: SimulationTitrationComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/photosynthesis', component: SimulationPhotosynthesisComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'simulate/html-editor', component: SimulationHtmlEditorComponent, canActivate: [authGuard, labLaunchGuard] },
  { path: 'exam/take/:attemptId', component: McqExamComponent, canActivate: [authGuard] },
  { path: 'exam/result/:attemptId', component: ExamResultComponent, canActivate: [authGuard] },
  { path: 'exam/history', component: ExamHistoryComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard('content_admin', 'system_admin', 'teacher')] },
  { path: '**', redirectTo: '' },
];
