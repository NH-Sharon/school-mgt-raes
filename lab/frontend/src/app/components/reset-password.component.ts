import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <form class="card ds-card" #f="ngForm" (ngSubmit)="submit()">
        <h2>{{ i18n.t('resetPassword') }}</h2>

        <ng-container *ngIf="!done">
          <div class="form-group">
            <label class="ds-label">{{ i18n.t('resetToken') }}</label>
            <input class="ds-input" name="token" [(ngModel)]="token" required>
          </div>
          <div class="form-group">
            <label class="ds-label">{{ i18n.t('newPassword') }}</label>
            <input class="ds-input" type="password" name="password" [(ngModel)]="password" required minlength="6" autocomplete="new-password">
          </div>
          <p class="ds-error" *ngIf="error">{{ error }}</p>
          <button class="ds-btn ds-btn-primary full" type="submit" [disabled]="f.invalid || loading">
            {{ loading ? i18n.t('loading') : i18n.t('resetPassword') }}
          </button>
        </ng-container>

        <p class="ok" *ngIf="done">{{ message }}</p>

        <p class="switch-link"><a routerLink="/login">{{ i18n.t('backToLogin') }}</a></p>
      </form>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; padding: 56px 20px; }
    .card { padding: 32px; width: 100%; max-width: 400px; }
    h2 { margin: 0 0 20px; color: var(--brand); }
    .form-group { margin-bottom: 16px; }
    .full { width: 100%; padding: 12px; margin-top: 4px; }
    .ok { color: var(--success); font-size: 0.92rem; }
    .switch-link { text-align: center; font-size: 0.85rem; margin-top: 16px; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  i18n = inject(I18nService);

  token = '';
  password = '';
  error = '';
  message = '';
  loading = false;
  done = false;

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (t) this.token = t;
  }

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (res) => { this.loading = false; this.done = true; this.message = res.message; },
      error: (err) => { this.loading = false; this.error = err?.error?.message || 'Reset failed'; },
    });
  }
}
