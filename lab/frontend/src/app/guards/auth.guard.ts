import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LabSessionService } from '../services/lab-session.service';
import { SEGMENT_TO_KEY } from '../lab-routes';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (user && roles.includes(user.role)) return true;
  router.navigate(['/']);
  return false;
};

// FR-8 — a lab simulation screen is unreachable unless the student came through
// the lab-launch flow (mode selection + completed safety checklist).
export const labLaunchGuard: CanActivateFn = (_route, state: RouterStateSnapshot) => {
  const labSession = inject(LabSessionService);
  const router = inject(Router);
  const segment = state.url.split('?')[0].split('/').pop() || '';
  const key = SEGMENT_TO_KEY[segment];
  if (!key) return true; // unknown sim — don't block
  if (labSession.has(key)) return true;
  router.navigate(['/lab-launch', key]);
  return false;
};
