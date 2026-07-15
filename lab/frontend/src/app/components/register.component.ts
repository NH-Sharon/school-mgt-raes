import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, Role } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="auth-card" #f="ngForm" (ngSubmit)="submit()">
        <h2>{{ i18n.t('register') }}</h2>
        <div class="form-group">
          <label>{{ i18n.t('fullName') }}</label>
          <input class="form-control" name="fullName" [(ngModel)]="fullName" required>
        </div>
        <div class="form-group">
          <label>{{ i18n.t('username') }}</label>
          <input class="form-control" name="username" [(ngModel)]="username" required>
        </div>
        <div class="form-group">
          <label>{{ i18n.t('password') }}</label>
          <input class="form-control" type="password" name="password" [(ngModel)]="password" required minlength="6">
        </div>
        <div class="form-group">
          <label>{{ i18n.t('role') }}</label>
          <select class="form-control" name="role" [(ngModel)]="role">
            <option value="student">{{ i18n.t('student') }}</option>
            <option value="teacher">{{ i18n.t('teacher') }}</option>
            <option value="guardian">{{ i18n.t('guardian') }}</option>
          </select>
        </div>
        <div class="form-group" *ngIf="role === 'student' || role === 'teacher'">
          <label>{{ i18n.t('classLevel') }}</label>
          <select class="form-control" name="classLevel" [(ngModel)]="classLevel">
            <option *ngFor="let c of classLevels" [value]="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ i18n.t('medium') }}</label>
          <select class="form-control" name="medium" [(ngModel)]="medium">
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ i18n.t('institution') }}</label>
          <input class="form-control" name="institution" [(ngModel)]="institution">
        </div>
        <p class="error" *ngIf="error">{{ error }}</p>
        <button class="primary-btn" type="submit" [disabled]="f.invalid || loading">{{ loading ? i18n.t('loading') : i18n.t('submit') }}</button>
        <p class="switch-link">{{ i18n.isEn ? 'Already have an account?' : 'অ্যাকাউন্ট আছে?' }} <a routerLink="/login">{{ i18n.t('login') }}</a></p>
      </form>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; justify-content: center; padding: 40px 20px; }
    .auth-card { background: #fff; border: 1px solid #e2e8ec; border-radius: 14px; padding: 28px; width: 100%; max-width: 420px; }
    .auth-card h2 { margin: 0 0 18px; color: #1a6d5e; text-align: center; }
    .form-group { margin-bottom: 14px; }
    .form-group label { display: block; font-size: 0.85rem; color: #55666f; margin-bottom: 4px; }
    .form-control { width: 100%; padding: 9px 12px; border: 1px solid #cfd9dd; border-radius: 8px; font-size: 0.9rem; }
    .primary-btn { width: 100%; background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none; padding: 11px; border-radius: 8px; font-weight: 700; margin-top: 6px; }
    .primary-btn:disabled { opacity: 0.5; }
    .error { color: #c0392b; font-size: 0.85rem; }
    .switch-link { text-align: center; font-size: 0.85rem; margin-top: 14px; color: #55666f; }
  `],
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  i18n = inject(I18nService);

  fullName = ''; username = ''; password = '';
  role: Role = 'student';
  classLevel = 9;
  medium: 'bn' | 'en' = 'bn';
  institution = '';
  classLevels = [6, 7, 8, 9, 10, 11, 12];
  error = ''; loading = false;

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.register({
      username: this.username, password: this.password, fullName: this.fullName, role: this.role,
      medium: this.medium, classLevel: this.classLevel, institution: this.institution || undefined,
    }).subscribe({
      next: () => {
        this.auth.login(this.username, this.password).subscribe({
          next: () => { this.loading = false; this.router.navigateByUrl('/subjects'); },
          error: () => { this.loading = false; this.router.navigateByUrl('/login'); },
        });
      },
      error: (err) => { this.loading = false; this.error = err?.error?.message || (this.i18n.isEn ? 'Registration failed' : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে'); },
    });
  }
}
