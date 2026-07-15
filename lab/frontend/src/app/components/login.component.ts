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
    <div class="auth-wrap">
      <form class="auth-card" #f="ngForm" (ngSubmit)="submit()">
        <h2>{{ i18n.t('login') }}</h2>
        <div class="form-group">
          <label>{{ i18n.t('username') }}</label>
          <input class="form-control" name="username" [(ngModel)]="username" required autocomplete="username">
        </div>
        <div class="form-group">
          <label>{{ i18n.t('password') }}</label>
          <input class="form-control" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password">
        </div>
        <p class="error" *ngIf="error">{{ error }}</p>
        <button class="primary-btn" type="submit" [disabled]="f.invalid || loading">{{ loading ? i18n.t('loading') : i18n.t('login') }}</button>
        <p class="switch-link">{{ i18n.isEn ? "Don't have an account?" : 'অ্যাকাউন্ট নেই?' }} <a routerLink="/register">{{ i18n.t('register') }}</a></p>
        <p class="demo-hint">Demo: student1 / teacher1 / guardian1 / contentadmin1 / sysadmin1 — password Test&#64;1234</p>
      </form>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; justify-content: center; padding: 48px 20px; }
    .auth-card { background: #fff; border: 1px solid #e2e8ec; border-radius: 14px; padding: 28px; width: 100%; max-width: 380px; }
    .auth-card h2 { margin: 0 0 18px; color: #1a6d5e; text-align: center; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 0.85rem; color: #55666f; margin-bottom: 4px; }
    .form-control { width: 100%; padding: 9px 12px; border: 1px solid #cfd9dd; border-radius: 8px; font-size: 0.9rem; }
    .primary-btn { width: 100%; background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none; padding: 11px; border-radius: 8px; font-weight: 700; margin-top: 6px; }
    .primary-btn:disabled { opacity: 0.5; }
    .error { color: #c0392b; font-size: 0.85rem; }
    .switch-link { text-align: center; font-size: 0.85rem; margin-top: 14px; color: #55666f; }
    .demo-hint { text-align: center; font-size: 0.72rem; color: #98a4ab; margin-top: 10px; }
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
