import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-page">
  <!-- background pattern -->
  <div class="bg-pattern"></div>

  <!-- top bar -->
  <div class="login-topbar">
    <button class="back-link" (click)="goBack()">{{ i18n.t('backToSite') }}</button>
    <button class="lang-toggle" (click)="i18n.toggle()">
      <span class="lang-dot"></span>
      {{ i18n.isEn ? 'বাংলায় দেখুন' : 'View in English' }}
    </button>
  </div>

  <div class="login-wrap">
    <div class="login-card">
      <!-- brand -->
      <div class="login-brand">
        <div class="brand-icon">🏫</div>
        <div class="brand-name">{{ i18n.isEn ? 'Rowshon Amir' : 'রওশন আমির' }}</div>
        <div class="brand-sub">{{ i18n.isEn ? 'Elementary School' : 'প্রাথমিক বিদ্যালয়' }}</div>
      </div>

      <div class="login-divider">
        <span class="divider-line"></span>
        <span class="divider-text">{{ i18n.t('loginSubtitle') }}</span>
        <span class="divider-line"></span>
      </div>

      <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
        <div class="form-group">
          <label for="username">{{ i18n.t('username') }}</label>
          <input
            type="text"
            id="username"
            name="username"
            class="form-control"
            [(ngModel)]="credentials.username"
            required
            autocomplete="username"
            [placeholder]="i18n.isEn ? 'Enter username' : 'ইউজারনেম লিখুন'">
        </div>

        <div class="form-group">
          <label for="password">{{ i18n.t('password') }}</label>
          <input
            type="password"
            id="password"
            name="password"
            class="form-control"
            [(ngModel)]="credentials.password"
            required
            autocomplete="current-password"
            [placeholder]="i18n.isEn ? 'Enter password' : 'পাসওয়ার্ড লিখুন'">
        </div>

        <div *ngIf="error" class="alert-error">{{ i18n.t('wrongCreds') }}</div>

        <button
          type="submit"
          class="login-btn"
          [disabled]="!loginForm.form.valid || loading">
          <span *ngIf="!loading">{{ i18n.t('signIn') }}</span>
          <span *ngIf="loading" class="spinner">◌ {{ i18n.t('signingIn') }}</span>
        </button>
      </form>

      <!-- demo hint -->
      <div class="demo-hint">
        <div class="demo-title">{{ i18n.isEn ? 'Demo accounts' : 'ডেমো অ্যাকাউন্ট' }}</div>
        <div class="demo-rows">
          <div class="demo-row" (click)="fillDemo('admin')">
            <span class="demo-role">👑 Admin</span>
            <span class="demo-cred">admin / password</span>
          </div>
          <div class="demo-row" (click)="fillDemo('teacher')">
            <span class="demo-role">👨‍🏫 Teacher</span>
            <span class="demo-cred">teacher1 / password</span>
          </div>
          <div class="demo-row" (click)="fillDemo('student')">
            <span class="demo-role">👨‍🎓 Student</span>
            <span class="demo-cred">student1 / password</span>
          </div>
        </div>
      </div>
    </div>

    <!-- portal info column -->
    <div class="login-info">
      <div class="info-section-title">{{ i18n.t('portalTitle') }}</div>
      <div class="portal-infos">
        <div class="portal-info-card">
          <div class="pi-icon">🏛️</div>
          <div>
            <div class="pi-title">{{ i18n.t('adminPortal') }}</div>
            <div class="pi-desc">{{ i18n.t('adminPortalDesc') }}</div>
          </div>
        </div>
        <div class="portal-info-card featured">
          <div class="pi-icon">👨‍🏫</div>
          <div>
            <div class="pi-title">{{ i18n.t('teacherPortal') }}</div>
            <div class="pi-desc">{{ i18n.t('teacherPortalDesc') }}</div>
          </div>
        </div>
        <div class="portal-info-card">
          <div class="pi-icon">👨‍🎓</div>
          <div>
            <div class="pi-title">{{ i18n.t('studentPortal') }}</div>
            <div class="pi-desc">{{ i18n.t('studentPortalDesc') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host {
      --surface-dark: #1A4731;
      --accent: #D4911A;
      --ground: #F7F5EC;
      --text: #1C2A1D;
      --muted: #6B7A5E;
      display: block;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .login-page {
      min-height: 100vh;
      background: var(--surface-dark);
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .bg-pattern {
      position: absolute;
      inset: 0;
      background-image:
        repeating-linear-gradient(45deg,  rgba(212,145,26,0.06) 0, rgba(212,145,26,0.06) 1px, transparent 0, transparent 50%),
        repeating-linear-gradient(135deg, rgba(212,145,26,0.06) 0, rgba(212,145,26,0.06) 1px, transparent 0, transparent 50%);
      background-size: 40px 40px;
      pointer-events: none;
    }

    /* TOP BAR */
    .login-topbar {
      position: relative;
      z-index: 10;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .back-link {
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      font-size: 0.85rem;
      cursor: pointer;
      transition: color 0.2s;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .back-link:hover { color: rgba(255,255,255,0.9); }
    .lang-toggle {
      background: none;
      border: 1px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.75);
      padding: 0.3rem 0.85rem;
      border-radius: 2rem;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .lang-toggle:hover { background: rgba(255,255,255,0.1); }
    .lang-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }

    /* LAYOUT */
    .login-wrap {
      position: relative;
      z-index: 10;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3rem;
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
    }

    /* CARD */
    .login-card {
      background: var(--ground);
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      flex-shrink: 0;
    }
    .login-brand { text-align: center; margin-bottom: 1.5rem; }
    .brand-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
    .brand-name { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 700; color: var(--surface-dark); }
    .brand-sub { font-size: 0.75rem; color: var(--muted); margin-top: 0.15rem; letter-spacing: 0.04em; font-family: 'DM Sans', sans-serif; }

    .login-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.25rem 0;
    }
    .divider-line { flex: 1; height: 1px; background: rgba(28,42,29,0.12); }
    .divider-text { font-size: 0.78rem; color: var(--muted); white-space: nowrap; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.35rem; font-size: 0.82rem; font-weight: 600; color: var(--text); }
    .form-control {
      width: 100%;
      padding: 0.65rem 0.9rem;
      border: 1.5px solid rgba(28,42,29,0.15);
      border-radius: 7px;
      font-size: 0.9rem;
      background: #fff;
      color: var(--text);
      transition: border-color 0.2s;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
      box-sizing: border-box;
    }
    .form-control:focus { outline: none; border-color: var(--surface-dark); box-shadow: 0 0 0 3px rgba(26,71,49,0.1); }

    .alert-error { background: #FEE2E2; border: 1px solid #FCA5A5; color: #991B1B; padding: 0.65rem 0.9rem; border-radius: 7px; font-size: 0.82rem; margin-bottom: 1rem; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }

    .login-btn {
      width: 100%;
      padding: 0.75rem;
      background: var(--surface-dark);
      color: #fff;
      border: none;
      border-radius: 7px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
      margin-top: 0.25rem;
    }
    .login-btn:hover:not(:disabled) { background: #0f3020; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(26,71,49,0.3); }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { from { opacity: 0.5; } to { opacity: 1; } }

    /* DEMO */
    .demo-hint { margin-top: 1.25rem; }
    .demo-title { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; font-family: 'DM Sans', sans-serif; }
    .demo-rows { display: flex; flex-direction: column; gap: 0.35rem; }
    .demo-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.45rem 0.7rem;
      background: rgba(28,42,29,0.05);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
      border: 1px dashed rgba(28,42,29,0.12);
    }
    .demo-row:hover { background: rgba(28,42,29,0.1); }
    .demo-role { font-size: 0.8rem; color: var(--text); font-weight: 500; }
    .demo-cred { font-size: 0.75rem; color: var(--muted); font-family: 'DM Sans', monospace; }

    /* INFO COLUMN */
    .login-info { flex: 1; max-width: 400px; }
    .info-section-title {
      font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 1.5rem;
      line-height: 1.3;
    }
    .portal-infos { display: flex; flex-direction: column; gap: 0.85rem; }
    .portal-info-card {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      padding: 1.1rem 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      cursor: default;
    }
    .portal-info-card.featured {
      background: rgba(212,145,26,0.12);
      border-color: rgba(212,145,26,0.35);
    }
    .pi-icon { font-size: 1.5rem; flex-shrink: 0; }
    .pi-title { font-family: 'Noto Serif Bengali', serif; font-weight: 700; color: #fff; font-size: 0.95rem; margin-bottom: 0.3rem; }
    .pi-desc { font-size: 0.8rem; color: rgba(255,255,255,0.6); line-height: 1.5; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }

    @media (max-width: 700px) {
      .login-wrap { flex-direction: column; gap: 2rem; padding: 1rem; }
      .login-info { max-width: 100%; width: 100%; }
      .login-card { max-width: 100%; }
    }
  `]
})
export class LoginComponent {
  i18n = inject(I18nService);
  authService = inject(AuthService);
  router = inject(Router);

  credentials = { username: '', password: '' };
  error = '';
  loading = false;

  goBack() { this.router.navigate(['/']); }

  fillDemo(role: string) {
    if (role === 'admin') { this.credentials = { username: 'admin', password: 'password' }; }
    else if (role === 'teacher') { this.credentials = { username: 'teacher1', password: 'password' }; }
    else { this.credentials = { username: 'student1', password: 'password' }; }
  }

  onSubmit() {
    if (!this.credentials.username || !this.credentials.password) return;
    this.loading = true;
    this.error = '';
    this.authService.login(this.credentials.username, this.credentials.password).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        const role = user?.role;
        if (role === 'teacher') { this.router.navigate(['/teacher-portal']); }
        else if (role === 'student') { this.router.navigate(['/student-portal']); }
        else { this.router.navigate(['/admin']); }
      },
      error: () => {
        this.error = 'error';
        this.loading = false;
      }
    });
  }
}
