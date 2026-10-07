import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <form class="card ds-card" #f="ngForm" (ngSubmit)="submit()">
        <h2>{{ i18n.t('forgotPassword') }}</h2>
        <p class="hint">{{ i18n.isEn ? 'Enter your username to receive a reset token.' : 'রিসেট টোকেন পেতে আপনার ইউজারনেম দিন।' }}</p>

        <div class="form-group" *ngIf="!devToken">
          <label class="ds-label">{{ i18n.t('username') }}</label>
          <input class="ds-input" name="username" [(ngModel)]="username" required autocomplete="username">
        </div>

        <p class="ds-error" *ngIf="error">{{ error }}</p>

        <ng-container *ngIf="!devToken">
          <button class="ds-btn ds-btn-primary full" type="submit" [disabled]="f.invalid || loading">
            {{ loading ? i18n.t('loading') : i18n.t('sendResetLink') }}
          </button>
        </ng-container>

        <!-- Dev: no email integration, so surface the token + a direct link -->
        <div class="token-box" *ngIf="devToken">
          <p class="ok">{{ message }}</p>
          <p class="hint">{{ i18n.isEn ? 'Development mode — use this token to reset now:' : 'ডেভেলপমেন্ট মোড — এখন রিসেট করতে এই টোকেন ব্যবহার করুন:' }}</p>
          <code class="token">{{ devToken }}</code>
          <button class="ds-btn ds-btn-primary full" type="button" (click)="goReset()">{{ i18n.t('resetPassword') }}</button>
        </div>

        <p class="switch-link"><a routerLink="/login">{{ i18n.t('backToLogin') }}</a></p>
      </form>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; padding: 56px 20px; }
    .card { padding: 32px; width: 100%; max-width: 400px; }
    h2 { margin: 0 0 8px; color: var(--brand); }
    .hint { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 18px; }
    .form-group { margin-bottom: 16px; }
    .full { width: 100%; padding: 12px; margin-top: 4px; }
    .ok { color: var(--success); font-size: 0.9rem; }
    .token-box { margin-top: 8px; display: flex; flex-direction: column; gap: 10px; }
    .token { display: block; background: var(--surface-2); border: 1px dashed var(--border-strong); padding: 10px; border-radius: var(--radius-sm); word-break: break-all; font-size: 0.8rem; }
    .switch-link { text-align: center; font-size: 0.85rem; margin-top: 16px; }
  `],
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  username = '';
  error = '';
  message = '';
  devToken = '';
  loading = false;

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.forgotPassword(this.username).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message;
        this.devToken = res.devToken || '';
        if (!this.devToken) this.error = this.i18n.isEn ? 'Token issued (check with your admin).' : 'টোকেন ইস্যু হয়েছে (অ্যাডমিনের সাথে যোগাযোগ করুন)।';
      },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'Request failed'; },
    });
  }

  goReset() {
    this.router.navigate(['/reset-password'], { queryParams: { token: this.devToken } });
  }
}
