import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/" [attr.href]="null" (click)="go('/')">
        <span class="flask-icon">🧪</span>
        <div>
          <h1>{{ i18n.t('appName') }}</h1>
          <p>{{ i18n.t('tagline') }}</p>
        </div>
      </a>
      <nav class="nav-links" *ngIf="auth.currentUser() as user">
        <button class="nav-btn" [class.active]="isActive('/subjects')" (click)="go('/subjects')">{{ i18n.t('study') }}</button>
        <button class="nav-btn" [class.active]="isActive('/labs')" (click)="go('/labs')">{{ i18n.t('labs') }}</button>
        <button class="nav-btn" [class.active]="isActive('/exam')" (click)="go('/exam/history')">{{ i18n.t('exam') }}</button>
        <button class="nav-btn" [class.active]="isActive('/dashboard')" (click)="go('/dashboard')">{{ i18n.t('dashboard') }}</button>
        <button class="nav-btn" *ngIf="isAdminRole(user.role)" [class.active]="isActive('/admin')" (click)="go('/admin')">{{ i18n.t('admin') }}</button>
      </nav>
      <div class="right-actions">
        <button class="lang-btn" (click)="i18n.toggle()">{{ i18n.isEn ? 'বাং' : 'EN' }}</button>
        <ng-container *ngIf="auth.currentUser() as user; else loggedOut">
          <span class="user-chip">{{ user.fullName }}</span>
          <button class="ghost-btn" (click)="logout()">{{ i18n.t('logout') }}</button>
        </ng-container>
        <ng-template #loggedOut>
          <button class="ghost-btn" (click)="go('/login')">{{ i18n.t('login') }}</button>
        </ng-template>
      </div>
    </header>

    <main class="app-body">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host { display: block; font-family: 'Noto Sans Bengali', 'Noto Sans', system-ui, sans-serif; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; background: var(--surface); border-bottom: 1px solid var(--border);
      flex-wrap: wrap; gap: 10px; position: sticky; top: 0; z-index: 50;
    }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; cursor: pointer; }
    .flask-icon { font-size: 1.8rem; }
    .brand h1 { font-size: 1.1rem; margin: 0; color: var(--brand); }
    .brand p { font-size: 0.72rem; margin: 2px 0 0; color: var(--text-muted); }
    .nav-links { display: flex; gap: 6px; flex-wrap: wrap; }
    .nav-btn {
      background: transparent; border: none; color: #33454f; font-weight: 600;
      padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.88rem;
    }
    .nav-btn:hover { background: var(--brand-soft); color: var(--brand); }
    .nav-btn.active { background: var(--brand-soft); color: var(--brand); }
    .right-actions { display: flex; align-items: center; gap: 8px; }
    .user-chip { font-size: 0.85rem; color: #33454f; padding: 6px 10px; background: var(--surface-2); border-radius: 999px; }
    .lang-btn {
      background: var(--brand); color: #fff; border: none; border-radius: 999px;
      width: 40px; height: 32px; font-weight: 700; font-size: 0.78rem;
    }
    .ghost-btn {
      background: transparent; border: 1px solid var(--border-strong); color: #33454f;
      padding: 7px 14px; border-radius: var(--radius-sm); font-size: 0.85rem;
    }
    .ghost-btn:hover { border-color: var(--brand); color: var(--brand); }
    .app-body { min-height: calc(100vh - 64px); background: var(--bg); }
  `],
})
export class AppComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);

  go(path: string) { this.router.navigateByUrl(path); }
  logout() { this.auth.logout(); this.router.navigateByUrl('/'); }
  isAdminRole(role: string) { return role === 'content_admin' || role === 'system_admin' || role === 'teacher'; }
  isContentAdmin(role: string) { return role === 'content_admin' || role === 'system_admin'; }
  isActive(prefix: string) { return this.router.url.startsWith(prefix); }
}
