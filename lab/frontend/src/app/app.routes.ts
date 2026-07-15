import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

import { LandingComponent } from './components/landing.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { DashboardComponent } from './components/dashboard.component';
import { SubjectsComponent } from './components/subjects.component';
import { ChapterDetailComponent } from './components/chapter-detail.component';
import { SimulationChemistryComponent } from './components/simulation-chemistry.component';
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

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'subjects', component: SubjectsComponent, canActivate: [authGuard] },
  { path: 'subjects/:subjectId/chapters/:chapterId', component: ChapterDetailComponent, canActivate: [authGuard] },
  { path: 'simulate/chemistry', component: SimulationChemistryComponent, canActivate: [authGuard] },
  { path: 'simulate/physics', component: SimulationPhysicsComponent, canActivate: [authGuard] },
  { path: 'simulate/biology', component: SimulationBiologyComponent, canActivate: [authGuard] },
  { path: 'simulate/ict', component: SimulationIctComponent, canActivate: [authGuard] },
  { path: 'simulate/circuit', component: SimulationCircuitComponent, canActivate: [authGuard] },
  { path: 'simulate/lens', component: SimulationLensComponent, canActivate: [authGuard] },
  { path: 'simulate/titration', component: SimulationTitrationComponent, canActivate: [authGuard] },
  { path: 'simulate/photosynthesis', component: SimulationPhotosynthesisComponent, canActivate: [authGuard] },
  { path: 'simulate/html-editor', component: SimulationHtmlEditorComponent, canActivate: [authGuard] },
  { path: 'exam/take/:attemptId', component: McqExamComponent, canActivate: [authGuard] },
  { path: 'exam/result/:attemptId', component: ExamResultComponent, canActivate: [authGuard] },
  { path: 'exam/history', component: ExamHistoryComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard('content_admin', 'system_admin', 'teacher')] },
  { path: '**', redirectTo: '' },
];
