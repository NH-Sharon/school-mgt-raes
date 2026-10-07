import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-shell">
        <!-- branding panel -->
        <aside class="brand-panel">
          <div class="brand-mark">🧪</div>
          <h1>{{ i18n.t('appName') }}</h1>
          <p>{{ i18n.t('tagline') }}</p>
          <ul class="feature-list">
            <li>🔬 {{ i18n.isEn ? 'Guided & non-guided virtual labs' : 'গাইডেড ও নন-গাইডেড ভার্চুয়াল ল্যাব' }}</li>
            <li>📚 {{ i18n.isEn ? 'Chapter-wise MCQ & creative questions' : 'অধ্যায়ভিত্তিক এমসিকিউ ও সৃজনশীল প্রশ্ন' }}</li>
            <li>📖 {{ i18n.isEn ? 'Read your textbooks in the Book Corner' : 'বুক কর্নারে পাঠ্যবই পড়ুন' }}</li>
          </ul>
        </aside>

        <!-- form panel -->
        <form class="form-panel" #f="ngForm" (ngSubmit)="submit()">
          <h2>{{ i18n.t('login') }}</h2>
          <div class="form-group">
            <label class="ds-label">{{ i18n.t('username') }}</label>
            <input class="ds-input" name="username" [(ngModel)]="username" required autocomplete="username">
          </div>
          <div class="form-group">
            <label class="ds-label">{{ i18n.t('password') }}</label>
            <input class="ds-input" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password">
            <a class="forgot-link" routerLink="/forgot-password">{{ i18n.t('forgotPassword') }}</a>
          </div>
          <p class="ds-error" *ngIf="error">{{ error }}</p>
          <button class="ds-btn ds-btn-primary full" type="submit" [disabled]="f.invalid || loading">
            {{ loading ? i18n.t('loading') : i18n.t('login') }}
          </button>
          <p class="switch-link">{{ i18n.isEn ? "Don't have an account?" : 'অ্যাকাউন্ট নেই?' }} <a routerLink="/register">{{ i18n.t('register') }}</a></p>
          <p class="demo-hint">Demo: student1 / teacher1 / guardian1 / contentadmin1 / sysadmin1 — password Test&#64;1234</p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; align-items: flex-start; padding: 48px 20px; }
    .auth-shell {
      display: grid; grid-template-columns: 1fr 1fr; max-width: 880px; width: 100%;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); overflow: hidden;
    }
    .brand-panel {
      background: linear-gradient(150deg, var(--brand), var(--brand-dark));
      color: #fff; padding: 40px 32px; display: flex; flex-direction: column; gap: 14px;
    }
    .brand-mark { font-size: 2.6rem; }
    .brand-panel h1 { margin: 0; font-size: 1.5rem; }
    .brand-panel p { margin: 0; opacity: 0.9; font-size: 0.92rem; line-height: 1.5; }
    .feature-list { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-direction: column; gap: 12px; }
    .feature-list li { font-size: 0.9rem; opacity: 0.96; }
    .form-panel { padding: 40px 34px; display: flex; flex-direction: column; }
    .form-panel h2 { margin: 0 0 22px; color: var(--brand); }
    .form-group { margin-bottom: 16px; }
    .forgot-link { display: block; text-align: right; font-size: 0.78rem; margin-top: 6px; }
    .full { width: 100%; margin-top: 6px; padding: 12px; }
    .switch-link { text-align: center; font-size: 0.85rem; margin-top: 16px; color: var(--text-muted); }
    .demo-hint { text-align: center; font-size: 0.72rem; color: var(--text-faint); margin-top: 10px; }
    @media (max-width: 720px) { .auth-shell { grid-template-columns: 1fr; } .brand-panel { display: none; } }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  username = '';
  password = '';
  error = '';
  loading = false;

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/subjects'); },
      error: (err) => { this.loading = false; this.error = err?.error?.message || (this.i18n.isEn ? 'Login failed' : 'লগইন ব্যর্থ হয়েছে'); },
    });
  }
}
