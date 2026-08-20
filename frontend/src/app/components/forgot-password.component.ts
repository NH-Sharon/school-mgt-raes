import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-page">
  <div class="bg-pattern"></div>
  <div class="login-topbar">
    <button class="back-link" (click)="router.navigate(['/login'])">{{ i18n.isEn ? '← Back to login' : '← লগইনে ফিরুন' }}</button>
    <button class="lang-toggle" (click)="i18n.toggle()"><span class="lang-dot"></span>{{ i18n.isEn ? 'বাংলায় দেখুন' : 'View in English' }}</button>
  </div>
  <div class="login-wrap" style="justify-content:center">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-icon">🔑</div>
        <div class="brand-name">{{ i18n.isEn ? 'Forgot Password' : 'পাসওয়ার্ড ভুলে গেছেন' }}</div>
        <div class="brand-sub">{{ i18n.isEn ? 'Enter your username to get a reset link' : 'রিসেট লিংক পেতে ইউজারনেম দিন' }}</div>
      </div>

      <ng-container *ngIf="!submitted">
        <form (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="form-group">
            <label>{{ i18n.t('username') }}</label>
            <input type="text" class="form-control" [(ngModel)]="username" name="username" required autocomplete="username">
          </div>
          <button type="submit" class="login-btn" [disabled]="!f.form.valid || loading">
            {{ loading ? (i18n.isEn ? 'Sending…' : 'পাঠানো হচ্ছে…') : (i18n.isEn ? 'Send Reset Link' : 'রিসেট লিংক পাঠান') }}
          </button>
        </form>
      </ng-container>

      <div *ngIf="submitted" class="result-box">
        <p>{{ i18n.isEn ? 'If that account exists, a reset token has been issued.' : 'অ্যাকাউন্টটি থাকলে একটি রিসেট টোকেন ইস্যু করা হয়েছে।' }}</p>
        <p class="dev-note" *ngIf="devToken">
          {{ i18n.isEn ? 'No SMS/email is wired up yet — dev token:' : 'এখনো SMS/ইমেইল যুক্ত করা হয়নি — dev টোকেন:' }}
          <code>{{ devToken }}</code>
        </p>
        <button class="login-btn" (click)="goReset()">{{ i18n.isEn ? 'Continue to Reset' : 'রিসেট করতে যান' }}</button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { --surface-dark: #1A4731; --accent: #D4911A; --ground: #F7F5EC; --text: #1C2A1D; --muted: #6B7A5E; display: block; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .login-page { min-height: 100vh; background: var(--surface-dark); display: flex; flex-direction: column; position: relative; overflow: hidden; }
    .bg-pattern { position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, rgba(212,145,26,0.06) 0, rgba(212,145,26,0.06) 1px, transparent 0, transparent 50%), repeating-linear-gradient(135deg, rgba(212,145,26,0.06) 0, rgba(212,145,26,0.06) 1px, transparent 0, transparent 50%); background-size: 40px 40px; pointer-events: none; }
    .login-topbar { position: relative; z-index: 10; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .back-link { background: none; border: none; color: rgba(255,255,255,0.6); font-size: 0.85rem; cursor: pointer; }
    .back-link:hover { color: rgba(255,255,255,0.9); }
    .lang-toggle { background: none; border: 1px solid rgba(255,255,255,0.25); color: rgba(255,255,255,0.75); padding: 0.3rem 0.85rem; border-radius: 2rem; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
    .lang-dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
    .login-wrap { position: relative; z-index: 10; flex: 1; display: flex; align-items: center; padding: 2rem; max-width: 1000px; margin: 0 auto; width: 100%; }
    .login-card { background: var(--ground); border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 400px; }
    .login-brand { text-align: center; margin-bottom: 1.5rem; }
    .brand-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
    .brand-name { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 700; color: var(--surface-dark); }
    .brand-sub { font-size: 0.8rem; color: var(--muted); margin-top: 0.3rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.35rem; font-size: 0.82rem; font-weight: 600; color: var(--text); }
    .form-control { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid rgba(28,42,29,0.15); border-radius: 7px; font-size: 0.9rem; background: #fff; color: var(--text); box-sizing: border-box; }
    .form-control:focus { outline: none; border-color: var(--surface-dark); box-shadow: 0 0 0 3px rgba(26,71,49,0.1); }
    .login-btn { width: 100%; padding: 0.75rem; background: var(--surface-dark); color: #fff; border: none; border-radius: 7px; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
    .login-btn:hover:not(:disabled) { background: #0f3020; }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .result-box p { font-size: 0.88rem; color: var(--text); line-height: 1.6; }
    .dev-note { background: #FEF3C7; border: 1px dashed #D4911A; padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.78rem !important; }
    .dev-note code { display: block; margin-top: 0.3rem; word-break: break-all; font-family: monospace; }
  `]
})
export class ForgotPasswordComponent {
  i18n = inject(I18nService);
  authService = inject(AuthService);
  router = inject(Router);

  username = '';
  loading = false;
  submitted = false;
  devToken = '';

  onSubmit() {
    if (!this.username) return;
    this.loading = true;
    this.authService.forgotPassword(this.username).subscribe({
      next: (res) => { this.loading = false; this.submitted = true; this.devToken = res.devToken || ''; },
      error: () => { this.loading = false; this.submitted = true; }
    });
  }

  goReset() {
    this.router.navigate(['/reset-password'], { queryParams: this.devToken ? { token: this.devToken } : {} });
  }
}
