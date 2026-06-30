import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { I18nService } from '../services/i18n.service';
import { AuthService } from '../services/auth.service';

const API = 'https://raes-backend.vercel.app/api';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- Toast notification -->
<div class="ap-toast" *ngIf="toastMsg" [class.ap-toast-show]="toastMsg">{{ toastMsg }}</div>

<!-- Mobile top bar -->
<div class="ap-mobile-bar">
  <button class="ap-hamburger" (click)="toggleSidebar()">☰</button>
  <span class="ap-mobile-title">🏫 RAES Admin</span>
  <span class="ap-mobile-section">{{ activeSection }}</span>
</div>
<div class="ap-sidebar-overlay" *ngIf="sidebarOpen" (click)="toggleSidebar()"></div>

<div class="ap-wrap">
  <!-- SIDEBAR -->
  <aside class="ap-sidebar" [class.open]="sidebarOpen">
    <div class="ap-brand">
      <div class="ap-logo">🏫</div>
      <div class="ap-school">{{ i18n.isEn ? 'Rowshon Amir' : 'রওশন আমির' }}</div>
      <div class="ap-role-badge">Admin Panel</div>
    </div>

    <nav class="ap-nav">
      <div class="ap-nav-section">{{ i18n.isEn ? 'Overview' : 'সারসংক্ষেপ' }}</div>
      <button [class.active]="activeSection==='dashboard'" (click)="go('dashboard')">📊 {{ i18n.isEn ? 'Dashboard' : 'ড্যাশবোর্ড' }}</button>

      <div class="ap-nav-section">{{ i18n.isEn ? 'Website' : 'ওয়েবসাইট' }}</div>
      <button [class.active]="activeSection==='site-settings'" (click)="go('site-settings')">⚙️ {{ i18n.isEn ? 'School Info' : 'স্কুল তথ্য' }}</button>
      <button [class.active]="activeSection==='hero-slides'" (click)="go('hero-slides')">🎠 {{ i18n.isEn ? 'Hero Slides' : 'স্লাইডার' }}</button>
      <button [class.active]="activeSection==='quick-links'" (click)="go('quick-links')">🔗 {{ i18n.isEn ? 'Quick Links' : 'দ্রুত লিংক' }}</button>
      <button [class.active]="activeSection==='notices'" (click)="go('notices')">📢 {{ i18n.isEn ? 'Notices' : 'নোটিশ' }}</button>
      <button [class.active]="activeSection==='events'" (click)="go('events')">📅 {{ i18n.isEn ? 'Events' : 'অনুষ্ঠান' }}</button>
      <button [class.active]="activeSection==='gallery'" (click)="go('gallery')">🖼️ {{ i18n.isEn ? 'Gallery' : 'গ্যালারি' }}</button>

      <div class="ap-nav-section">{{ i18n.isEn ? 'Academics' : 'একাডেমিক' }}</div>
      <button [class.active]="activeSection==='students'" (click)="go('students')">👨‍🎓 {{ i18n.isEn ? 'Students' : 'শিক্ষার্থী' }}</button>
      <button [class.active]="activeSection==='teachers'" (click)="go('teachers')">👨‍🏫 {{ i18n.isEn ? 'Teachers' : 'শিক্ষক' }}</button>
      <button [class.active]="activeSection==='classes'" (click)="go('classes')">🏫 {{ i18n.isEn ? 'Classes' : 'শ্রেণী' }}</button>
      <button [class.active]="activeSection==='attendance'" (click)="go('attendance')">📅 {{ i18n.isEn ? 'Attendance' : 'উপস্থিতি' }}</button>
      <button [class.active]="activeSection==='exams'" (click)="go('exams')">📋 {{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</button>
      <button [class.active]="activeSection==='homework'" (click)="go('homework')">📚 {{ i18n.isEn ? 'Homework' : 'হোমওয়ার্ক' }}</button>
      <button [class.active]="activeSection==='admissions'" (click)="go('admissions')">📝 {{ i18n.isEn ? 'Admissions' : 'ভর্তি ব্যবস্থাপনা' }}</button>

      <div class="ap-nav-section">{{ i18n.isEn ? 'Operations' : 'পরিচালনা' }}</div>
      <button [class.active]="activeSection==='payments'" (click)="go('payments')">💳 {{ i18n.isEn ? 'Payments' : 'পেমেন্ট' }}</button>
      <button [class.active]="activeSection==='transport'" (click)="go('transport')">🚌 {{ i18n.isEn ? 'Transport' : 'পরিবহন' }}</button>

      <div class="ap-nav-section">{{ i18n.isEn ? 'HR' : 'এইচআর' }}</div>
      <button [class.active]="activeSection==='employees'" (click)="go('employees')">👔 {{ i18n.isEn ? 'HR Management' : 'কর্মী ব্যবস্থাপনা' }}</button>
      <button [class.active]="activeSection==='hr-attendance'" (click)="go('hr-attendance')">📋 {{ i18n.isEn ? 'HR Attendance' : 'কর্মী উপস্থিতি' }}</button>

      <div class="ap-nav-section">{{ i18n.isEn ? 'System' : 'সিস্টেম' }}</div>
      <button [class.active]="activeSection==='users'" (click)="go('users')">👥 {{ i18n.isEn ? 'Users & Roles' : 'ব্যবহারকারী' }}</button>
    </nav>

    <div class="ap-sidebar-foot">
      <div class="ap-user-row">
        <div class="ap-avatar">{{ userInitial }}</div>
        <div>
          <div class="ap-uname">{{ userName }}</div>
          <div class="ap-urole">Administrator</div>
        </div>
      </div>
      <div class="ap-foot-actions">
        <button class="ap-action-btn" (click)="i18n.toggle()">{{ i18n.isEn ? 'বাংলা' : 'EN' }}</button>
        <button class="ap-action-btn" (click)="visitSite()">🌐</button>
        <button class="ap-action-btn ap-logout" (click)="logout()">{{ i18n.isEn ? 'Sign Out' : 'লগআউট' }}</button>
      </div>
    </div>
  </aside>

  <!-- MAIN CONTENT -->
  <main class="ap-main">

    <!-- ═══ DASHBOARD ═══ -->
    <section *ngIf="activeSection==='dashboard'" class="ap-section">
      <div class="ap-page-head">
        <h1>{{ i18n.isEn ? 'Dashboard' : 'ড্যাশবোর্ড' }}</h1>
        <span class="ap-date">{{ today }}</span>
      </div>
      <div class="ap-stat-grid">
        <div class="ap-stat-card" style="border-color:#1A4731">
          <div class="ap-stat-icon">👨‍🎓</div>
          <div class="ap-stat-val">{{ stats.students }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Students' : 'শিক্ষার্থী' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#1a5c8a">
          <div class="ap-stat-icon">👨‍🏫</div>
          <div class="ap-stat-val">{{ stats.teachers }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Teachers' : 'শিক্ষক' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#D4911A">
          <div class="ap-stat-icon">📋</div>
          <div class="ap-stat-val">{{ stats.exams }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#059669">
          <div class="ap-stat-icon">💳</div>
          <div class="ap-stat-val">৳{{ stats.paidAmount | number }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Collected' : 'সংগৃহীত' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#c0392b">
          <div class="ap-stat-icon">⚠️</div>
          <div class="ap-stat-val">{{ stats.pendingPayments }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Pending Fees' : 'বকেয়া ফি' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#7C3AED">
          <div class="ap-stat-icon">👥</div>
          <div class="ap-stat-val">{{ stats.users }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Users' : 'ব্যবহারকারী' }}</div>
        </div>
      </div>
      <div class="ap-quick-grid">
        <div class="ap-quick-card" *ngFor="let q of navCards" (click)="go(q.section)">
          <div class="ap-quick-icon">{{ q.icon }}</div>
          <div class="ap-quick-label">{{ i18n.isEn ? q.en : q.bn }}</div>
          <div class="ap-quick-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- ═══ SCHOOL INFO / SETTINGS ═══ -->
    <section *ngIf="activeSection==='site-settings'" class="ap-section">
      <div class="ap-page-head">
        <h1>⚙️ {{ i18n.isEn ? 'School Information' : 'স্কুলের তথ্য' }}</h1>
        <button class="ap-btn-primary" (click)="saveSettings()">{{ i18n.isEn ? 'Save Changes' : 'সংরক্ষণ করুন' }}</button>
      </div>
      <div class="ap-card" *ngIf="settings">
        <div class="ap-form-grid">
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'School Name (English)' : 'স্কুলের নাম (ইংরেজি)' }}</label>
            <input class="ap-input" [(ngModel)]="settings['school_name_en']">
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'School Name (Bangla)' : 'স্কুলের নাম (বাংলা)' }}</label>
            <input class="ap-input" [(ngModel)]="settings['school_name_bn']">
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'Tagline (English)' : 'ট্যাগলাইন (ইংরেজি)' }}</label>
            <input class="ap-input" [(ngModel)]="settings['tagline_en']">
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'Tagline (Bangla)' : 'ট্যাগলাইন (বাংলা)' }}</label>
            <input class="ap-input" [(ngModel)]="settings['tagline_bn']">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Phone' : 'ফোন' }}</label>
            <input class="ap-input" [(ngModel)]="settings['phone']">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Email' : 'ইমেইল' }}</label>
            <input class="ap-input" [(ngModel)]="settings['email']">
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'Address (English)' : 'ঠিকানা (ইংরেজি)' }}</label>
            <input class="ap-input" [(ngModel)]="settings['address_en']">
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'Address (Bangla)' : 'ঠিকানা (বাংলা)' }}</label>
            <input class="ap-input" [(ngModel)]="settings['address_bn']">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Established Year' : 'প্রতিষ্ঠার বছর' }}</label>
            <input class="ap-input" [(ngModel)]="settings['est_year']">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Facebook URL' : 'ফেসবুক লিংক' }}</label>
            <input class="ap-input" [(ngModel)]="settings['facebook_url']">
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'About (English)' : 'আমাদের সম্পর্কে (ইংরেজি)' }}</label>
            <textarea class="ap-input ap-textarea" [(ngModel)]="settings['about_en']" rows="4"></textarea>
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'About (Bangla)' : 'আমাদের সম্পর্কে (বাংলা)' }}</label>
            <textarea class="ap-input ap-textarea" [(ngModel)]="settings['about_bn']" rows="4"></textarea>
          </div>
          <div class="ap-form-group span2" style="margin-top:.5rem; border-top:1px solid var(--border); padding-top:1rem">
            <label style="font-size:.9rem; color:var(--dark); font-weight:700">👴 {{ i18n.isEn ? "Founder's Information" : 'প্রতিষ্ঠাতার তথ্য' }}</label>
          </div>
          <div class="ap-form-group"><label>Founder Name (EN)</label><input class="ap-input" [(ngModel)]="settings['founder_name_en']"></div>
          <div class="ap-form-group"><label>প্রতিষ্ঠাতার নাম</label><input class="ap-input" [(ngModel)]="settings['founder_name_bn']"></div>
          <div class="ap-form-group"><label>Title (EN)</label><input class="ap-input" [(ngModel)]="settings['founder_title_en']"></div>
          <div class="ap-form-group"><label>পদবি (বাংলা)</label><input class="ap-input" [(ngModel)]="settings['founder_title_bn']"></div>
          <div class="ap-form-group span2"><label>Message (English)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['founder_message_en']" rows="4"></textarea></div>
          <div class="ap-form-group span2"><label>বার্তা (বাংলা)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['founder_message_bn']" rows="4"></textarea></div>
          <div class="ap-form-group span2">
            <label>Founder Photo</label>
            <input type="file" accept="image/*" (change)="onFounderPhoto($event)" class="ap-file-input">
            <div class="ap-image-preview" *ngIf="settings['founder_photo']">
              <img [src]="settings['founder_photo']" alt="Founder" style="max-height:150px">
              <button class="ap-clear-img" (click)="settings['founder_photo']=null">✕ Remove</button>
            </div>
          </div>

          <div class="ap-form-group span2" style="margin-top:.5rem; border-top:1px solid var(--border); padding-top:1rem">
            <label style="font-size:.9rem; color:var(--dark); font-weight:700">👨‍💼 {{ i18n.isEn ? "Managing Director's Information" : 'ব্যবস্থাপনা পরিচালকের তথ্য' }}</label>
          </div>
          <div class="ap-form-group"><label>Managing Director Name (EN)</label><input class="ap-input" [(ngModel)]="settings['director_name_en']"></div>
          <div class="ap-form-group"><label>ব্যবস্থাপনা পরিচালকের নাম</label><input class="ap-input" [(ngModel)]="settings['director_name_bn']"></div>
          <div class="ap-form-group"><label>Title (EN)</label><input class="ap-input" [(ngModel)]="settings['director_title_en']"></div>
          <div class="ap-form-group"><label>পদবি (বাংলা)</label><input class="ap-input" [(ngModel)]="settings['director_title_bn']"></div>
          <div class="ap-form-group span2"><label>Message (English)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['director_message_en']" rows="4"></textarea></div>
          <div class="ap-form-group span2"><label>বার্তা (বাংলা)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['director_message_bn']" rows="4"></textarea></div>
          <div class="ap-form-group span2">
            <label>Managing Director Photo</label>
            <input type="file" accept="image/*" (change)="onDirectorPhoto($event)" class="ap-file-input">
            <div class="ap-image-preview" *ngIf="settings['director_photo']">
              <img [src]="settings['director_photo']" alt="Managing Director" style="max-height:150px">
              <button class="ap-clear-img" (click)="settings['director_photo']=null">✕ Remove</button>
            </div>
          </div>

          <div class="ap-form-group span2" style="margin-top:.5rem; border-top:1px solid var(--border); padding-top:1rem">
            <label style="font-size:.9rem; color:var(--dark); font-weight:700">👨‍🏫 {{ i18n.isEn ? "Director's Information" : 'পরিচালকের তথ্য' }}</label>
          </div>
          <div class="ap-form-group"><label>Director Name (EN)</label><input class="ap-input" [(ngModel)]="settings['principal_name_en']"></div>
          <div class="ap-form-group"><label>পরিচালকের নাম</label><input class="ap-input" [(ngModel)]="settings['principal_name_bn']"></div>
          <div class="ap-form-group"><label>Title (EN)</label><input class="ap-input" [(ngModel)]="settings['principal_title_en']"></div>
          <div class="ap-form-group"><label>পদবি (বাংলা)</label><input class="ap-input" [(ngModel)]="settings['principal_title_bn']"></div>
          <div class="ap-form-group span2"><label>Message (English)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['principal_message_en']" rows="4"></textarea></div>
          <div class="ap-form-group span2"><label>বার্তা (বাংলা)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['principal_message_bn']" rows="4"></textarea></div>
          <div class="ap-form-group span2">
            <label>Director Photo</label>
            <input type="file" accept="image/*" (change)="onPrincipalPhoto($event)" class="ap-file-input">
            <div class="ap-image-preview" *ngIf="settings['principal_photo']">
              <img [src]="settings['principal_photo']" alt="Director" style="max-height:150px">
              <button class="ap-clear-img" (click)="settings['principal_photo']=null">✕ Remove</button>
            </div>
          </div>
          <div class="ap-form-group span2" style="border-top:1px solid var(--border); padding-top:1rem; margin-top:.5rem">
            <label style="font-size:.9rem; color:var(--dark); font-weight:700">📊 {{ i18n.isEn ? 'Homepage Stats' : 'হোমপেজ পরিসংখ্যান' }}</label>
          </div>
          <div class="ap-form-group"><label>Total Students (stat)</label><input class="ap-input" [(ngModel)]="settings['stat_students']"></div>
          <div class="ap-form-group"><label>Total Teachers (stat)</label><input class="ap-input" [(ngModel)]="settings['stat_teachers']"></div>
          <div class="ap-form-group"><label>Years of Experience</label><input class="ap-input" [(ngModel)]="settings['stat_years']"></div>
          <div class="ap-form-group"><label>Number of Classes</label><input class="ap-input" [(ngModel)]="settings['stat_classes']"></div>
          <div class="ap-form-group span2"><label>Mission (English)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['mission_en']" rows="3"></textarea></div>
          <div class="ap-form-group span2"><label>লক্ষ্য (বাংলা)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['mission_bn']" rows="3"></textarea></div>
          <div class="ap-form-group span2"><label>Vision (English)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['vision_en']" rows="3"></textarea></div>
          <div class="ap-form-group span2"><label>উদ্দেশ্য (বাংলা)</label><textarea class="ap-input ap-textarea" [(ngModel)]="settings['vision_bn']" rows="3"></textarea></div>
        </div>
      </div>
      <div class="ap-success" *ngIf="settingsSaved">✓ {{ i18n.isEn ? 'Settings saved successfully' : 'সেটিংস সংরক্ষিত হয়েছে' }}</div>
    </section>

    <!-- ═══ NOTICES ═══ -->
    <section *ngIf="activeSection==='notices'" class="ap-section">
      <div class="ap-page-head">
        <h1>📢 {{ i18n.isEn ? 'Notice Board' : 'নোটিশ বোর্ড' }}</h1>
        <button class="ap-btn-primary" (click)="openNoticeModal()">+ {{ i18n.isEn ? 'Add Notice' : 'নোটিশ যোগ করুন' }}</button>
      </div>

      <!-- Notice table -->
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr>
            <th>{{ i18n.isEn ? 'Title' : 'শিরোনাম' }}</th>
            <th>{{ i18n.isEn ? 'Type' : 'ধরন' }}</th>
            <th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th>
            <th>{{ i18n.isEn ? 'Date' : 'তারিখ' }}</th>
            <th>{{ i18n.isEn ? 'Actions' : 'কার্যক্রম' }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let n of notices">
              <td>
                <div class="ap-cell-title">{{ i18n.isEn ? n.title_en : n.title_bn }}</div>
                <div class="ap-cell-sub">{{ i18n.isEn ? n.title_bn : n.title_en }}</div>
              </td>
              <td><span class="ap-tag ap-tag-{{ n.type }}">{{ n.type }}</span></td>
              <td>
                <span class="ap-badge" [class]="n.published ? 'ap-badge-green' : 'ap-badge-gray'">
                  {{ n.published ? (i18n.isEn ? 'Published' : 'প্রকাশিত') : (i18n.isEn ? 'Draft' : 'খসড়া') }}
                </span>
              </td>
              <td class="ap-muted">{{ n.created_at | date:'dd MMM yyyy' }}</td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="editNotice(n)">✏️</button>
                  <button class="ap-btn-toggle" (click)="toggleNotice(n)">{{ n.published ? '📴' : '📢' }}</button>
                  <button class="ap-btn-del" (click)="deleteNotice(n.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="ap-empty" *ngIf="!notices.length">{{ i18n.isEn ? 'No notices yet' : 'এখনো কোনো নোটিশ নেই' }}</div>
      </div>

      <!-- Notice Modal -->
      <div class="ap-modal-bg" *ngIf="noticeModal" (click)="closeNoticeModal()">
        <div class="ap-modal" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ editingNotice?.id ? (i18n.isEn ? 'Edit Notice' : 'নোটিশ সম্পাদনা') : (i18n.isEn ? 'New Notice' : 'নতুন নোটিশ') }}</h2>
            <button class="ap-modal-close" (click)="closeNoticeModal()">✕</button>
          </div>
          <div class="ap-form-grid" *ngIf="editingNotice">
            <div class="ap-form-group span2">
              <label>{{ i18n.isEn ? 'Title (English)' : 'শিরোনাম (ইংরেজি)' }}</label>
              <input class="ap-input" [(ngModel)]="editingNotice.title_en">
            </div>
            <div class="ap-form-group span2">
              <label>{{ i18n.isEn ? 'Title (Bangla)' : 'শিরোনাম (বাংলা)' }}</label>
              <input class="ap-input" [(ngModel)]="editingNotice.title_bn">
            </div>
            <div class="ap-form-group span2">
              <label>{{ i18n.isEn ? 'Content (English)' : 'বিষয়বস্তু (ইংরেজি)' }}</label>
              <textarea class="ap-input ap-textarea" [(ngModel)]="editingNotice.content_en" rows="3"></textarea>
            </div>
            <div class="ap-form-group span2">
              <label>{{ i18n.isEn ? 'Content (Bangla)' : 'বিষয়বস্তু (বাংলা)' }}</label>
              <textarea class="ap-input ap-textarea" [(ngModel)]="editingNotice.content_bn" rows="3"></textarea>
            </div>
            <div class="ap-form-group">
              <label>{{ i18n.isEn ? 'Type' : 'ধরন' }}</label>
              <select class="ap-input" [(ngModel)]="editingNotice.type">
                <option value="general">General</option>
                <option value="exam">Exam</option>
                <option value="event">Event</option>
                <option value="fee">Fee</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            <div class="ap-form-group">
              <label>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</label>
              <select class="ap-input" [(ngModel)]="editingNotice.published">
                <option [ngValue]="true">Published</option>
                <option [ngValue]="false">Draft</option>
              </select>
            </div>
            <div class="ap-form-group span2">
              <label>{{ i18n.isEn ? 'Image (optional)' : 'ছবি (ঐচ্ছিক)' }}</label>
              <input type="file" accept="image/*" (change)="onNoticeImage($event)" class="ap-file-input">
              <div class="ap-image-preview" *ngIf="editingNotice.image_data">
                <img [src]="editingNotice.image_data" alt="preview">
                <button class="ap-clear-img" (click)="editingNotice.image_data=null">✕ Remove</button>
              </div>
            </div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="closeNoticeModal()">{{ i18n.isEn ? 'Cancel' : 'বাতিল' }}</button>
            <button class="ap-btn-primary" (click)="saveNotice()">{{ i18n.isEn ? 'Save' : 'সংরক্ষণ' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ GALLERY ═══ -->
    <section *ngIf="activeSection==='gallery'" class="ap-section">
      <div class="ap-page-head">
        <h1>🖼️ {{ i18n.isEn ? 'Photo Gallery' : 'ফটো গ্যালারি' }}</h1>
        <button class="ap-btn-primary" (click)="openGalleryUpload()">+ {{ i18n.isEn ? 'Upload Photo' : 'ছবি আপলোড' }}</button>
      </div>

      <div class="ap-card" *ngIf="galleryUploadOpen">
        <div class="ap-form-grid">
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Title' : 'শিরোনাম' }}</label>
            <input class="ap-input" [(ngModel)]="newPhoto.title">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Category' : 'ক্যাটাগরি' }}</label>
            <select class="ap-input" [(ngModel)]="newPhoto.category">
              <option value="general">General</option>
              <option value="events">Events</option>
              <option value="sports">Sports</option>
              <option value="classroom">Classroom</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div class="ap-form-group span2">
            <label>{{ i18n.isEn ? 'Select Photo' : 'ছবি নির্বাচন করুন' }}</label>
            <input type="file" accept="image/*" (change)="onGalleryImage($event)" class="ap-file-input">
          </div>
          <div class="ap-image-preview span2" *ngIf="newPhoto.image_data">
            <img [src]="newPhoto.image_data" alt="preview">
          </div>
          <div class="ap-form-group span2">
            <button class="ap-btn-ghost" (click)="galleryUploadOpen=false">{{ i18n.isEn ? 'Cancel' : 'বাতিল' }}</button>
            <button class="ap-btn-primary" (click)="uploadPhoto()" [disabled]="!newPhoto.image_data" style="margin-left:.5rem">
              {{ i18n.isEn ? 'Upload' : 'আপলোড' }}
            </button>
          </div>
        </div>
      </div>

      <div class="ap-gallery-grid">
        <div class="ap-gallery-item" *ngFor="let g of gallery">
          <img [src]="g.image_data" [alt]="g.title">
          <div class="ap-gallery-overlay">
            <div class="ap-gallery-title">{{ g.title }}</div>
            <div class="ap-gallery-cat ap-tag-{{ g.category }}">{{ g.category }}</div>
            <button class="ap-btn-del-sm" (click)="deletePhoto(g.id)">🗑️</button>
          </div>
        </div>
      </div>
      <div class="ap-empty" *ngIf="!gallery.length">{{ i18n.isEn ? 'No photos yet. Upload the first one!' : 'এখনো কোনো ছবি নেই।' }}</div>
    </section>

    <!-- ═══ HERO SLIDES ═══ -->
    <section *ngIf="activeSection==='hero-slides'" class="ap-section">
      <div class="ap-page-head">
        <h1>🎠 {{ i18n.isEn ? 'Hero Slider' : 'হোমপেজ স্লাইডার' }}</h1>
        <button class="ap-btn-primary" (click)="openSlideModal()">+ {{ i18n.isEn ? 'Add Slide' : 'স্লাইড যোগ করুন' }}</button>
      </div>
      <div class="ap-slides-grid">
        <div class="ap-slide-card" *ngFor="let s of heroSlides">
          <div class="ap-slide-preview" [class.has-img]="s.image_data">
            <img *ngIf="s.image_data" [src]="s.image_data" alt="">
            <div *ngIf="!s.image_data" class="ap-slide-placeholder">🖼️</div>
          </div>
          <div class="ap-slide-info">
            <div class="ap-slide-title">{{ s.title_en }}</div>
            <div class="ap-slide-sub">{{ s.title_bn }}</div>
            <div class="ap-slide-sub">{{ s.subtitle_en }}</div>
            <div style="margin-top:.4rem">
              <span class="ap-badge" [class]="s.is_active ? 'ap-badge-green' : 'ap-badge-gray'">{{ s.is_active ? 'Active' : 'Hidden' }}</span>
              <span class="ap-muted" style="margin-left:.5rem;font-size:.72rem">Order: {{ s.sort_order }}</span>
            </div>
          </div>
          <div class="ap-action-row" style="flex-direction:column;gap:.3rem">
            <button class="ap-btn-edit" (click)="editSlide(s)">✏️</button>
            <button class="ap-btn-del" (click)="deleteSlide(s.id)">🗑️</button>
          </div>
        </div>
      </div>
      <div class="ap-empty" *ngIf="!heroSlides.length">{{ i18n.isEn ? 'No slides yet.' : 'কোনো স্লাইড নেই।' }}</div>

      <!-- Slide Modal -->
      <div class="ap-modal-bg" *ngIf="slideModal" (click)="closeSlideModal()">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ editingSlide?.id ? 'Edit Slide' : 'New Slide' }}</h2>
            <button class="ap-modal-close" (click)="closeSlideModal()">✕</button>
          </div>
          <div class="ap-form-grid" *ngIf="editingSlide">
            <div class="ap-form-group span2"><label>Title (English) *</label><input class="ap-input" [(ngModel)]="editingSlide.title_en"></div>
            <div class="ap-form-group span2"><label>শিরোনাম (বাংলা) *</label><input class="ap-input" [(ngModel)]="editingSlide.title_bn"></div>
            <div class="ap-form-group span2"><label>Subtitle (English)</label><input class="ap-input" [(ngModel)]="editingSlide.subtitle_en"></div>
            <div class="ap-form-group span2"><label>সাবটাইটেল (বাংলা)</label><input class="ap-input" [(ngModel)]="editingSlide.subtitle_bn"></div>
            <div class="ap-form-group"><label>Sort Order</label><input type="number" class="ap-input" [(ngModel)]="editingSlide.sort_order"></div>
            <div class="ap-form-group"><label>Status</label><select class="ap-input" [(ngModel)]="editingSlide.is_active"><option [ngValue]="true">Active</option><option [ngValue]="false">Hidden</option></select></div>
            <div class="ap-form-group span2">
              <label>Background Image (optional)</label>
              <input type="file" accept="image/*" (change)="onSlideImage($event)" class="ap-file-input">
              <div class="ap-image-preview" *ngIf="editingSlide.image_data">
                <img [src]="editingSlide.image_data" alt="preview">
                <button class="ap-clear-img" (click)="editingSlide.image_data=null">✕ Remove</button>
              </div>
            </div>
          </div>
          <div class="ap-modal-foot"><button class="ap-btn-ghost" (click)="closeSlideModal()">Cancel</button><button class="ap-btn-primary" (click)="saveSlide()">Save</button></div>
        </div>
      </div>
    </section>

    <!-- ═══ QUICK LINKS ═══ -->
    <section *ngIf="activeSection==='quick-links'" class="ap-section">
      <div class="ap-page-head">
        <h1>🔗 {{ i18n.isEn ? 'Quick Links' : 'দ্রুত লিংক' }}</h1>
        <button class="ap-btn-primary" (click)="openQLModal()">+ {{ i18n.isEn ? 'Add Link' : 'লিংক যোগ করুন' }}</button>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr><th>Icon</th><th>Label (EN)</th><th>Label (BN)</th><th>Type</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let q of quickLinks">
              <td style="font-size:1.4rem">{{ q.icon }}</td>
              <td class="ap-cell-title">{{ q.label_en }}</td>
              <td>{{ q.label_bn }}</td>
              <td><span class="ap-tag">{{ q.link_type }}</span></td>
              <td>{{ q.sort_order }}</td>
              <td><div class="ap-action-row"><button class="ap-btn-edit" (click)="editQL(q)">✏️</button><button class="ap-btn-del" (click)="deleteQL(q.id)">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
        <div class="ap-empty" *ngIf="!quickLinks.length">No quick links yet.</div>
      </div>
      <div class="ap-modal-bg" *ngIf="qlModal" (click)="qlModal=false">
        <div class="ap-modal" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>{{ editingQL?.id ? 'Edit Link' : 'New Link' }}</h2><button class="ap-modal-close" (click)="qlModal=false">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingQL">
            <div class="ap-form-group"><label>Icon (emoji)</label><input class="ap-input" [(ngModel)]="editingQL.icon" placeholder="🔗"></div>
            <div class="ap-form-group"><label>Sort Order</label><input type="number" class="ap-input" [(ngModel)]="editingQL.sort_order"></div>
            <div class="ap-form-group"><label>Label (English) *</label><input class="ap-input" [(ngModel)]="editingQL.label_en"></div>
            <div class="ap-form-group"><label>লেবেল (বাংলা)</label><input class="ap-input" [(ngModel)]="editingQL.label_bn"></div>
            <div class="ap-form-group span2"><label>Link Type</label>
              <select class="ap-input" [(ngModel)]="editingQL.link_type">
                <option value="admin">Admin Portal</option>
                <option value="teacher">Teacher Portal</option>
                <option value="student">Student Portal</option>
                <option value="notice">Notice Board</option>
                <option value="gallery">Gallery</option>
                <option value="contact">Contact</option>
                <option value="login">Login</option>
              </select>
            </div>
          </div>
          <div class="ap-modal-foot"><button class="ap-btn-ghost" (click)="qlModal=false">Cancel</button><button class="ap-btn-primary" (click)="saveQL()">Save</button></div>
        </div>
      </div>
    </section>

    <!-- ═══ EVENTS ═══ -->
    <section *ngIf="activeSection==='events'" class="ap-section">
      <div class="ap-page-head">
        <h1>📅 {{ i18n.isEn ? 'School Events' : 'বিদ্যালয়ের অনুষ্ঠান' }}</h1>
        <button class="ap-btn-primary" (click)="openEventModal()">+ {{ i18n.isEn ? 'Add Event' : 'অনুষ্ঠান যোগ করুন' }}</button>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr><th>Date</th><th>Event</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of schoolEvents">
              <td class="ap-muted">{{ e.event_date | date:'dd MMM yyyy' }}</td>
              <td>
                <div class="ap-cell-title">{{ e.title_en }}</div>
                <div class="ap-cell-sub">{{ e.title_bn }}</div>
              </td>
              <td><span class="ap-tag">{{ e.category }}</span></td>
              <td><div class="ap-action-row"><button class="ap-btn-edit" (click)="editEvent(e)">✏️</button><button class="ap-btn-del" (click)="deleteEvent(e.id)">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
        <div class="ap-empty" *ngIf="!schoolEvents.length">{{ i18n.isEn ? 'No events yet.' : 'কোনো অনুষ্ঠান নেই।' }}</div>
      </div>
      <div class="ap-modal-bg" *ngIf="eventModal" (click)="closeEventModal()">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>{{ editingEvent?.id ? 'Edit Event' : 'New Event' }}</h2><button class="ap-modal-close" (click)="closeEventModal()">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingEvent">
            <div class="ap-form-group span2"><label>Title (English) *</label><input class="ap-input" [(ngModel)]="editingEvent.title_en"></div>
            <div class="ap-form-group span2"><label>শিরোনাম (বাংলা)</label><input class="ap-input" [(ngModel)]="editingEvent.title_bn"></div>
            <div class="ap-form-group"><label>Event Date *</label><input type="date" class="ap-input" [(ngModel)]="editingEvent.event_date"></div>
            <div class="ap-form-group"><label>Category</label>
              <select class="ap-input" [(ngModel)]="editingEvent.category">
                <option value="general">General</option>
                <option value="sports">Sports</option>
                <option value="academic">Academic</option>
                <option value="ceremony">Ceremony</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div class="ap-form-group span2"><label>Description (English)</label><textarea class="ap-input ap-textarea" [(ngModel)]="editingEvent.description_en" rows="3"></textarea></div>
            <div class="ap-form-group span2"><label>বিবরণ (বাংলা)</label><textarea class="ap-input ap-textarea" [(ngModel)]="editingEvent.description_bn" rows="3"></textarea></div>
            <div class="ap-form-group span2">
              <label>Event Image (optional)</label>
              <input type="file" accept="image/*" (change)="onEventImage($event)" class="ap-file-input">
              <div class="ap-image-preview" *ngIf="editingEvent.image_data">
                <img [src]="editingEvent.image_data" alt="preview">
                <button class="ap-clear-img" (click)="editingEvent.image_data=null">✕ Remove</button>
              </div>
            </div>
          </div>
          <div class="ap-modal-foot"><button class="ap-btn-ghost" (click)="closeEventModal()">Cancel</button><button class="ap-btn-primary" (click)="saveEvent()">Save</button></div>
        </div>
      </div>
    </section>

    <!-- ═══ STUDENTS ═══ -->
    <section *ngIf="activeSection==='students'" class="ap-section">
      <div class="ap-page-head">
        <h1>👨‍🎓 {{ i18n.isEn ? 'Student Management' : 'শিক্ষার্থী ব্যবস্থাপনা' }}</h1>
        <button class="ap-btn-primary" (click)="openStudentModal()">+ {{ i18n.isEn ? 'Add Student' : 'শিক্ষার্থী যোগ করুন' }}</button>
      </div>
      <div class="ap-toolbar">
        <input class="ap-search" [(ngModel)]="studentSearch" [placeholder]="i18n.isEn ? 'Search by name or ID…' : 'নাম বা আইডি দিয়ে খুঁজুন…'">
        <select class="ap-input ap-filter" [(ngModel)]="studentClassFilter" (change)="applyStudentFilter()">
          <option value="">{{ i18n.isEn ? 'All Classes' : 'সব শ্রেণী' }}</option>
          <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
        </select>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr>
            <th>ID</th>
            <th>{{ i18n.isEn ? 'Photo' : 'ছবি' }}</th>
            <th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th>
            <th>{{ i18n.isEn ? 'Class / Section' : 'শ্রেণী / শাখা' }}</th>
            <th>Roll</th>
            <th>{{ i18n.isEn ? 'Guardian' : 'অভিভাবক' }}</th>
            <th>{{ i18n.isEn ? 'Actions' : 'কার্যক্রম' }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let s of filteredStudents">
              <td class="ap-mono" style="font-size:.8rem">{{ s.student_id }}</td>
              <td>
                <div class="ap-student-avatar" [style.backgroundImage]="s.photo ? 'url('+s.photo+')' : 'none'">
                  <span *ngIf="!s.photo">{{ s.name_en?.charAt(0) }}</span>
                </div>
              </td>
              <td>
                <div class="ap-cell-title">{{ s.name_en }}</div>
                <div class="ap-cell-sub">{{ s.name_bn }}</div>
              </td>
              <td>
                <span class="ap-tag">{{ s.class_name }}</span>
                <span class="ap-tag ap-tag-sec">{{ s.class_section }}</span>
              </td>
              <td>{{ s.roll_number }}</td>
              <td>{{ s.father_name }}</td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-view" (click)="viewStudent(s)" title="View">👁️</button>
                  <button class="ap-btn-edit" (click)="editStudent(s)">✏️</button>
                  <button class="ap-btn-del" (click)="deleteStudent(s.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="ap-empty" *ngIf="!filteredStudents.length">{{ i18n.isEn ? 'No students found' : 'কোনো শিক্ষার্থী পাওয়া যায়নি' }}</div>
      </div>

      <!-- Student View Modal -->
      <div class="ap-modal-bg" *ngIf="viewingStudent" (click)="viewingStudent=null">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ i18n.isEn ? 'Student Profile' : 'শিক্ষার্থীর প্রোফাইল' }}</h2>
            <button class="ap-modal-close" (click)="viewingStudent=null">✕</button>
          </div>
          <div class="ap-profile-view" *ngIf="viewingStudent">
            <div class="ap-profile-photo">
              <div class="ap-profile-avatar" [style.backgroundImage]="viewingStudent.photo ? 'url('+viewingStudent.photo+')' : 'none'">
                <span *ngIf="!viewingStudent.photo">{{ viewingStudent.name_en?.charAt(0) }}</span>
              </div>
              <div class="ap-profile-id">{{ viewingStudent.student_id }}</div>
            </div>
            <div class="ap-profile-fields">
              <div class="ap-pf-row"><span>নাম (EN)</span><strong>{{ viewingStudent.name_en }}</strong></div>
              <div class="ap-pf-row"><span>নাম (BN)</span><strong>{{ viewingStudent.name_bn }}</strong></div>
              <div class="ap-pf-row"><span>শ্রেণী</span><strong>{{ viewingStudent.class_name }} {{ viewingStudent.class_section }}</strong></div>
              <div class="ap-pf-row"><span>রোল</span><strong>{{ viewingStudent.roll_number }}</strong></div>
              <div class="ap-pf-row"><span>পিতার নাম</span><strong>{{ viewingStudent.father_name }}</strong></div>
              <div class="ap-pf-row"><span>মাতার নাম</span><strong>{{ viewingStudent.mother_name }}</strong></div>
              <div class="ap-pf-row"><span>জন্ম তারিখ</span><strong>{{ viewingStudent.date_of_birth | date:'dd MMM yyyy' }}</strong></div>
              <div class="ap-pf-row"><span>লিঙ্গ</span><strong>{{ viewingStudent.gender }}</strong></div>
              <div class="ap-pf-row"><span>রক্তের গ্রুপ</span><strong>{{ viewingStudent.blood_group || '—' }}</strong></div>
              <div class="ap-pf-row"><span>ফোন</span><strong>{{ viewingStudent.phone || '—' }}</strong></div>
              <div class="ap-pf-row"><span>ঠিকানা</span><strong>{{ viewingStudent.address || '—' }}</strong></div>
            </div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="viewingStudent=null">{{ i18n.isEn ? 'Close' : 'বন্ধ' }}</button>
            <button class="ap-btn-primary" (click)="editStudent(viewingStudent); viewingStudent=null">✏️ {{ i18n.isEn ? 'Edit' : 'সম্পাদনা' }}</button>
          </div>
        </div>
      </div>

      <!-- Student Add/Edit Modal -->
      <div class="ap-modal-bg" *ngIf="studentModal" (click)="closeStudentModal()">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ editingStudent?.id ? (i18n.isEn ? 'Edit Student' : 'শিক্ষার্থী সম্পাদনা') : (i18n.isEn ? 'New Student' : 'নতুন শিক্ষার্থী') }}</h2>
            <button class="ap-modal-close" (click)="closeStudentModal()">✕</button>
          </div>
          <div class="ap-form-grid" *ngIf="editingStudent">
            <div class="ap-form-group">
              <label>Student ID <span class="ap-auto-tag">{{ i18n.isEn ? 'auto' : 'স্বয়ংক্রিয়' }}</span></label>
              <input class="ap-input" [(ngModel)]="editingStudent.student_id" [placeholder]="nextStudentId">
            </div>
            <div class="ap-form-group"><label>Roll Number</label><input type="number" class="ap-input" [(ngModel)]="editingStudent.roll_number"></div>
            <div class="ap-form-group"><label>Name (English) *</label><input class="ap-input" [(ngModel)]="editingStudent.name_en"></div>
            <div class="ap-form-group"><label>নাম (বাংলা)</label><input class="ap-input" [(ngModel)]="editingStudent.name_bn"></div>
            <div class="ap-form-group"><label>Father's Name / পিতার নাম</label><input class="ap-input" [(ngModel)]="editingStudent.father_name"></div>
            <div class="ap-form-group"><label>Mother's Name / মাতার নাম</label><input class="ap-input" [(ngModel)]="editingStudent.mother_name"></div>
            <div class="ap-form-group"><label>Date of Birth / জন্ম তারিখ</label><input type="date" class="ap-input" [(ngModel)]="editingStudent.date_of_birth"></div>
            <div class="ap-form-group"><label>Gender / লিঙ্গ</label>
              <select class="ap-input" [(ngModel)]="editingStudent.gender">
                <option value="male">Male / ছেলে</option><option value="female">Female / মেয়ে</option>
              </select>
            </div>
            <div class="ap-form-group"><label>Class / শ্রেণী *</label>
              <select class="ap-input" [(ngModel)]="editingStudent.class_id">
                <option value="">-- শ্রেণী নির্বাচন --</option>
                <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} - {{ c.section }}</option>
              </select>
            </div>
            <div class="ap-form-group"><label>Blood Group / রক্তের গ্রুপ</label><input class="ap-input" [(ngModel)]="editingStudent.blood_group" placeholder="A+, B-, O+…"></div>
            <div class="ap-form-group"><label>Phone / ফোন</label><input class="ap-input" [(ngModel)]="editingStudent.phone"></div>
            <div class="ap-form-group span2"><label>Address / ঠিকানা</label><input class="ap-input" [(ngModel)]="editingStudent.address"></div>
            <div class="ap-form-group span2">
              <label>Photo / ছবি</label>
              <input type="file" accept="image/*" (change)="onStudentPhoto($event)" class="ap-file-input">
              <div class="ap-image-preview" *ngIf="editingStudent.photo">
                <img [src]="editingStudent.photo" alt="photo" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid var(--dark)">
                <button class="ap-clear-img" (click)="editingStudent.photo=null">✕ Remove</button>
              </div>
            </div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="closeStudentModal()">Cancel</button>
            <button class="ap-btn-primary" (click)="saveStudent()">{{ i18n.isEn ? 'Save' : 'সংরক্ষণ' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ TEACHERS ═══ -->
    <section *ngIf="activeSection==='teachers'" class="ap-section">
      <div class="ap-page-head">
        <h1>👨‍🏫 {{ i18n.isEn ? 'Teacher Management' : 'শিক্ষক ব্যবস্থাপনা' }}</h1>
        <button class="ap-btn-primary" (click)="openTeacherModal()">+ {{ i18n.isEn ? 'Add Teacher' : 'শিক্ষক যোগ করুন' }}</button>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr>
            <th>ID</th><th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th><th>{{ i18n.isEn ? 'Designation' : 'পদ' }}</th><th>{{ i18n.isEn ? 'Subject' : 'বিষয়' }}</th><th>{{ i18n.isEn ? 'Phone' : 'ফোন' }}</th><th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th><th>{{ i18n.isEn ? 'Actions' : 'কার্যক্রম' }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let t of teachers">
              <td class="ap-muted">{{ t.teacher_id }}</td>
              <td>
                <div class="ap-cell-title">{{ t.name_en }}</div>
                <div class="ap-cell-sub">{{ t.name_bn }}</div>
              </td>
              <td>{{ t.designation }}</td>
              <td>{{ t.subject }}</td>
              <td>{{ t.phone }}</td>
              <td><span class="ap-badge" [class]="t.is_active ? 'ap-badge-green' : 'ap-badge-gray'">{{ t.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="editTeacher(t)">✏️</button>
                  <button class="ap-btn-del" (click)="deleteTeacher(t.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Teacher Modal -->
      <div class="ap-modal-bg" *ngIf="teacherModal" (click)="closeTeacherModal()">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ editingTeacher?.id ? 'Edit Teacher' : 'New Teacher' }}</h2>
            <button class="ap-modal-close" (click)="closeTeacherModal()">✕</button>
          </div>
          <div class="ap-form-grid" *ngIf="editingTeacher">
            <div class="ap-form-group"><label>Teacher ID *</label><input class="ap-input" [(ngModel)]="editingTeacher.teacher_id"></div>
            <div class="ap-form-group"><label>Designation</label><input class="ap-input" [(ngModel)]="editingTeacher.designation"></div>
            <div class="ap-form-group"><label>Name (English) *</label><input class="ap-input" [(ngModel)]="editingTeacher.name_en"></div>
            <div class="ap-form-group"><label>নাম (বাংলা) *</label><input class="ap-input" [(ngModel)]="editingTeacher.name_bn"></div>
            <div class="ap-form-group"><label>Subject</label><input class="ap-input" [(ngModel)]="editingTeacher.subject"></div>
            <div class="ap-form-group"><label>Phone</label><input class="ap-input" [(ngModel)]="editingTeacher.phone"></div>
            <div class="ap-form-group"><label>Email</label><input class="ap-input" [(ngModel)]="editingTeacher.email"></div>
            <div class="ap-form-group"><label>Salary</label><input type="number" class="ap-input" [(ngModel)]="editingTeacher.salary"></div>
            <div class="ap-form-group span2"><label>Address</label><input class="ap-input" [(ngModel)]="editingTeacher.address"></div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="closeTeacherModal()">Cancel</button>
            <button class="ap-btn-primary" (click)="saveTeacher()">Save</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ CLASSES ═══ -->
    <section *ngIf="activeSection==='classes'" class="ap-section">
      <div class="ap-page-head">
        <h1>🏫 {{ i18n.isEn ? 'Class Management' : 'শ্রেণী ব্যবস্থাপনা' }}</h1>
      </div>
      <div class="ap-card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1rem">{{ i18n.isEn ? 'Add New Class' : 'নতুন শ্রেণী যোগ করুন' }}</h3>
        <div class="ap-form-grid">
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Class Name' : 'শ্রেণীর নাম' }} *</label>
            <select class="ap-input" [(ngModel)]="newClass.class_name">
              <option value="">{{ i18n.isEn ? 'Select Class' : 'শ্রেণী নির্বাচন' }}</option>
              <option *ngFor="let n of classNames" [value]="n.en">{{ i18n.isEn ? n.en : n.bn }}</option>
            </select>
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Section' : 'শাখা' }} *</label>
            <select class="ap-input" [(ngModel)]="newClass.section">
              <option value="">{{ i18n.isEn ? 'Select Section' : 'শাখা নির্বাচন' }}</option>
              <option value="ক">ক (A)</option>
              <option value="খ">খ (B)</option>
              <option value="গ">গ (C)</option>
            </select>
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Room Number' : 'কক্ষ নম্বর' }}</label>
            <input class="ap-input" [(ngModel)]="newClass.room_number" placeholder="e.g. ১০১">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Capacity' : 'আসন সংখ্যা' }}</label>
            <input type="number" class="ap-input" [(ngModel)]="newClass.capacity" placeholder="40">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Class Teacher' : 'শ্রেণী শিক্ষক' }}</label>
            <select class="ap-input" [(ngModel)]="newClass.class_teacher_id">
              <option [value]="null">{{ i18n.isEn ? 'None' : 'নেই' }}</option>
              <option *ngFor="let t of teachers" [value]="t.id">{{ t.name_en }}</option>
            </select>
          </div>
        </div>
        <div style="margin-top:1rem;display:flex;gap:.75rem">
          <button class="ap-btn-primary" (click)="saveClass()">{{ i18n.isEn ? 'Add Class' : 'শ্রেণী যোগ করুন' }}</button>
          <span *ngIf="classSaved" style="color:#1A4731;font-weight:600;align-self:center">✓ {{ i18n.isEn ? 'Saved!' : 'সংরক্ষিত!' }}</span>
          <span *ngIf="classError" style="color:#c0392b;font-weight:600;align-self:center">⚠ {{ classError }}</span>
        </div>
      </div>
      <div class="ap-card">
        <h3 style="margin-bottom:1rem">{{ i18n.isEn ? 'All Classes' : 'সকল শ্রেণী' }}</h3>
        <table class="ap-table">
          <thead>
            <tr>
              <th>{{ i18n.isEn ? 'Class' : 'শ্রেণী' }}</th>
              <th>{{ i18n.isEn ? 'Section' : 'শাখা' }}</th>
              <th>{{ i18n.isEn ? 'Room' : 'কক্ষ' }}</th>
              <th>{{ i18n.isEn ? 'Capacity' : 'আসন' }}</th>
              <th>{{ i18n.isEn ? 'Teacher' : 'শিক্ষক' }}</th>
              <th>{{ i18n.isEn ? 'Students' : 'শিক্ষার্থী' }}</th>
              <th>{{ i18n.isEn ? 'Action' : 'কার্যক্রম' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of classes">
              <td><strong>{{ i18n.isEn ? c.class_name : getBnClassName(c.class_name) }}</strong></td>
              <td>{{ c.section }}</td>
              <td class="ap-muted">{{ c.room_number || '—' }}</td>
              <td class="ap-muted">{{ c.capacity || '—' }}</td>
              <td class="ap-muted">{{ c.teacher_name || '—' }}</td>
              <td><span class="ap-tag">{{ getStudentCountForClass(c.id) }}</span></td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="openEditClass(c)" title="{{ i18n.isEn ? 'Edit' : 'সম্পাদনা' }}">✏️</button>
                  <button class="ap-btn-del" (click)="deleteClass(c.id)" title="{{ i18n.isEn ? 'Delete' : 'মুছুন' }}">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Edit Class Modal -->
      <div class="ap-modal-bg" *ngIf="editClassModal" (click)="editClassModal=false">
        <div class="ap-modal" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>{{ i18n.isEn ? 'Edit Class' : 'শ্রেণী সম্পাদনা' }}</h2><button class="ap-modal-close" (click)="editClassModal=false">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingClass">
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Class Name' : 'শ্রেণী' }}</label>
              <select class="ap-input" [(ngModel)]="editingClass.class_name">
                <option *ngFor="let cn of classNames" [value]="cn.en">{{ cn.en }}</option>
              </select>
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Section' : 'শাখা' }}</label>
              <select class="ap-input" [(ngModel)]="editingClass.section">
                <option value="ক">ক</option>
                <option value="খ">খ</option>
              </select>
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Room Number' : 'কক্ষ নং' }}</label><input class="ap-input" [(ngModel)]="editingClass.room_number"></div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Capacity' : 'ধারণক্ষমতা' }}</label><input type="number" class="ap-input" [(ngModel)]="editingClass.capacity"></div>
            <div class="ap-form-group span2"><label>{{ i18n.isEn ? 'Class Teacher' : 'শ্রেণী শিক্ষক' }}</label>
              <select class="ap-input" [(ngModel)]="editingClass.class_teacher_id">
                <option [value]="null">{{ i18n.isEn ? 'None' : 'নেই' }}</option>
                <option *ngFor="let t of teachers" [value]="t.id">{{ t.name_en }}</option>
              </select>
            </div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="editClassModal=false">{{ i18n.isEn ? 'Cancel' : 'বাতিল' }}</button>
            <button class="ap-btn-primary" (click)="saveEditClass()">{{ i18n.isEn ? 'Save Changes' : 'সংরক্ষণ করুন' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ ATTENDANCE ═══ -->
    <section *ngIf="activeSection==='attendance'" class="ap-section">
      <div class="ap-page-head"><h1>📅 {{ i18n.isEn ? 'Attendance' : 'উপস্থিতি' }}</h1></div>
      <!-- Sub-tabs -->
      <div class="ap-subtabs">
        <button [class.active]="attSubTab==='take'" (click)="attSubTab='take'">📝 {{ i18n.isEn ? 'Take Attendance' : 'উপস্থিতি নিন' }}</button>
        <button [class.active]="attSubTab==='report'" (click)="attSubTab='report'; loadAdminAttReport()">📊 {{ i18n.isEn ? 'Report' : 'রিপোর্ট' }}</button>
      </div>

      <!-- TAKE ATTENDANCE -->
      <div class="ap-card" *ngIf="attSubTab==='take'">
        <div class="ap-filter-row">
          <select class="ap-input" [(ngModel)]="attClassId" (change)="loadAttendance()">
            <option value="">{{ i18n.isEn ? 'Select Class' : 'শ্রেণী নির্বাচন' }}</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
          </select>
          <input type="date" class="ap-input" [(ngModel)]="attDate" (change)="loadAttendance()">
          <button class="ap-btn-sm" (click)="markAllPresent()">✓ {{ i18n.isEn ? 'All Present' : 'সকলে উপস্থিত' }}</button>
          <button class="ap-btn-primary ap-btn-sm" (click)="saveAttendance()">💾 {{ i18n.isEn ? 'Save' : 'সংরক্ষণ' }}</button>
        </div>
        <div *ngIf="attendance.length > 0">
          <div class="ap-att-header">
            <span style="width:50px;font-weight:600">{{ i18n.isEn ? 'Roll' : 'রোল' }}</span>
            <span style="width:110px;font-weight:600">{{ i18n.isEn ? 'Student ID' : 'শিক্ষার্থী আইডি' }}</span>
            <span style="flex:1;font-weight:600">{{ i18n.isEn ? 'Student Name' : 'শিক্ষার্থীর নাম' }}</span>
            <span style="width:280px;font-weight:600">{{ i18n.isEn ? 'Status' : 'উপস্থিতি' }}</span>
          </div>
          <div class="ap-att-row" *ngFor="let a of attendance; let i = index" [class.ap-att-even]="i%2===0">
            <div class="ap-att-roll">{{ a.roll_number || (i+1) }}</div>
            <div class="ap-att-sid">{{ a.student_id }}</div>
            <div class="ap-att-name">
              <span>{{ a.name_en }}</span>
              <small class="ap-muted">{{ a.name_bn }}</small>
            </div>
            <div class="ap-radio-group">
              <label class="ap-radio-chip green" [class.checked]="a.status==='present'">
                <input type="radio" [name]="'att'+a.student_id" value="present" [(ngModel)]="a.status"> {{ i18n.isEn ? 'Present' : 'উপস্থিত' }}
              </label>
              <label class="ap-radio-chip red" [class.checked]="a.status==='absent'">
                <input type="radio" [name]="'att'+a.student_id" value="absent" [(ngModel)]="a.status"> {{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}
              </label>
              <label class="ap-radio-chip yellow" [class.checked]="a.status==='late'">
                <input type="radio" [name]="'att'+a.student_id" value="late" [(ngModel)]="a.status"> {{ i18n.isEn ? 'Late' : 'দেরিতে' }}
              </label>
            </div>
          </div>
          <div class="ap-att-summary">
            {{ i18n.isEn ? 'Total' : 'মোট' }}: {{ attendance.length }} |
            {{ i18n.isEn ? 'Present' : 'উপস্থিত' }}: {{ attCount('present') }} |
            {{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}: {{ attCount('absent') }} |
            {{ i18n.isEn ? 'Late' : 'দেরিতে' }}: {{ attCount('late') }}
          </div>
        </div>
        <div class="ap-empty" *ngIf="!attendance.length">{{ i18n.isEn ? 'Select a class and date' : 'শ্রেণী ও তারিখ নির্বাচন করুন' }}</div>
        <div class="ap-success" *ngIf="attSaved">✓ {{ i18n.isEn ? 'Saved' : 'সংরক্ষিত' }}</div>
      </div>

      <!-- ATTENDANCE REPORT -->
      <div class="ap-card" *ngIf="attSubTab==='report'">
        <div class="ap-filter-row" style="flex-wrap:wrap">
          <select class="ap-input" [(ngModel)]="adminAttReportClassId" (change)="loadAdminAttReport()">
            <option value="">{{ i18n.isEn ? 'All Classes' : 'সব শ্রেণী' }}</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
          </select>
          <input type="month" class="ap-input" [(ngModel)]="adminAttReportMonth" (change)="loadAdminAttReport()" style="width:180px">
          <button class="ap-btn-sm" (click)="printAdminAttReport()" *ngIf="adminAttReport.length" style="margin-left:auto">🖨️ {{ i18n.isEn ? 'Print' : 'প্রিন্ট' }}</button>
        </div>
        <div id="admin-att-report-area">
          <table class="ap-table" *ngIf="adminAttReport.length">
            <thead>
              <tr>
                <th>{{ i18n.isEn ? 'Roll' : 'রোল' }}</th>
                <th>{{ i18n.isEn ? 'Student ID' : 'আইডি' }}</th>
                <th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th>
                <th style="color:#059669">✅ {{ i18n.isEn ? 'Present' : 'উপস্থিত' }}</th>
                <th style="color:#c0392b">❌ {{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}</th>
                <th style="color:#D4911A">⏰ {{ i18n.isEn ? 'Late' : 'দেরিতে' }}</th>
                <th>{{ i18n.isEn ? 'Total' : 'মোট' }}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of adminAttReport">
                <td>{{ r.roll_number }}</td>
                <td class="ap-mono" style="font-size:.78rem">{{ r.student_id }}</td>
                <td>
                  <div style="font-weight:600">{{ r.name_en }}</div>
                  <small class="ap-muted">{{ r.name_bn }}</small>
                </td>
                <td style="color:#059669;font-weight:700">{{ r.present }}</td>
                <td style="color:#c0392b;font-weight:700">{{ r.absent }}</td>
                <td style="color:#D4911A;font-weight:700">{{ r.late }}</td>
                <td>{{ r.total }}</td>
                <td>
                  <span class="ap-badge" [class]="r.pct>=75 ? 'ap-badge-green' : r.pct>=50 ? 'ap-badge-yellow' : 'ap-badge-red'">{{ r.pct }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="ap-empty" *ngIf="!adminAttReport.length">{{ i18n.isEn ? 'No records found. Select class and month.' : 'শ্রেণী ও মাস নির্বাচন করুন।' }}</div>
      </div>
    </section>

    <!-- ═══ EXAMS ═══ -->
    <section *ngIf="activeSection==='exams'" class="ap-section">
      <div class="ap-page-head">
        <h1>📋 {{ i18n.isEn ? 'Examinations' : 'পরীক্ষা' }}</h1>
        <button class="ap-btn-primary" (click)="openExamModal()">+ {{ i18n.isEn ? 'Add Exam' : 'পরীক্ষা যোগ করুন' }}</button>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr><th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th><th>Type</th><th>{{ i18n.isEn ? 'Class' : 'শ্রেণী' }}</th><th>{{ i18n.isEn ? 'Start' : 'শুরু' }}</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let e of exams">
              <td>{{ e.exam_name }}</td>
              <td><span class="ap-tag">{{ e.exam_type }}</span></td>
              <td>{{ getClassName(e.class_id) }}</td>
              <td class="ap-muted">{{ e.start_date | date:'dd MMM' }}</td>
              <td><span class="ap-badge ap-badge-{{ e.status === 'completed' ? 'gray' : e.status === 'ongoing' ? 'green' : 'blue' }}">{{ e.status }}</span></td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="editExam(e)">✏️</button>
                  <button class="ap-btn-del" (click)="deleteExam(e.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="ap-modal-bg" *ngIf="examModal" (click)="closeExamModal()">
        <div class="ap-modal" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>{{ editingExam?.id ? 'Edit Exam' : 'New Exam' }}</h2><button class="ap-modal-close" (click)="closeExamModal()">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingExam">
            <div class="ap-form-group span2"><label>Exam Name *</label><input class="ap-input" [(ngModel)]="editingExam.exam_name"></div>
            <div class="ap-form-group span2"><label>পরীক্ষার নাম</label><input class="ap-input" [(ngModel)]="editingExam.exam_name_bn"></div>
            <div class="ap-form-group"><label>Type</label><select class="ap-input" [(ngModel)]="editingExam.exam_type">
              <option>প্রথম সাময়িক</option>
              <option>দ্বিতীয় সাময়িক</option>
              <option>বার্ষিক পরীক্ষা</option>
              <option>মাসিক পরীক্ষা</option>
              <option>সাপ্তাহিক পরীক্ষা</option>
            </select></div>
            <div class="ap-form-group"><label>Class</label><select class="ap-input" [(ngModel)]="editingExam.class_id"><option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }}</option></select></div>
            <div class="ap-form-group"><label>Start Date</label><input type="date" class="ap-input" [(ngModel)]="editingExam.start_date"></div>
            <div class="ap-form-group"><label>End Date</label><input type="date" class="ap-input" [(ngModel)]="editingExam.end_date"></div>
            <div class="ap-form-group"><label>Total Marks</label><input type="number" class="ap-input" [(ngModel)]="editingExam.total_marks"></div>
            <div class="ap-form-group"><label>Pass Marks</label><input type="number" class="ap-input" [(ngModel)]="editingExam.pass_marks"></div>
            <div class="ap-form-group"><label>Status</label><select class="ap-input" [(ngModel)]="editingExam.status"><option value="scheduled">Scheduled</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></div>
          </div>
          <div class="ap-modal-foot"><button class="ap-btn-ghost" (click)="closeExamModal()">Cancel</button><button class="ap-btn-primary" (click)="saveExam()">Save</button></div>
        </div>
      </div>
    </section>

    <!-- ═══ PAYMENTS ═══ -->
    <section *ngIf="activeSection==='payments'" class="ap-section">
      <div class="ap-page-head">
        <h1>💳 {{ i18n.isEn ? 'Payment Management' : 'পেমেন্ট ব্যবস্থাপনা' }}</h1>
        <button class="ap-btn-primary" (click)="openPaymentModal()">+ {{ i18n.isEn ? 'Add Payment' : 'পেমেন্ট যোগ করুন' }}</button>
      </div>
      <!-- Class-wise summary cards -->
      <div class="ap-pay-class-grid">
        <div class="ap-pay-class-card" *ngFor="let cs of classPaymentStats">
          <div class="ap-pay-class-name">{{ cs.class_name }} <span class="ap-tag-sec">{{ cs.section }}</span></div>
          <div class="ap-pay-class-row"><span>শিক্ষার্থী</span><strong>{{ cs.total_students }}</strong></div>
          <div class="ap-pay-class-row green"><span>পরিশোধিত</span><strong>{{ cs.paid_students }}</strong></div>
          <div class="ap-pay-class-row red"><span>বাকি</span><strong>{{ cs.due_students }}</strong></div>
          <div class="ap-pay-class-row blue"><span>সংগৃহীত</span><strong>৳{{ cs.collected | number:'1.0-0' }}</strong></div>
          <div class="ap-pay-class-row orange"><span>বকেয়া</span><strong>৳{{ cs.due_amount | number:'1.0-0' }}</strong></div>
        </div>
      </div>
      <!-- Summary totals -->
      <div class="ap-stat-row">
        <div class="ap-mini-stat green">💚 {{ i18n.isEn ? 'Paid' : 'পরিশোধিত' }}: {{ paymentStats.paid }}</div>
        <div class="ap-mini-stat yellow">🟡 {{ i18n.isEn ? 'Pending' : 'বাকি' }}: {{ paymentStats.pending }}</div>
        <div class="ap-mini-stat red">🔴 {{ i18n.isEn ? 'Overdue' : 'অতিরিক্ত বাকি' }}: {{ paymentStats.overdue }}</div>
        <div class="ap-mini-stat blue">💰 {{ i18n.isEn ? 'Collected' : 'সংগৃহীত' }}: ৳{{ paymentStats.total | number }}</div>
      </div>
      <div class="ap-toolbar">
        <select class="ap-input ap-filter" [(ngModel)]="paymentFilter" (change)="filterPayments()">
          <option value="">{{ i18n.isEn ? 'All Status' : 'সব' }}</option>
          <option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option>
        </select>
      </div>
      <div class="ap-card" style="overflow-x:auto">
        <table class="ap-table">
          <thead><tr>
            <th>Student ID</th>
            <th>Roll</th>
            <th>Student Name</th>
            <th>Class</th>
            <th>Section</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of pagedPayments">
              <td class="ap-mono" style="font-size:.8rem">{{ p.student_code }}</td>
              <td style="text-align:center;font-weight:600">{{ p.roll_number || '—' }}</td>
              <td>
                <div style="font-weight:600">{{ p.name_en }}</div>
                <div style="font-size:.8rem;color:#666">{{ p.name_bn }}</div>
              </td>
              <td><span class="ap-tag">{{ p.class_name }}</span></td>
              <td><span class="ap-tag ap-tag-sec">{{ p.section || '—' }}</span></td>
              <td>{{ p.fee_type || p.payment_type }}</td>
              <td class="ap-mono">৳{{ p.amount }}</td>
              <td><span class="ap-tag">{{ p.payment_method || '—' }}</span></td>
              <td><span class="ap-badge ap-badge-{{ p.status === 'paid' ? 'green' : p.status === 'overdue' ? 'red' : 'yellow' }}">{{ p.status }}</span></td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-sm ap-btn-primary" (click)="markPaid(p)" *ngIf="p.status !== 'paid'">✓ Paid</button>
                  <button class="ap-btn-del" (click)="deletePayment(p.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Pagination -->
        <div class="ap-pagination" *ngIf="filteredPayments.length > payPerPage">
          <button class="ap-page-btn" [disabled]="payPage===1" (click)="payPage=payPage-1">‹</button>
          <span class="ap-page-info">{{ payPage }} / {{ payTotalPages }}</span>
          <button class="ap-page-btn" [disabled]="payPage>=payTotalPages" (click)="payPage=payPage+1">›</button>
          <span style="font-size:.8rem;color:#666;margin-left:.5rem">মোট {{ filteredPayments.length }} রেকর্ড</span>
        </div>
      </div>
      <!-- Payment Modal -->
      <div class="ap-modal-bg" *ngIf="paymentModal" (click)="paymentModal=false">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>{{ i18n.isEn ? 'New Payment' : 'নতুন পেমেন্ট' }}</h2><button class="ap-modal-close" (click)="paymentModal=false">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingPayment">
            <!-- Student Lookup -->
            <div class="ap-form-group span2">
              <label style="font-weight:600;color:#2c3e50">শিক্ষার্থী খুঁজুন (রোল অথবা Student ID দিয়ে)</label>
              <div style="display:grid;grid-template-columns:1fr 1fr auto auto;gap:.5rem;align-items:end;margin-top:.4rem">
                <div>
                  <div style="font-size:.75rem;color:#666;margin-bottom:.2rem">Student ID</div>
                  <input class="ap-input" [(ngModel)]="payLookup.student_id_str" placeholder="S-2026-001" (input)="clearPayStudent()">
                </div>
                <div style="display:flex;align-items:center;justify-content:center;font-weight:700;color:#999;margin-top:1.4rem">অথবা</div>
                <div style="grid-column:span 1">
                  <div style="font-size:.75rem;color:#666;margin-bottom:.2rem">শ্রেণী</div>
                  <select class="ap-input" [(ngModel)]="payLookup.class_id" (change)="clearPayStudent()">
                    <option value="">-- শ্রেণী --</option>
                    <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
                  </select>
                </div>
                <div>
                  <div style="font-size:.75rem;color:#666;margin-bottom:.2rem">রোল নম্বর</div>
                  <input type="number" class="ap-input" [(ngModel)]="payLookup.roll" placeholder="রোল" (input)="clearPayStudent()">
                </div>
              </div>
              <button class="ap-btn-sm ap-btn-primary" style="margin-top:.5rem;width:100%" (click)="lookupStudent()">🔍 শিক্ষার্থী খুঁজুন</button>
            </div>
            <div class="ap-form-group span2" *ngIf="payFoundStudent">
              <div class="ap-pay-student-found">
                <div class="ap-student-avatar" [style.backgroundImage]="payFoundStudent.photo ? 'url('+payFoundStudent.photo+')' : 'none'">
                  <span *ngIf="!payFoundStudent.photo">{{ payFoundStudent.name_en?.charAt(0) }}</span>
                </div>
                <div>
                  <strong>{{ payFoundStudent.name_en }}</strong>
                  <div class="ap-cell-sub">{{ payFoundStudent.student_id }} · Roll {{ payFoundStudent.roll_number }}</div>
                </div>
              </div>
            </div>
            <div class="ap-form-group span2" *ngIf="payLookupError" style="color:#c0392b">⚠ {{ payLookupError }}</div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Fee Type' : 'ফি ধরন' }} *</label>
              <input class="ap-input" [(ngModel)]="editingPayment.payment_type" placeholder="মাসিক বেতন, ভর্তি ফি…">
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Amount (৳)' : 'পরিমাণ (৳)' }} *</label>
              <input type="number" class="ap-input" [(ngModel)]="editingPayment.amount">
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Payment Method' : 'পেমেন্ট পদ্ধতি' }}</label>
              <select class="ap-input" [(ngModel)]="editingPayment.payment_method">
                <option value="">-- নির্বাচন করুন --</option>
                <option value="cash">💵 নগদ (Cash)</option>
                <option value="bkash">📱 bKash</option>
                <option value="nagad">📱 Nagad</option>
                <option value="bank">🏦 Bank Transfer</option>
                <option value="cheque">📝 Cheque</option>
                <option value="custom">⚙️ Other/Custom</option>
              </select>
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</label>
              <select class="ap-input" [(ngModel)]="editingPayment.status">
                <option value="paid">✅ Paid</option>
                <option value="pending">⏳ Pending</option>
                <option value="overdue">❌ Overdue</option>
              </select>
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Due Date' : 'শেষ তারিখ' }}</label>
              <input type="date" class="ap-input" [(ngModel)]="editingPayment.due_date">
            </div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Transaction ID' : 'ট্রানজেকশন আইডি' }}</label>
              <input class="ap-input" [(ngModel)]="editingPayment.transaction_id" placeholder="optional">
            </div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="paymentModal=false">{{ i18n.isEn ? 'Cancel' : 'বাতিল' }}</button>
            <button class="ap-btn-primary" (click)="savePayment()" [disabled]="!payFoundStudent">{{ i18n.isEn ? 'Save Payment' : 'পেমেন্ট সংরক্ষণ' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ HOMEWORK ═══ -->
    <section *ngIf="activeSection==='homework'" class="ap-section">
      <div class="ap-page-head">
        <h1>📚 {{ i18n.isEn ? 'Homework' : 'হোমওয়ার্ক' }}</h1>
        <button class="ap-btn-primary" (click)="openHwModal()">+ {{ i18n.isEn ? 'Assign Homework' : 'হোমওয়ার্ক দিন' }}</button>
      </div>
      <div class="ap-card">
        <div class="ap-hw-list" *ngIf="homework.length">
          <div class="ap-hw-row" *ngFor="let h of homework">
            <div class="ap-hw-info">
              <div class="ap-hw-title">{{ h.title || h.description }}</div>
              <div class="ap-hw-meta">{{ getClassName(h.class_id) }} · Due: {{ h.due_date | date:'dd MMM' }}</div>
            </div>
            <button class="ap-btn-del" (click)="deleteHomework(h.id)">🗑️</button>
          </div>
        </div>
        <div class="ap-empty" *ngIf="!homework.length">{{ i18n.isEn ? 'No homework assigned' : 'কোনো হোমওয়ার্ক নেই' }}</div>
      </div>
      <div class="ap-modal-bg" *ngIf="hwModal" (click)="hwModal=false">
        <div class="ap-modal" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>Assign Homework</h2><button class="ap-modal-close" (click)="hwModal=false">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingHw">
            <div class="ap-form-group"><label>Class *</label><select class="ap-input" [(ngModel)]="editingHw.class_id"><option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }}</option></select></div>
            <div class="ap-form-group"><label>Subject</label><select class="ap-input" [(ngModel)]="editingHw.subject_id"><option *ngFor="let s of subjects" [value]="s.id">{{ s.subject_name }}</option></select></div>
            <div class="ap-form-group"><label>Teacher</label><select class="ap-input" [(ngModel)]="editingHw.teacher_id"><option *ngFor="let t of teachers" [value]="t.id">{{ t.name_en }}</option></select></div>
            <div class="ap-form-group"><label>Due Date</label><input type="date" class="ap-input" [(ngModel)]="editingHw.due_date"></div>
            <div class="ap-form-group span2"><label>Description *</label><textarea class="ap-input ap-textarea" [(ngModel)]="editingHw.description" rows="3"></textarea></div>
          </div>
          <div class="ap-modal-foot"><button class="ap-btn-ghost" (click)="hwModal=false">Cancel</button><button class="ap-btn-primary" (click)="saveHomework()">Save</button></div>
        </div>
      </div>
    </section>

    <!-- ═══ TRANSPORT ═══ -->
    <section *ngIf="activeSection==='transport'" class="ap-section">
      <div class="ap-page-head">
        <h1>🚌 {{ i18n.isEn ? 'Transport' : 'পরিবহন' }}</h1>
        <button class="ap-btn-primary" (click)="openTransportModal()">+ Route</button>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr><th>Route</th><th>Driver</th><th>Vehicle</th><th>Capacity</th><th>Fee/Mo</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let r of transport">
              <td><div class="ap-cell-title">{{ r.route_name }}</div><div class="ap-cell-sub">{{ r.route_name_bn }}</div></td>
              <td>{{ r.driver_name }}</td>
              <td>{{ r.vehicle_number }}</td>
              <td>{{ r.capacity }}</td>
              <td class="ap-mono">৳{{ r.monthly_fee }}</td>
              <td><span class="ap-badge" [class]="r.status==='active' ? 'ap-badge-green' : 'ap-badge-gray'">{{ r.status }}</span></td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="editTransportRoute(r)" title="{{ i18n.isEn ? 'Edit' : 'সম্পাদনা' }}">✏️</button>
                  <button class="ap-btn-del" (click)="deleteTransport(r.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="ap-modal-bg" *ngIf="transportModal" (click)="transportModal=false">
        <div class="ap-modal" (click)="$event.stopPropagation()">
          <div class="ap-modal-head"><h2>{{ editingTransport?.id ? (i18n.isEn ? 'Edit Route' : 'রুট সম্পাদনা') : (i18n.isEn ? 'New Route' : 'নতুন রুট') }}</h2><button class="ap-modal-close" (click)="transportModal=false">✕</button></div>
          <div class="ap-form-grid" *ngIf="editingTransport">
            <div class="ap-form-group"><label>Route Name (EN) *</label><input class="ap-input" [(ngModel)]="editingTransport.route_name"></div>
            <div class="ap-form-group"><label>রুটের নাম</label><input class="ap-input" [(ngModel)]="editingTransport.route_name_bn"></div>
            <div class="ap-form-group"><label>Driver Name</label><input class="ap-input" [(ngModel)]="editingTransport.driver_name"></div>
            <div class="ap-form-group"><label>Driver Phone</label><input class="ap-input" [(ngModel)]="editingTransport.driver_phone"></div>
            <div class="ap-form-group"><label>Vehicle Number</label><input class="ap-input" [(ngModel)]="editingTransport.vehicle_number"></div>
            <div class="ap-form-group"><label>Capacity</label><input type="number" class="ap-input" [(ngModel)]="editingTransport.capacity"></div>
            <div class="ap-form-group"><label>Monthly Fee (৳)</label><input type="number" class="ap-input" [(ngModel)]="editingTransport.monthly_fee"></div>
          </div>
          <div class="ap-modal-foot"><button class="ap-btn-ghost" (click)="transportModal=false">Cancel</button><button class="ap-btn-primary" (click)="saveTransport()">Save</button></div>
        </div>
      </div>
    </section>

    <!-- ═══ HR MANAGEMENT ═══ -->
    <section *ngIf="activeSection==='employees'" class="ap-section">
      <div class="ap-page-head">
        <h1>👔 {{ i18n.isEn ? 'HR Management' : 'কর্মী ব্যবস্থাপনা' }}</h1>
        <button class="ap-btn-primary" (click)="openEmpModal()">+ {{ i18n.isEn ? 'Add Employee' : 'কর্মী যোগ করুন' }}</button>
      </div>
      <div class="ap-toolbar">
        <input class="ap-search" [(ngModel)]="empSearch" [placeholder]="i18n.isEn ? 'Search employees…' : 'কর্মী খুঁজুন…'">
        <select class="ap-input ap-filter" [(ngModel)]="empDeptFilter">
          <option value="">{{ i18n.isEn ? 'All Departments' : 'সব বিভাগ' }}</option>
          <option value="Academic">Academic</option>
          <option value="Administration">Administration</option>
          <option value="Finance">Finance</option>
          <option value="Transport">Transport</option>
          <option value="Support">Support</option>
        </select>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr>
            <th>ID</th><th>{{ i18n.isEn ? 'Photo' : 'ছবি' }}</th>
            <th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th>
            <th>{{ i18n.isEn ? 'Designation' : 'পদ' }}</th>
            <th>{{ i18n.isEn ? 'Department' : 'বিভাগ' }}</th>
            <th>{{ i18n.isEn ? 'Join Date' : 'যোগদান' }}</th>
            <th>{{ i18n.isEn ? 'Salary' : 'বেতন' }}</th>
            <th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th>
            <th>{{ i18n.isEn ? 'Actions' : 'কার্যক্রম' }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let e of filteredEmployees">
              <td class="ap-mono" style="font-size:.8rem">{{ e.emp_id }}</td>
              <td>
                <div class="ap-student-avatar" [style.backgroundImage]="e.photo ? 'url('+e.photo+')' : 'none'">
                  <span *ngIf="!e.photo">{{ e.name_en?.charAt(0) }}</span>
                </div>
              </td>
              <td>
                <div class="ap-cell-title">{{ e.name_en }}</div>
                <div class="ap-cell-sub">{{ e.name_bn }}</div>
              </td>
              <td>{{ e.designation }}</td>
              <td><span class="ap-tag">{{ e.department }}</span></td>
              <td class="ap-muted">{{ e.join_date | date:'dd MMM yyyy' }}</td>
              <td class="ap-mono">৳{{ e.salary | number:'1.0-0' }}</td>
              <td><span class="ap-badge" [class]="e.status==='active' ? 'ap-badge-green' : 'ap-badge-gray'">{{ e.status }}</span></td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="editEmployee(e)">✏️</button>
                  <button class="ap-btn-del" (click)="deleteEmployee(e.id)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="ap-empty" *ngIf="!filteredEmployees.length">{{ i18n.isEn ? 'No employees found' : 'কোনো কর্মী পাওয়া যায়নি' }}</div>
      </div>
      <!-- Employee Modal -->
      <div class="ap-modal-bg" *ngIf="empModal" (click)="empModal=false">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ editingEmp?.id ? (i18n.isEn ? 'Edit Employee' : 'কর্মী সম্পাদনা') : (i18n.isEn ? 'New Employee' : 'নতুন কর্মী') }}</h2>
            <button class="ap-modal-close" (click)="empModal=false">✕</button>
          </div>
          <div class="ap-form-grid" *ngIf="editingEmp">
            <div class="ap-form-group"><label>Employee ID</label><input class="ap-input" [(ngModel)]="editingEmp.emp_id" placeholder="EMP-001 (auto)"></div>
            <div class="ap-form-group"><label>{{ i18n.isEn ? 'Department' : 'বিভাগ' }} *</label>
              <select class="ap-input" [(ngModel)]="editingEmp.department">
                <option value="Academic">Academic</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
                <option value="Transport">Transport</option>
                <option value="Support">Support</option>
              </select>
            </div>
            <div class="ap-form-group"><label>Name (English) *</label><input class="ap-input" [(ngModel)]="editingEmp.name_en"></div>
            <div class="ap-form-group"><label>নাম (বাংলা)</label><input class="ap-input" [(ngModel)]="editingEmp.name_bn"></div>
            <div class="ap-form-group"><label>Designation / পদ *</label><input class="ap-input" [(ngModel)]="editingEmp.designation" placeholder="Teacher, Peon, Driver…"></div>
            <div class="ap-form-group"><label>NID / জাতীয় পরিচয়পত্র</label><input class="ap-input" [(ngModel)]="editingEmp.nid"></div>
            <div class="ap-form-group"><label>Phone / ফোন</label><input class="ap-input" [(ngModel)]="editingEmp.phone"></div>
            <div class="ap-form-group"><label>Email</label><input class="ap-input" [(ngModel)]="editingEmp.email"></div>
            <div class="ap-form-group"><label>Join Date / যোগদান তারিখ</label><input type="date" class="ap-input" [(ngModel)]="editingEmp.join_date"></div>
            <div class="ap-form-group"><label>Salary (৳) / বেতন</label><input type="number" class="ap-input" [(ngModel)]="editingEmp.salary"></div>
            <div class="ap-form-group"><label>Status / স্ট্যাটাস</label>
              <select class="ap-input" [(ngModel)]="editingEmp.status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div class="ap-form-group span2"><label>Address / ঠিকানা</label><input class="ap-input" [(ngModel)]="editingEmp.address"></div>
            <div class="ap-form-group span2">
              <label>Photo / ছবি</label>
              <input type="file" accept="image/*" (change)="onEmpPhoto($event)" class="ap-file-input">
              <div class="ap-image-preview" *ngIf="editingEmp.photo">
                <img [src]="editingEmp.photo" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:3px solid var(--dark)">
                <button class="ap-clear-img" (click)="editingEmp.photo=null">✕</button>
              </div>
            </div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="empModal=false">Cancel</button>
            <button class="ap-btn-primary" (click)="saveEmployee()">{{ i18n.isEn ? 'Save' : 'সংরক্ষণ' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ HR ATTENDANCE ═══ -->
    <section *ngIf="activeSection==='hr-attendance'" class="ap-section">
      <div class="ap-page-head">
        <h1>📋 {{ i18n.isEn ? 'Employee Attendance' : 'কর্মী উপস্থিতি' }}</h1>
      </div>
      <!-- View switcher -->
      <div class="ap-tab-bar" style="margin-bottom:1.5rem">
        <button [class.active]="hrAttView==='take'" (click)="hrAttView='take';loadHrAtt()">📝 উপস্থিতি নিন</button>
        <button [class.active]="hrAttView==='summary'" (click)="hrAttView='summary';loadHrAttSummary()">📊 মাসিক সারসংক্ষেপ</button>
        <button [class.active]="hrAttView==='report'" (click)="hrAttView='report';loadHrAttReport()">📄 রিপোর্ট</button>
      </div>

      <!-- TAKE ATTENDANCE -->
      <div *ngIf="hrAttView==='take'">
        <div class="ap-toolbar" style="gap:1rem;margin-bottom:1rem">
          <div>
            <label style="font-size:.8rem;color:#666">তারিখ</label>
            <input type="date" class="ap-input" [(ngModel)]="hrAttDate" (change)="loadHrAtt()" style="width:180px">
          </div>
          <div>
            <label style="font-size:.8rem;color:#666">বিভাগ</label>
            <select class="ap-input" [(ngModel)]="hrAttDept" (change)="loadHrAtt()" style="width:180px">
              <option value="">সব বিভাগ</option>
              <option value="Academic">Academic</option>
              <option value="Administration">Administration</option>
              <option value="Finance">Finance</option>
              <option value="Transport">Transport</option>
              <option value="Support">Support</option>
            </select>
          </div>
          <button class="ap-btn-primary" (click)="markAllHrPresent()" style="margin-top:1.2rem">✓ সকলে উপস্থিত</button>
          <button class="ap-btn-secondary" (click)="saveHrAtt()" style="margin-top:1.2rem">💾 সংরক্ষণ করুন</button>
        </div>
        <div class="ap-card">
          <div *ngFor="let e of hrAttList" class="ap-att-row">
            <div class="ap-att-info">
              <div class="ap-student-avatar" style="width:36px;height:36px;font-size:.85rem" [style.backgroundImage]="e.photo ? 'url('+e.photo+')' : 'none'">
                <span *ngIf="!e.photo">{{ e.name_en?.charAt(0) }}</span>
              </div>
              <div>
                <strong>{{ e.name_en }}</strong>
                <div style="font-size:.8rem;color:#666">{{ e.emp_id }} · {{ e.department }} · {{ e.designation }}</div>
              </div>
            </div>
            <div class="ap-att-btns">
              <button class="ap-att-btn present" [class.selected]="e.status==='present'" (click)="e.status='present'">উপস্থিত</button>
              <button class="ap-att-btn absent" [class.selected]="e.status==='absent'" (click)="e.status='absent'">অনুপস্থিত</button>
              <button class="ap-att-btn late" [class.selected]="e.status==='late'" (click)="e.status='late'">দেরিতে</button>
            </div>
          </div>
          <div class="ap-empty" *ngIf="!hrAttList.length">কোনো কর্মী পাওয়া যায়নি</div>
        </div>
        <div class="ap-att-saved-msg" *ngIf="hrAttSaved">✅ উপস্থিতি সংরক্ষিত হয়েছে!</div>
      </div>

      <!-- MONTHLY SUMMARY -->
      <div *ngIf="hrAttView==='summary'">
        <div class="ap-toolbar" style="gap:1rem;margin-bottom:1rem">
          <div>
            <label style="font-size:.8rem;color:#666">মাস</label>
            <input type="month" class="ap-input" [(ngModel)]="hrAttReportMonth" (change)="loadHrAttSummary()" style="width:180px">
          </div>
        </div>
        <div class="ap-card" style="overflow-x:auto">
          <table class="ap-table">
            <thead><tr><th>ID</th><th>নাম</th><th>বিভাগ</th><th style="color:green">উপস্থিত</th><th style="color:orange">দেরি</th><th style="color:red">অনুপস্থিত</th><th>মোট</th></tr></thead>
            <tbody>
              <tr *ngFor="let s of hrAttSummary">
                <td class="ap-mono" style="font-size:.8rem">{{ s.emp_id }}</td>
                <td><strong>{{ s.name_en }}</strong></td>
                <td><span class="ap-tag">{{ s.department }}</span></td>
                <td style="color:green;font-weight:600;text-align:center">{{ s.present }}</td>
                <td style="color:orange;font-weight:600;text-align:center">{{ s.late }}</td>
                <td style="color:red;font-weight:600;text-align:center">{{ s.absent }}</td>
                <td style="text-align:center">{{ s.total }}</td>
              </tr>
            </tbody>
          </table>
          <div class="ap-empty" *ngIf="!hrAttSummary.length">কোনো রেকর্ড পাওয়া যায়নি</div>
        </div>
      </div>

      <!-- ATTENDANCE REPORT -->
      <div *ngIf="hrAttView==='report'">
        <div class="ap-toolbar" style="gap:1rem;margin-bottom:1rem">
          <div>
            <label style="font-size:.8rem;color:#666">মাস</label>
            <input type="month" class="ap-input" [(ngModel)]="hrAttReportMonth" (change)="loadHrAttReport()" style="width:180px">
          </div>
          <div>
            <label style="font-size:.8rem;color:#666">কর্মী</label>
            <select class="ap-input" [(ngModel)]="hrAttEmpFilter" (change)="loadHrAttReport()" style="width:220px">
              <option value="">সকল কর্মী</option>
              <option *ngFor="let e of employees" [value]="e.id">{{ e.name_en }} ({{ e.emp_id }})</option>
            </select>
          </div>
        </div>
        <div class="ap-card" style="overflow-x:auto">
          <table class="ap-table">
            <thead><tr><th>তারিখ</th><th>নাম</th><th>বিভাগ</th><th>স্ট্যাটাস</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of hrAttReport">
                <td class="ap-mono">{{ r.date | date:'dd MMM yyyy' }}</td>
                <td>{{ r.name_en }}</td>
                <td><span class="ap-tag">{{ r.department }}</span></td>
                <td><span class="ap-att-status" [class]="r.status">{{ r.status === 'present' ? 'উপস্থিত' : r.status === 'absent' ? 'অনুপস্থিত' : 'দেরিতে' }}</span></td>
              </tr>
            </tbody>
          </table>
          <div class="ap-empty" *ngIf="!hrAttReport.length">কোনো রিপোর্ট পাওয়া যায়নি</div>
        </div>
      </div>
    </section>

    <!-- ═══ USERS ═══ -->
    <section *ngIf="activeSection==='users'" class="ap-section">
      <div class="ap-page-head">
        <h1>👥 {{ i18n.isEn ? 'Users & Role Permissions' : 'ব্যবহারকারী ও ভূমিকা' }}</h1>
        <button class="ap-btn-primary" (click)="openUserModal()">+ {{ i18n.isEn ? 'Create User' : 'ব্যবহারকারী তৈরি করুন' }}</button>
      </div>
      <div class="ap-role-legend">
        <span class="ap-role-chip role-admin">👑 Admin</span>
        <span class="ap-role-chip role-teacher">👨‍🏫 Teacher</span>
        <span class="ap-role-chip role-student">👨‍🎓 Student</span>
        <span class="ap-role-chip role-parent">👪 Parent</span>
        <span class="ap-role-chip role-staff">🧑‍💼 Staff</span>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr><th>{{ i18n.isEn ? 'Username' : 'ইউজারনেম' }}</th><th>{{ i18n.isEn ? 'Full Name' : 'পুরো নাম' }}</th><th>Email</th><th>Role</th><th>Status</th><th>{{ i18n.isEn ? 'Created' : 'তৈরি' }}</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let u of users">
              <td class="ap-mono">{{ u.username }}</td>
              <td>{{ u.full_name || '—' }}</td>
              <td class="ap-muted">{{ u.email }}</td>
              <td><span class="ap-role-chip role-{{ u.role }}">{{ u.role }}</span></td>
              <td><span class="ap-badge" [class]="u.is_active ? 'ap-badge-green' : 'ap-badge-gray'">{{ u.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td class="ap-muted">{{ u.created_at | date:'dd MMM yyyy' }}</td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-edit" (click)="editUser(u)" title="{{ i18n.isEn ? 'Edit' : 'সম্পাদনা' }}">✏️</button>
                  <button class="ap-btn-sm" style="background:#7c3aed;color:#fff;border-radius:6px;padding:.3rem .5rem;border:none;cursor:pointer;font-size:.82rem" (click)="openResetCred(u)" title="{{ i18n.isEn ? 'Reset Password' : 'পাসওয়ার্ড রিসেট' }}">🔑</button>
                  <button class="ap-btn-del" (click)="deleteUser(u.id)" [disabled]="u.id === currentUserId">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- User Modal -->
      <div class="ap-modal-bg" *ngIf="userModal" (click)="closeUserModal()">
        <div class="ap-modal ap-modal-lg" (click)="$event.stopPropagation()">
          <div class="ap-modal-head">
            <h2>{{ editingUser?.id ? (i18n.isEn ? 'Edit User' : 'ব্যবহারকারী সম্পাদনা') : (i18n.isEn ? 'Create User' : 'নতুন ব্যবহারকারী') }}</h2>
            <button class="ap-modal-close" (click)="closeUserModal()">✕</button>
          </div>
          <div class="ap-form-grid" *ngIf="editingUser">
            <div class="ap-form-group"><label>Username *</label><input class="ap-input" [(ngModel)]="editingUser.username" [disabled]="!!editingUser.id"></div>
            <div class="ap-form-group"><label>Base Role *</label>
              <select class="ap-input" [(ngModel)]="editingUser.role">
                <option value="admin">👑 Admin (Full Access)</option>
                <option value="teacher">👨‍🏫 Teacher</option>
                <option value="student">👨‍🎓 Student</option>
                <option value="parent">👪 Parent</option>
                <option value="staff">🧑‍💼 Staff</option>
              </select>
            </div>
            <div class="ap-form-group"><label>Full Name / পুরো নাম</label><input class="ap-input" [(ngModel)]="editingUser.full_name"></div>
            <div class="ap-form-group"><label>Email</label><input class="ap-input" type="email" [(ngModel)]="editingUser.email"></div>
            <div class="ap-form-group"><label>Phone</label><input class="ap-input" [(ngModel)]="editingUser.phone"></div>
            <div class="ap-form-group"><label>Status</label>
              <select class="ap-input" [(ngModel)]="editingUser.is_active">
                <option [ngValue]="true">✅ Active</option>
                <option [ngValue]="false">🚫 Inactive</option>
              </select>
            </div>
            <div class="ap-form-group span2">
              <label>{{ editingUser.id ? 'New Password (leave blank to keep)' : 'Password *' }}</label>
              <input class="ap-input" type="password" [(ngModel)]="editingUser.password" [placeholder]="editingUser.id ? 'Leave blank to keep current' : 'Enter password'">
            </div>
          </div>
          <!-- Module Access Permissions -->
          <div class="ap-perm-section" *ngIf="editingUser">
            <div class="ap-perm-title">{{ i18n.isEn ? 'Module Access (additional privileges)' : 'মডিউল অ্যাক্সেস (অতিরিক্ত সুবিধা)' }}</div>
            <div class="ap-perm-modules">
              <div class="ap-perm-module" *ngFor="let m of moduleList">
                <div class="ap-perm-module-head">
                  <label class="ap-perm-module-label">
                    <input type="checkbox"
                      [checked]="isModuleFullyChecked(m)"
                      [indeterminate]="isModulePartiallyChecked(m)"
                      (change)="toggleModule(m, $event)">
                    <span class="ap-perm-module-icon">{{ m.icon }}</span>
                    <strong>{{ i18n.isEn ? m.labelEn : m.labelBn }}</strong>
                  </label>
                </div>
                <div class="ap-perm-features">
                  <label class="ap-perm-feature" *ngFor="let f of m.features">
                    <input type="checkbox" [checked]="hasPermission(f.key)" (change)="togglePermission(f.key, $event)">
                    <span>{{ i18n.isEn ? f.labelEn : f.labelBn }}</span>
                  </label>
                </div>
              </div>
            </div>
            <div class="ap-perm-note">* Admin role always has full access. These checkboxes grant specific module/feature access to other roles.</div>
          </div>
          <div class="ap-modal-foot">
            <button class="ap-btn-ghost" (click)="closeUserModal()">{{ i18n.isEn ? 'Cancel' : 'বাতিল' }}</button>
            <button class="ap-btn-primary" (click)="saveUser()">{{ i18n.isEn ? 'Save' : 'সংরক্ষণ' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ ADMISSIONS ═══ -->
    <section *ngIf="activeSection==='admissions'" class="ap-section">
      <div class="ap-page-head">
        <h1>📝 {{ i18n.isEn ? 'Admission Management' : 'ভর্তি ব্যবস্থাপনা' }}</h1>
        <div style="display:flex;gap:.5rem;align-items:center">
          <select class="ap-input" style="width:auto" [(ngModel)]="admissionFilter" (change)="loadAdmissions()">
            <option value="all">{{ i18n.isEn ? 'All Applications' : 'সকল আবেদন' }}</option>
            <option value="pending">⏳ {{ i18n.isEn ? 'Pending' : 'অপেক্ষমান' }}</option>
            <option value="approved">✅ {{ i18n.isEn ? 'Approved' : 'অনুমোদিত' }}</option>
            <option value="rejected">❌ {{ i18n.isEn ? 'Rejected' : 'প্রত্যাখ্যাত' }}</option>
            <option value="admitted">🎓 {{ i18n.isEn ? 'Admitted' : 'ভর্তিকৃত' }}</option>
          </select>
        </div>
      </div>
      <!-- Summary bar -->
      <div class="ap-stat-grid" style="margin-bottom:1.25rem">
        <div class="ap-stat-card" style="border-color:#D4911A">
          <div class="ap-stat-icon">📋</div>
          <div class="ap-stat-val">{{ admissionStats.total }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Total' : 'মোট আবেদন' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#f59e0b">
          <div class="ap-stat-icon">⏳</div>
          <div class="ap-stat-val">{{ admissionStats.pending }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Pending' : 'অপেক্ষমান' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#059669">
          <div class="ap-stat-icon">✅</div>
          <div class="ap-stat-val">{{ admissionStats.approved }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Approved' : 'অনুমোদিত' }}</div>
        </div>
        <div class="ap-stat-card" style="border-color:#1a5c8a">
          <div class="ap-stat-icon">🎓</div>
          <div class="ap-stat-val">{{ admissionStats.admitted }}</div>
          <div class="ap-stat-lbl">{{ i18n.isEn ? 'Admitted' : 'ভর্তিকৃত' }}</div>
        </div>
      </div>

      <div class="ap-card">
        <table class="ap-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ i18n.isEn ? 'Student Name' : 'শিক্ষার্থীর নাম' }}</th>
              <th>{{ i18n.isEn ? 'Class' : 'শ্রেণী' }}</th>
              <th>{{ i18n.isEn ? 'Gender' : 'লিঙ্গ' }}</th>
              <th>{{ i18n.isEn ? 'Guardian' : 'অভিভাবক' }}</th>
              <th>{{ i18n.isEn ? 'Phone' : 'ফোন' }}</th>
              <th>{{ i18n.isEn ? 'Applied' : 'আবেদনের তারিখ' }}</th>
              <th>Status</th>
              <th>{{ i18n.isEn ? 'Actions' : 'কার্যক্রম' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of admissions; let i = index">
              <td class="ap-muted">{{ i + 1 }}</td>
              <td>
                <strong>{{ a.student_name_en }}</strong>
                <div class="ap-muted" style="font-size:.78rem">{{ a.student_name_bn }}</div>
              </td>
              <td><span class="ap-tag">{{ a.class_applying }}</span></td>
              <td>{{ a.gender || '—' }}</td>
              <td>{{ a.guardian_name || '—' }}</td>
              <td class="ap-mono">{{ a.guardian_phone }}</td>
              <td class="ap-muted">{{ a.applied_at | date:'dd MMM yyyy' }}</td>
              <td>
                <span class="ap-badge" [ngClass]="{
                  'ap-badge-yellow': a.status==='pending',
                  'ap-badge-green': a.status==='approved',
                  'ap-badge-red': a.status==='rejected',
                  'ap-badge-blue': a.status==='admitted'
                }">
                  {{ a.status==='pending' ? 'অপেক্ষমান' : a.status==='approved' ? 'অনুমোদিত' : a.status==='rejected' ? 'প্রত্যাখ্যাত' : 'ভর্তিকৃত' }}
                </span>
              </td>
              <td>
                <div class="ap-action-row">
                  <button class="ap-btn-sm ap-btn-view" (click)="viewAdmission(a)" title="বিস্তারিত">👁️</button>
                  <button class="ap-btn-sm" style="background:#059669;color:#fff" (click)="updateAdmissionStatus(a.id,'approved')" *ngIf="a.status==='pending'" title="অনুমোদন">✅</button>
                  <button class="ap-btn-sm" style="background:#1a5c8a;color:#fff" (click)="updateAdmissionStatus(a.id,'admitted')" *ngIf="a.status==='approved'" title="ভর্তি">🎓</button>
                  <button class="ap-btn-sm ap-btn-del" (click)="updateAdmissionStatus(a.id,'rejected')" *ngIf="a.status==='pending' || a.status==='approved'" title="প্রত্যাখ্যান">❌</button>
                  <button class="ap-btn-del" (click)="deleteAdmission(a.id)" title="মুছুন">🗑️</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!admissions.length">
              <td colspan="9" style="text-align:center;padding:2rem;color:var(--muted)">{{ i18n.isEn ? 'No applications found.' : 'কোনো আবেদন পাওয়া যায়নি।' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- View Application Modal -->
      <div class="ap-modal-bg" *ngIf="viewingAdmission" (click)="viewingAdmission=null">
        <div class="ap-modal" (click)="$event.stopPropagation()" style="max-width:520px">
          <div class="ap-modal-head">
            <h2>📋 {{ i18n.isEn ? 'Application Details' : 'আবেদনের বিস্তারিত' }}</h2>
            <button class="ap-modal-close" (click)="viewingAdmission=null">✕</button>
          </div>
          <div *ngIf="viewingAdmission" style="padding:.5rem 0">
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Name (EN)' : 'নাম (ইংরেজি)' }}</span><strong>{{ viewingAdmission.student_name_en }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Name (BN)' : 'নাম (বাংলা)' }}</span><strong>{{ viewingAdmission.student_name_bn || '—' }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Date of Birth' : 'জন্ম তারিখ' }}</span><strong>{{ (viewingAdmission.date_of_birth | date:'dd MMM yyyy') || '—' }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Gender' : 'লিঙ্গ' }}</span><strong>{{ viewingAdmission.gender || '—' }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Class Applying' : 'ভর্তিচ্ছু শ্রেণী' }}</span><strong>{{ viewingAdmission.class_applying }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Guardian Name' : 'অভিভাবকের নাম' }}</span><strong>{{ viewingAdmission.guardian_name || '—' }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Phone' : 'ফোন' }}</span><strong>{{ viewingAdmission.guardian_phone }}</strong></div>
            <div class="ap-pf-row"><span>Email</span><strong>{{ viewingAdmission.guardian_email || '—' }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Address' : 'ঠিকানা' }}</span><strong>{{ viewingAdmission.address || '—' }}</strong></div>
            <div class="ap-pf-row"><span>{{ i18n.isEn ? 'Applied' : 'আবেদনের তারিখ' }}</span><strong>{{ viewingAdmission.applied_at | date:'dd MMM yyyy, hh:mm a' }}</strong></div>
            <div class="ap-pf-row"><span>Status</span>
              <span class="ap-badge" [ngClass]="{'ap-badge-yellow': viewingAdmission.status==='pending','ap-badge-green': viewingAdmission.status==='approved','ap-badge-red': viewingAdmission.status==='rejected','ap-badge-blue': viewingAdmission.status==='admitted'}">
                {{ viewingAdmission.status }}
              </span>
            </div>
            <div class="ap-pf-row" *ngIf="viewingAdmission.notes"><span>{{ i18n.isEn ? 'Notes' : 'মন্তব্য' }}</span><strong>{{ viewingAdmission.notes }}</strong></div>
          </div>
          <div class="ap-modal-foot" style="gap:.5rem;flex-wrap:wrap">
            <button class="ap-btn-ghost" (click)="viewingAdmission=null">{{ i18n.isEn ? 'Close' : 'বন্ধ' }}</button>
            <button class="ap-btn-primary" style="background:#059669" (click)="updateAdmissionStatus(viewingAdmission.id,'approved');viewingAdmission=null" *ngIf="viewingAdmission.status==='pending'">✅ {{ i18n.isEn ? 'Approve' : 'অনুমোদন' }}</button>
            <button class="ap-btn-primary" style="background:#1a5c8a" (click)="updateAdmissionStatus(viewingAdmission.id,'admitted');viewingAdmission=null" *ngIf="viewingAdmission.status==='approved'">🎓 {{ i18n.isEn ? 'Admit' : 'ভর্তি করুন' }}</button>
            <button class="ap-btn-primary" style="background:#c0392b" (click)="updateAdmissionStatus(viewingAdmission.id,'rejected');viewingAdmission=null" *ngIf="viewingAdmission.status==='pending'||viewingAdmission.status==='approved'">❌ {{ i18n.isEn ? 'Reject' : 'প্রত্যাখ্যান' }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Reset Credentials Modal -->
    <div class="ap-modal-bg" *ngIf="resetCredModal" (click)="closeResetCred()">
      <div class="ap-modal" (click)="$event.stopPropagation()" style="max-width:420px">
        <div class="ap-modal-head">
          <h2>🔑 {{ i18n.isEn ? 'Reset Credentials' : 'পাসওয়ার্ড/ইউজারনেম রিসেট' }}</h2>
          <button class="ap-modal-close" (click)="closeResetCred()">✕</button>
        </div>
        <div *ngIf="resetCredUser" style="padding:.25rem 0">
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'Username' : 'ইউজারনেম' }}</label>
            <input class="ap-input" [(ngModel)]="resetCredUser.newUsername" [placeholder]="resetCredUser.username">
          </div>
          <div class="ap-form-group">
            <label>{{ i18n.isEn ? 'New Password *' : 'নতুন পাসওয়ার্ড *' }}</label>
            <input class="ap-input" type="password" [(ngModel)]="resetCredUser.newPassword" placeholder="{{ i18n.isEn ? 'Enter new password' : 'নতুন পাসওয়ার্ড লিখুন' }}">
          </div>
          <p style="font-size:.78rem;color:var(--muted);margin:.25rem 0 .75rem">{{ i18n.isEn ? 'Leave username blank to keep current. Password is required.' : 'ইউজারনেম ফাঁকা রাখলে পরিবর্তন হবে না। পাসওয়ার্ড আবশ্যক।' }}</p>
        </div>
        <div class="ap-modal-foot">
          <button class="ap-btn-ghost" (click)="closeResetCred()">{{ i18n.isEn ? 'Cancel' : 'বাতিল' }}</button>
          <button class="ap-btn-primary" (click)="saveResetCred()">{{ i18n.isEn ? 'Reset' : 'রিসেট করুন' }}</button>
        </div>
      </div>
    </div>

  </main>
</div>
  `,
  styles: [`
    :host {
      --dark: #1A4731;
      --accent: #D4911A;
      --ground: #F7F5EC;
      --text: #1C2A1D;
      --muted: #6B7A5E;
      --border: rgba(28,42,29,0.1);
      --bg: #F0F2F5;
      display: block;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .ap-wrap { display: flex; min-height: 100vh; }

    /* ── SIDEBAR ── */
    .ap-sidebar {
      width: 220px;
      background: var(--dark);
      color: rgba(255,255,255,0.8);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .ap-brand { padding: 1.25rem 1rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .ap-logo { font-size: 1.6rem; margin-bottom: 0.2rem; }
    .ap-school { font-family: 'Noto Serif Bengali', serif; font-weight: 700; font-size: 0.88rem; }
    .ap-role-badge { display: inline-block; margin-top: 0.3rem; background: rgba(212,145,26,0.25); color: var(--accent); font-size: 0.65rem; padding: 0.1rem 0.5rem; border-radius: 2rem; letter-spacing: 0.05em; }
    .ap-nav { padding: 0.5rem 0.5rem; flex: 1; display: flex; flex-direction: column; }
    .ap-nav-section { font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.35); padding: 0.75rem 0.75rem 0.25rem; font-family: 'DM Sans', sans-serif; }
    .ap-nav button { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; border-radius: 5px; background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 0.82rem; text-align: left; transition: all 0.15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .ap-nav button:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .ap-nav button.active { background: rgba(255,255,255,0.13); color: #fff; font-weight: 600; }
    .ap-sidebar-foot { padding: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .ap-user-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem; }
    .ap-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(212,145,26,0.3); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .ap-uname { font-size: 0.8rem; font-weight: 600; color: #fff; }
    .ap-urole { font-size: 0.65rem; color: rgba(255,255,255,0.45); }
    .ap-foot-actions { display: flex; gap: 0.35rem; }
    .ap-action-btn { flex: 1; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.7); padding: 0.3rem 0.4rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; transition: all 0.15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .ap-action-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .ap-logout:hover { background: rgba(220,53,69,0.3); border-color: rgba(220,53,69,0.4); }

    /* ── MAIN ── */
    .ap-main { flex: 1; background: var(--bg); overflow-y: auto; }
    .ap-section { padding: 1.75rem 2rem; max-width: 1100px; }
    .ap-page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .ap-page-head h1 { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 700; color: var(--text); }
    .ap-date { font-size: 0.8rem; color: var(--muted); font-family: 'DM Sans', sans-serif; }

    /* ── STATS ── */
    .ap-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .ap-stat-card { background: #fff; border-radius: 10px; padding: 1.25rem; border-left: 4px solid; display: flex; flex-direction: column; gap: 0.25rem; }
    .ap-stat-icon { font-size: 1.4rem; }
    .ap-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 700; color: var(--text); line-height: 1; }
    .ap-stat-lbl { font-size: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; }
    .ap-quick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .ap-quick-card { background: #fff; border-radius: 8px; padding: 1rem; display: flex; align-items: center; gap: 0.6rem; cursor: pointer; transition: all 0.15s; border: 1px solid var(--border); }
    .ap-quick-card:hover { background: var(--dark); color: #fff; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(26,71,49,0.2); }
    .ap-quick-card:hover .ap-quick-label { color: rgba(255,255,255,0.9); }
    .ap-quick-card:hover .ap-quick-arrow { color: var(--accent); }
    .ap-quick-icon { font-size: 1.2rem; }
    .ap-quick-label { flex: 1; font-size: 0.82rem; font-weight: 500; color: var(--text); font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .ap-quick-arrow { color: var(--muted); font-size: 0.9rem; }

    /* ── CARDS / TABLES ── */
    .ap-card { background: #fff; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; overflow-x: auto; }
    .ap-table { width: 100%; border-collapse: collapse; min-width: 500px; }
    .ap-table th { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--border); text-align: left; font-family: 'DM Sans', sans-serif; }
    .ap-table td { padding: 0.7rem 0.75rem; font-size: 0.85rem; border-bottom: 1px solid var(--border); color: var(--text); }
    .ap-table tr:last-child td { border-bottom: none; }
    .ap-table tr:hover td { background: rgba(26,71,49,0.03); }
    .ap-cell-title { font-weight: 600; }
    .ap-cell-sub { font-size: 0.75rem; color: var(--muted); margin-top: 0.1rem; }
    .ap-muted { color: var(--muted) !important; font-size: 0.8rem !important; font-family: 'DM Sans', sans-serif; }
    .ap-mono { font-family: 'DM Sans', monospace; }
    .ap-empty { text-align: center; padding: 2.5rem; color: var(--muted); font-size: 0.875rem; }
    .ap-success { background: #D1FAE5; color: #065F46; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-top: 1rem; }

    /* ── BADGES / TAGS ── */
    .ap-badge { font-size: 0.68rem; padding: 0.18rem 0.55rem; border-radius: 2rem; font-weight: 600; font-family: 'DM Sans', sans-serif; letter-spacing: 0.03em; }
    .ap-badge-green { background: #D1FAE5; color: #065F46; }
    .ap-badge-gray { background: #F3F4F6; color: #6B7280; }
    .ap-badge-red { background: #FEE2E2; color: #991B1B; }
    .ap-badge-yellow { background: #FEF3C7; color: #92400E; }
    .ap-badge-blue { background: #DBEAFE; color: #1E40AF; }
    .ap-tag { font-size: 0.68rem; padding: 0.15rem 0.5rem; border-radius: 3px; background: rgba(26,71,49,0.08); color: var(--dark); font-family: 'DM Sans', sans-serif; }
    .ap-tag-exam { background: #FEF3C7; color: #92400E; }
    .ap-tag-event { background: #EDE9FE; color: #5B21B6; }
    .ap-tag-fee { background: #D1FAE5; color: #065F46; }
    .ap-tag-holiday { background: #F3F4F6; color: #374151; }

    /* ── ROLES ── */
    .ap-role-chip { font-size: 0.72rem; padding: 0.2rem 0.65rem; border-radius: 2rem; font-family: 'DM Sans', sans-serif; font-weight: 600; }
    .role-admin { background: #FEF3C7; color: #92400E; }
    .role-teacher { background: #DBEAFE; color: #1E40AF; }
    .role-student { background: #D1FAE5; color: #065F46; }
    .role-parent { background: #EDE9FE; color: #5B21B6; }
    .ap-role-legend { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }

    /* ── FORMS ── */
    .ap-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .ap-form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .span2 { grid-column: 1 / -1; }
    label { font-size: 0.78rem; font-weight: 600; color: var(--text); }
    .ap-input { padding: 0.55rem 0.75rem; border: 1.5px solid var(--border); border-radius: 6px; font-size: 0.875rem; background: var(--ground); color: var(--text); font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; outline: none; width: 100%; box-sizing: border-box; }
    .ap-input:focus { border-color: var(--dark); }
    .ap-textarea { resize: vertical; min-height: 80px; }
    .ap-file-input { padding: 0.4rem 0; font-size: 0.8rem; color: var(--muted); }
    .ap-image-preview { margin-top: 0.5rem; position: relative; display: inline-block; }
    .ap-image-preview img { max-width: 100%; max-height: 200px; border-radius: 6px; border: 1px solid var(--border); object-fit: cover; display: block; }
    .ap-clear-img { margin-top: 0.35rem; background: #FEE2E2; color: #991B1B; border: none; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }

    /* ── BUTTONS ── */
    .ap-btn-primary { background: var(--dark); color: #fff; border: none; padding: 0.55rem 1.1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .ap-btn-primary:hover { background: #0f3020; }
    .ap-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .ap-btn-ghost { background: transparent; border: 1.5px solid var(--border); color: var(--text); padding: 0.55rem 1rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .ap-btn-ghost:hover { background: var(--border); }
    .ap-btn-sm { padding: 0.35rem 0.75rem; font-size: 0.78rem; border-radius: 5px; border: 1.5px solid var(--border); background: #fff; color: var(--text); cursor: pointer; font-family: 'DM Sans', sans-serif; }
    .ap-btn-sm:hover { background: var(--ground); }
    .ap-action-row { display: flex; gap: 0.35rem; }
    .ap-btn-edit, .ap-btn-del, .ap-btn-toggle { width: 30px; height: 30px; border-radius: 5px; border: none; cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .ap-btn-edit { background: #DBEAFE; }
    .ap-btn-edit:hover { background: #BFDBFE; }
    .ap-btn-del { background: #FEE2E2; }
    .ap-btn-del:hover { background: #FECACA; }
    .ap-btn-del:disabled { opacity: 0.3; cursor: not-allowed; }
    .ap-btn-toggle { background: #D1FAE5; }
    .ap-btn-del-sm { background: #FEE2E2; border: none; border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer; font-size: 0.75rem; }

    /* ── TOOLBAR ── */
    .ap-toolbar { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .ap-search { flex: 1; min-width: 180px; padding: 0.5rem 0.75rem; border: 1.5px solid var(--border); border-radius: 6px; font-size: 0.875rem; background: #fff; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; outline: none; }
    .ap-search:focus { border-color: var(--dark); }
    .ap-filter { width: auto; }
    .ap-filter-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; align-items: center; }

    /* ── MODAL ── */
    .ap-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .ap-modal { background: #fff; border-radius: 12px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.25); }
    .ap-modal-lg { max-width: 720px; }
    .ap-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem 0; margin-bottom: 1rem; }
    .ap-modal-head h2 { font-family: 'Noto Serif Bengali', serif; font-size: 1.15rem; font-weight: 700; color: var(--text); }
    .ap-modal-close { background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--muted); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .ap-modal-close:hover { background: #F3F4F6; }
    .ap-modal .ap-form-grid { padding: 0 1.5rem; }
    .ap-modal-foot { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem 1.25rem; border-top: 1px solid var(--border); margin-top: 1rem; }

    /* ── ATTENDANCE ── */
    .ap-att-header { display: flex; align-items: center; gap: 1rem; padding: 0.4rem 0.75rem; font-size: 0.78rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); margin-bottom: .4rem; }
    .ap-att-row { display: flex; align-items: center; gap: 1rem; padding: 0.65rem 0.75rem; border-radius: 6px; margin-bottom: 0.25rem; transition: background .12s; }
    .ap-att-row:hover { background: var(--ground); }
    .ap-att-even { background: rgba(0,0,0,.018); }
    .ap-att-roll { width: 60px; font-size: 0.9rem; font-weight: 700; color: var(--primary); flex-shrink: 0; }
    .ap-att-name { flex: 1; font-size: 0.875rem; font-weight: 600; color: var(--text); display: flex; flex-direction: column; gap: .1rem; }
    .ap-att-name small { font-size: .78rem; font-weight: 400; }
    .ap-att-summary { margin-top: .75rem; padding: .5rem .75rem; background: var(--ground); border-radius: 6px; font-size: .8rem; color: var(--muted); }
    .ap-radio-group { display: flex; gap: 0.4rem; width: 280px; flex-shrink: 0; }
    .ap-radio-chip { display: flex; align-items: center; gap: 0.25rem; padding: 0.2rem 0.6rem; border-radius: 2rem; font-size: 0.72rem; cursor: pointer; border: 1.5px solid; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
    .ap-radio-chip input { display: none; }
    .ap-radio-chip.green { border-color: #1A4731; color: #1A4731; }
    .ap-radio-chip.green.checked { background: #D1FAE5; }
    .ap-radio-chip.red { border-color: #c0392b; color: #c0392b; }
    .ap-radio-chip.red.checked { background: #FEE2E2; }
    .ap-radio-chip.yellow { border-color: #D4911A; color: #D4911A; }
    .ap-radio-chip.yellow.checked { background: #FEF3C7; }

    /* ── GALLERY ── */
    .ap-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .ap-gallery-item { position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 4/3; border: 1px solid var(--border); }
    .ap-gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ap-gallery-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); opacity: 0; transition: opacity 0.2s; display: flex; flex-direction: column; justify-content: flex-end; padding: 0.75rem; }
    .ap-gallery-item:hover .ap-gallery-overlay { opacity: 1; }
    .ap-gallery-title { color: #fff; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.25rem; }
    .ap-gallery-cat { font-size: 0.7rem; margin-bottom: 0.4rem; }

    /* ── PAYMENT STATS ── */
    .ap-stat-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .ap-mini-stat { background: #fff; border-radius: 8px; padding: 0.65rem 1rem; font-size: 0.82rem; font-weight: 600; border: 1px solid var(--border); }
    .ap-mini-stat.green { border-left: 3px solid #059669; }
    .ap-mini-stat.yellow { border-left: 3px solid #D4911A; }
    .ap-mini-stat.red { border-left: 3px solid #c0392b; }
    .ap-mini-stat.blue { border-left: 3px solid #1a5c8a; }

    /* ── HOMEWORK ── */
    .ap-hw-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .ap-hw-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: var(--ground); border-radius: 8px; border-left: 3px solid var(--accent); }
    .ap-hw-title { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .ap-hw-meta { font-size: 0.75rem; color: var(--muted); margin-top: 0.15rem; font-family: 'DM Sans', sans-serif; }

    /* ── PERMISSIONS ── */
    .ap-perm-section { margin: 0.5rem 1.5rem 0; background: var(--ground); border-radius: 8px; padding: 1rem; }
    .ap-perm-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 0.75rem; font-family: 'DM Sans', sans-serif; }
    .ap-perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
    .ap-perm-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text); }
    .ap-perm-icon { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; flex-shrink: 0; }
    .ap-perm-row:has(.ap-perm-icon:first-child) .ap-perm-icon { background: #D1FAE5; color: #065F46; }

    /* ── SLIDES ── */
    .ap-slides-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .ap-slide-card { background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); display: flex; flex-direction: column; }
    .ap-slide-preview { height: 140px; background: linear-gradient(135deg, #1A4731, #2a6046); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
    .ap-slide-preview img { width: 100%; height: 100%; object-fit: cover; opacity: .6; }
    .ap-slide-placeholder { font-size: 2.5rem; color: rgba(255,255,255,.4); }
    .ap-slide-info { flex: 1; padding: .75rem; }
    .ap-slide-title { font-size: .875rem; font-weight: 700; color: var(--text); }
    .ap-slide-sub { font-size: .75rem; color: var(--muted); margin-top: .15rem; }

    /* ── STUDENT AVATAR ── */
    .ap-student-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--dark), #2a6046); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .8rem; color: #fff; background-size: cover; background-position: center; flex-shrink: 0; }
    .ap-tag-sec { background: rgba(212,145,26,.15); color: var(--accent); border-radius: 4px; padding: .1rem .4rem; font-size: .75rem; font-weight: 600; font-family: 'DM Sans', sans-serif; }
    .ap-btn-view { width: 30px; height: 30px; border-radius: 5px; border: none; cursor: pointer; font-size: .875rem; display: flex; align-items: center; justify-content: center; background: #FEF3C7; }
    .ap-btn-view:hover { background: #FDE68A; }
    .ap-auto-tag { background: #D1FAE5; color: #065F46; border-radius: 4px; padding: .1rem .35rem; font-size: .65rem; font-weight: 700; margin-left: .3rem; }
    /* Student profile view */
    .ap-profile-view { display: flex; gap: 2rem; padding: 0 1.5rem 1rem; }
    .ap-profile-photo { display: flex; flex-direction: column; align-items: center; gap: .5rem; flex-shrink: 0; }
    .ap-profile-avatar { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, var(--dark), #2a6046); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 2rem; color: #fff; background-size: cover; background-position: center; border: 4px solid var(--dark); }
    .ap-profile-id { font-family: monospace; font-size: .8rem; color: var(--muted); background: var(--ground); padding: .2rem .6rem; border-radius: 4px; }
    .ap-profile-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }
    .ap-pf-row { display: flex; flex-direction: column; gap: .1rem; background: var(--ground); border-radius: 6px; padding: .4rem .75rem; }
    .ap-pf-row span { font-size: .7rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; font-family: 'DM Sans', sans-serif; }
    .ap-pf-row strong { font-size: .875rem; color: var(--text); }
    /* Attendance student ID column */
    .ap-att-sid { width: 110px; font-size: .78rem; font-family: monospace; color: var(--muted); flex-shrink: 0; }
    /* Payment class cards */
    .ap-pay-class-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .75rem; margin-bottom: 1.25rem; }
    .ap-pay-class-card { background: #fff; border-radius: 10px; padding: 1rem; border: 1px solid var(--border); box-shadow: 0 2px 6px rgba(0,0,0,.05); }
    .ap-pay-class-name { font-family: 'Noto Serif Bengali',serif; font-weight: 700; font-size: .9rem; color: var(--dark); margin-bottom: .6rem; display: flex; align-items: center; gap: .4rem; }
    .ap-pay-class-row { display: flex; justify-content: space-between; align-items: center; font-size: .8rem; padding: .2rem 0; border-bottom: 1px solid rgba(0,0,0,.04); }
    .ap-pay-class-row strong { font-weight: 700; }
    .ap-pay-class-row.green strong { color: #059669; }
    .ap-pay-class-row.red strong { color: #c0392b; }
    .ap-pay-class-row.blue strong { color: #1a5c8a; }
    .ap-pay-class-row.orange strong { color: #D4911A; }
    /* Payment student found card */
    .ap-pay-student-found { display: flex; align-items: center; gap: 1rem; background: #D1FAE5; border-radius: 8px; padding: .75rem 1rem; border: 1px solid #059669; }
    /* Permissions checkboxes */
    /* Hierarchical permissions */
    .ap-perm-modules { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .75rem; }
    .ap-perm-module { background: #fff; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
    .ap-perm-module-head { background: var(--ground); padding: .5rem .75rem; border-bottom: 1px solid var(--border); }
    .ap-perm-module-label { display: flex; align-items: center; gap: .5rem; cursor: pointer; font-size: .85rem; }
    .ap-perm-module-label input { accent-color: var(--dark); width: 15px; height: 15px; }
    .ap-perm-module-icon { font-size: 1rem; }
    .ap-perm-features { display: flex; flex-direction: column; gap: 0; padding: .35rem .5rem; }
    .ap-perm-feature { display: flex; align-items: center; gap: .5rem; font-size: .8rem; cursor: pointer; padding: .3rem .25rem; border-radius: 5px; color: var(--text); transition: background .1s; }
    .ap-perm-feature:hover { background: var(--ground); }
    .ap-perm-feature input { accent-color: var(--dark); width: 13px; height: 13px; }
    .ap-perm-note { font-size: .72rem; color: var(--muted); font-style: italic; }
    /* Attendance sub-tabs */
    .ap-subtabs { display: flex; gap: .5rem; margin-bottom: 1rem; }
    .ap-subtabs button { background: #fff; border: 1.5px solid var(--border); border-radius: 8px; padding: .45rem 1rem; font-size: .82rem; font-weight: 600; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .ap-subtabs button.active { background: var(--dark); color: #fff; border-color: var(--dark); }
    .role-staff { background: rgba(99,102,241,0.12); color: #4338CA; }
    /* Pagination */
    .ap-pagination { display: flex; align-items: center; gap: .5rem; padding: .75rem 1rem; border-top: 1px solid var(--border); }
    .ap-page-btn { background: var(--dark); color: #fff; border: none; border-radius: 6px; width: 32px; height: 32px; font-size: 1.1rem; cursor: pointer; }
    .ap-page-btn:disabled { opacity: .35; cursor: default; }
    .ap-page-info { font-size: .82rem; font-weight: 600; color: var(--dark); min-width: 60px; text-align: center; }
    /* HR Attendance */
    .ap-tab-bar { display: flex; gap: .5rem; }
    .ap-tab-bar button { background: #fff; border: 1.5px solid var(--border); border-radius: 8px; padding: .5rem 1rem; font-size: .82rem; cursor: pointer; font-weight: 600; }
    .ap-tab-bar button.active { background: var(--dark); color: #fff; border-color: var(--dark); }
    .ap-att-row { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1rem; border-bottom: 1px solid var(--border); gap: 1rem; }
    .ap-att-info { display: flex; align-items: center; gap: .75rem; flex: 1; }
    .ap-att-btns { display: flex; gap: .4rem; }
    .ap-att-btn { border-radius: 20px; padding: .3rem .75rem; font-size: .8rem; font-weight: 600; border: 1.5px solid; cursor: pointer; background: #fff; }
    .ap-att-btn.present { border-color: #059669; color: #059669; }
    .ap-att-btn.present.selected { background: #059669; color: #fff; }
    .ap-att-btn.absent { border-color: #c0392b; color: #c0392b; }
    .ap-att-btn.absent.selected { background: #c0392b; color: #fff; }
    .ap-att-btn.late { border-color: #D4911A; color: #D4911A; }
    .ap-att-btn.late.selected { background: #D4911A; color: #fff; }
    .ap-att-saved-msg { margin-top: 1rem; color: #059669; font-weight: 600; font-size: .9rem; }
    .ap-att-status { font-weight: 600; font-size: .82rem; }
    .ap-att-status.present { color: #059669; }
    .ap-att-status.absent { color: #c0392b; }
    .ap-att-status.late { color: #D4911A; }
    .ap-btn-secondary { background: #fff; border: 2px solid var(--dark); color: var(--dark); border-radius: 8px; padding: .55rem 1.25rem; font-weight: 700; font-size: .85rem; cursor: pointer; }
    /* Admission badges */
    .ap-badge-yellow { background: #FEF3C7; color: #92400E; }
    .ap-badge-blue { background: #DBEAFE; color: #1E40AF; }
    .ap-badge-red { background: #FEE2E2; color: #991B1B; }
    /* Small action button */
    .ap-btn-sm { border: none; border-radius: 6px; padding: .3rem .55rem; font-size: .82rem; cursor: pointer; background: var(--ground); }
    .ap-btn-view { background: var(--ground); border: 1.5px solid var(--border); }
    /* Toast */
    .ap-toast { position: fixed; bottom: 2rem; right: 2rem; background: #1A4731; color: #fff; padding: .75rem 1.5rem; border-radius: 8px; font-size: .88rem; font-weight: 600; z-index: 9999; box-shadow: 0 4px 20px rgba(0,0,0,0.25); font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; animation: slideIn .25s ease; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* ── MOBILE BAR (hidden on desktop) ── */
    .ap-mobile-bar { display: none; }
    .ap-sidebar-overlay { display: none; }

    /* ── MOBILE RESPONSIVE ── */
    @media (max-width: 768px) {
      /* Mobile top bar */
      .ap-mobile-bar {
        display: flex;
        align-items: center;
        background: var(--dark);
        color: #fff;
        padding: 0.6rem 1rem;
        position: sticky;
        top: 0;
        z-index: 1001;
        gap: 0.75rem;
      }
      .ap-hamburger {
        background: none;
        border: none;
        color: #fff;
        font-size: 1.3rem;
        cursor: pointer;
        padding: 0.1rem 0.3rem;
        line-height: 1;
        flex-shrink: 0;
      }
      .ap-mobile-title {
        flex: 1;
        font-weight: 700;
        font-size: 0.95rem;
        text-align: center;
        font-family: 'Noto Serif Bengali', serif;
      }
      .ap-mobile-section {
        font-size: 0.72rem;
        color: rgba(255,255,255,0.65);
        text-align: right;
        flex-shrink: 0;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Sidebar overlay */
      .ap-sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      }

      /* Sidebar: fixed, slides in from left */
      .ap-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        height: 100vh;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        width: 240px;
      }
      .ap-sidebar.open {
        transform: translateX(0);
      }

      /* Main layout stacks vertically */
      .ap-wrap {
        flex-direction: column;
      }
      .ap-main {
        width: 100%;
        min-height: calc(100vh - 50px);
      }

      /* Section padding reduced on mobile */
      .ap-section {
        padding: 1rem;
        max-width: 100%;
      }

      /* Page header: stack title and button vertically */
      .ap-page-head {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .ap-page-head h1 {
        font-size: 1.2rem;
      }

      /* Stat cards: 2 columns on mobile */
      .ap-stat-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.6rem;
      }
      .ap-stat-val {
        font-size: 1.5rem;
      }

      /* Quick cards: 2 columns on mobile */
      .ap-quick-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }

      /* Tables: wrap in overflow container */
      .ap-card {
        overflow-x: auto;
        padding: 0.75rem;
      }
      .ap-table {
        min-width: 480px;
      }

      /* Forms: single column on mobile */
      .ap-form-grid {
        grid-template-columns: 1fr;
      }
      .span2 {
        grid-column: 1;
      }

      /* Modals: full-screen on mobile */
      .ap-modal-bg {
        padding: 0;
        align-items: flex-end;
      }
      .ap-modal {
        max-width: 100%;
        width: 100%;
        max-height: 92vh;
        border-radius: 16px 16px 0 0;
      }
      .ap-modal-lg {
        max-width: 100%;
      }

      /* Action buttons: wrap if needed */
      .ap-action-row {
        flex-wrap: wrap;
      }

      /* Toolbar: stack filters */
      .ap-toolbar {
        flex-direction: column;
        gap: 0.5rem;
      }
      .ap-search {
        width: 100%;
        min-width: unset;
      }
      .ap-filter {
        width: 100%;
      }

      /* Filter row */
      .ap-filter-row {
        flex-direction: column;
        gap: 0.5rem;
      }
      .ap-filter-row select,
      .ap-filter-row input {
        width: 100% !important;
      }

      /* Attendance rows: stack on very small screens */
      .ap-att-header {
        display: none;
      }
      .ap-att-row {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .ap-att-roll,
      .ap-att-sid {
        width: auto;
      }
      .ap-radio-group {
        width: 100%;
      }

      /* Profile view: stack photo and fields */
      .ap-profile-view {
        flex-direction: column;
        gap: 1rem;
        padding: 0 1rem 1rem;
      }
      .ap-profile-fields {
        grid-template-columns: 1fr;
      }

      /* Payment stats row: wrap */
      .ap-stat-row {
        gap: 0.5rem;
      }
      .ap-mini-stat {
        flex: 1;
        min-width: calc(50% - 0.25rem);
        font-size: 0.75rem;
        padding: 0.5rem 0.6rem;
      }

      /* Pay class grid: 2 columns */
      .ap-pay-class-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }

      /* Permission modules: single column */
      .ap-perm-modules {
        grid-template-columns: 1fr;
      }

      /* Tab bars */
      .ap-tab-bar,
      .ap-subtabs {
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .ap-tab-bar button,
      .ap-subtabs button {
        font-size: 0.75rem;
        padding: 0.35rem 0.6rem;
      }

      /* Slides grid: single column */
      .ap-slides-grid {
        grid-template-columns: 1fr;
      }

      /* Gallery grid: 2 columns */
      .ap-gallery-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }

      /* HR attendance buttons: wrap */
      .ap-att-btns {
        flex-wrap: wrap;
        gap: 0.3rem;
      }
      .ap-att-btn {
        font-size: 0.72rem;
        padding: 0.25rem 0.5rem;
      }

      /* Button sizes */
      .ap-btn-primary,
      .ap-btn-ghost {
        width: 100%;
        text-align: center;
      }
      .ap-page-head .ap-btn-primary,
      .ap-page-head .ap-btn-ghost {
        width: auto;
      }

      /* Permission section */
      .ap-perm-section {
        margin: 0.5rem 0.75rem 0;
      }

      /* Modal form grid padding */
      .ap-modal .ap-form-grid {
        padding: 0 1rem;
      }
      .ap-modal-head {
        padding: 1rem 1rem 0;
      }
      .ap-modal-foot {
        padding: 0.75rem 1rem 1rem;
      }
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  i18n = inject(I18nService);
  auth = inject(AuthService);
  router = inject(Router);
  http = inject(HttpClient);

  activeSection = 'dashboard';
  sidebarOpen = false;
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  userName = 'Admin';
  userInitial = 'A';
  currentUserId = 0;

  stats = { students: 0, teachers: 0, exams: 0, paidAmount: 0, pendingPayments: 0, users: 0 };

  navCards = [
    { icon: '📢', en: 'Notice Board', bn: 'নোটিশ বোর্ড', section: 'notices' },
    { icon: '🖼️', en: 'Gallery', bn: 'গ্যালারি', section: 'gallery' },
    { icon: '👨‍🎓', en: 'Students', bn: 'শিক্ষার্থী', section: 'students' },
    { icon: '👥', en: 'Users', bn: 'ব্যবহারকারী', section: 'users' },
    { icon: '💳', en: 'Payments', bn: 'পেমেন্ট', section: 'payments' },
    { icon: '📋', en: 'Exams', bn: 'পরীক্ষা', section: 'exams' },
    { icon: '⚙️', en: 'School Info', bn: 'স্কুল তথ্য', section: 'site-settings' },
    { icon: '🚌', en: 'Transport', bn: 'পরিবহন', section: 'transport' },
  ];

  // Data
  settings: any = null;
  settingsSaved = false;
  notices: any[] = [];
  gallery: any[] = [];
  heroSlides: any[] = [];
  quickLinks: any[] = [];
  schoolEvents: any[] = [];
  students: any[] = [];
  teachers: any[] = [];
  classes: any[] = [];
  subjects: any[] = [];
  exams: any[] = [];
  payments: any[] = [];
  filteredPayments: any[] = [];
  homework: any[] = [];
  transport: any[] = [];
  users: any[] = [];
  attendance: any[] = [];
  employees: any[] = [];
  classPaymentStats: any[] = [];

  // Modal state
  noticeModal = false;
  editingNotice: any = null;
  studentModal = false;
  editingStudent: any = null;
  viewingStudent: any = null;
  teacherModal = false;
  editingTeacher: any = null;
  examModal = false;
  editingExam: any = null;
  paymentModal = false;
  editingPayment: any = null;
  hwModal = false;
  editingHw: any = null;
  transportModal = false;
  editingTransport: any = null;
  userModal = false;
  editingUser: any = null;
  empModal = false;
  editingEmp: any = null;
  galleryUploadOpen = false;
  resetCredModal = false;
  resetCredUser: any = null;
  admissions: any[] = [];
  admissionFilter = 'all';
  viewingAdmission: any = null;
  admissionStats = { total: 0, pending: 0, approved: 0, admitted: 0, rejected: 0 };
  toastMsg = '';
  newPhoto: any = { title: '', image_data: null, category: 'general' };
  slideModal = false;
  editingSlide: any = null;
  qlModal = false;
  editingQL: any = null;
  eventModal = false;
  editingEvent: any = null;

  // Student state
  nextStudentId = '';

  // Payment lookup state
  payLookup: any = { class_id: '', roll: '', student_id_str: '' };
  payFoundStudent: any = null;
  payLookupError = '';
  payPage = 1;
  payPerPage = 10;

  // HR filter
  empSearch = '';
  empDeptFilter = '';

  // HR Attendance state
  hrAttDate = new Date().toISOString().split('T')[0];
  hrAttDept = '';
  hrAttList: any[] = [];
  hrAttSaved = false;
  hrAttView: 'take' | 'report' | 'summary' = 'take';
  hrAttReport: any[] = [];
  hrAttSummary: any[] = [];
  hrAttReportMonth = new Date().toISOString().slice(0, 7);
  hrAttEmpFilter = '';

  // Permissions module list
  moduleList = [
    { key: 'academic', icon: '📚', labelEn: 'Academic Module', labelBn: 'একাডেমিক মডিউল', features: [
      { key: 'academic.students', labelEn: 'Students (View/Manage)', labelBn: 'শিক্ষার্থী ব্যবস্থাপনা' },
      { key: 'academic.attendance', labelEn: 'Student Attendance', labelBn: 'শিক্ষার্থী উপস্থিতি' },
      { key: 'academic.homework', labelEn: 'Homework', labelBn: 'হোমওয়ার্ক' },
      { key: 'academic.exams', labelEn: 'Exams & Results', labelBn: 'পরীক্ষা ও ফলাফল' },
    ]},
    { key: 'finance', icon: '💰', labelEn: 'Finance / Payments', labelBn: 'ফিনান্স / পেমেন্ট', features: [
      { key: 'finance.view', labelEn: 'View Payments', labelBn: 'পেমেন্ট দেখুন' },
      { key: 'finance.collect', labelEn: 'Collect Fees', labelBn: 'ফি সংগ্রহ করুন' },
      { key: 'finance.reports', labelEn: 'Payment Reports', labelBn: 'পেমেন্ট রিপোর্ট' },
    ]},
    { key: 'hr', icon: '👔', labelEn: 'HR Management', labelBn: 'এইচআর ব্যবস্থাপনা', features: [
      { key: 'hr.employees', labelEn: 'Employee Records', labelBn: 'কর্মচারী রেকর্ড' },
      { key: 'hr.attendance', labelEn: 'HR Attendance', labelBn: 'কর্মচারী উপস্থিতি' },
      { key: 'hr.payroll', labelEn: 'Payroll', labelBn: 'বেতন ব্যবস্থাপনা' },
    ]},
    { key: 'transport', icon: '🚌', labelEn: 'Transport', labelBn: 'পরিবহন', features: [
      { key: 'transport.routes', labelEn: 'Routes & Vehicles', labelBn: 'রুট ও যানবাহন' },
      { key: 'transport.assignments', labelEn: 'Student Assignments', labelBn: 'শিক্ষার্থী বরাদ্দ' },
    ]},
    { key: 'website', icon: '🌐', labelEn: 'Website Control', labelBn: 'ওয়েবসাইট নিয়ন্ত্রণ', features: [
      { key: 'website.settings', labelEn: 'Site Settings', labelBn: 'সাইট সেটিংস' },
      { key: 'website.content', labelEn: 'Slides, Events & Gallery', labelBn: 'স্লাইড, ইভেন্ট ও গ্যালারি' },
      { key: 'website.notices', labelEn: 'Notices', labelBn: 'নোটিশ' },
    ]},
    { key: 'reports', icon: '📊', labelEn: 'Reports & Analytics', labelBn: 'রিপোর্ট ও বিশ্লেষণ', features: [
      { key: 'reports.attendance', labelEn: 'Attendance Reports', labelBn: 'উপস্থিতি রিপোর্ট' },
      { key: 'reports.financial', labelEn: 'Financial Reports', labelBn: 'আর্থিক রিপোর্ট' },
      { key: 'reports.academic', labelEn: 'Academic Reports', labelBn: 'একাডেমিক রিপোর্ট' },
    ]},
  ];

  // Filters
  studentSearch = '';
  studentClassFilter = '';
  paymentFilter = '';
  paymentStats = { paid: 0, pending: 0, overdue: 0, total: 0 };
  attClassId = '';
  attDate = new Date().toISOString().split('T')[0];
  attSaved = false;

  // Class management
  classNames = [
    { en: 'Play Group', bn: 'প্লে গ্রুপ' },
    { en: 'Nursery', bn: 'নার্সারি' },
    { en: 'Class 1', bn: 'প্রথম শ্রেণী' },
    { en: 'Class 2', bn: 'দ্বিতীয় শ্রেণী' },
    { en: 'Class 3', bn: 'তৃতীয় শ্রেণী' },
    { en: 'Class 4', bn: 'চতুর্থ শ্রেণী' },
    { en: 'Class 5', bn: 'পঞ্চম শ্রেণী' },
  ];
  newClass: any = { class_name: '', section: '', room_number: '', capacity: 40, class_teacher_id: null };
  classSaved = false;
  classError = '';
  editingClass: any = null;
  editClassModal = false;
  attSubTab: 'take' | 'report' = 'take';
  adminAttReport: any[] = [];
  adminAttReportMonth = new Date().toISOString().slice(0, 7);
  adminAttReportClassId = '';

  rolePermissions: any = {
    admin: [
      { label: 'Full system access', allowed: true },
      { label: 'User management', allowed: true },
      { label: 'Website control', allowed: true },
      { label: 'Financial reports', allowed: true },
      { label: 'Student records', allowed: true },
      { label: 'Teacher records', allowed: true },
    ],
    teacher: [
      { label: 'View students', allowed: true },
      { label: 'Mark attendance', allowed: true },
      { label: 'Assign homework', allowed: true },
      { label: 'Enter exam results', allowed: true },
      { label: 'User management', allowed: false },
      { label: 'Financial reports', allowed: false },
    ],
    student: [
      { label: 'View own grades', allowed: true },
      { label: 'View homework', allowed: true },
      { label: 'View attendance', allowed: true },
      { label: 'View fee status', allowed: true },
      { label: 'Mark attendance', allowed: false },
      { label: 'User management', allowed: false },
    ],
    parent: [
      { label: 'View child\'s grades', allowed: true },
      { label: 'View fee status', allowed: true },
      { label: 'View attendance', allowed: true },
      { label: 'Mark attendance', allowed: false },
      { label: 'User management', allowed: false },
      { label: 'Financial reports', allowed: false },
    ],
  };

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.userName = user.full_name || user.username;
      this.userInitial = this.userName.charAt(0).toUpperCase();
      this.currentUserId = user.id;
    }
    this.loadDashboard();
    this.loadSettings();
    this.loadClasses();
    this.loadSubjects();
  }

  go(section: string) {
    this.sidebarOpen = false;
    this.activeSection = section;
    switch (section) {
      case 'notices': this.loadNotices(); break;
      case 'gallery': this.loadGallery(); break;
      case 'hero-slides': this.loadHeroSlides(); break;
      case 'quick-links': this.loadQuickLinks(); break;
      case 'events': this.loadSchoolEvents(); break;
      case 'students': this.loadStudents(); break;
      case 'teachers': this.loadTeachers(); break;
      case 'exams': this.loadExams(); break;
      case 'payments': this.loadPayments(); break;
      case 'homework': this.loadHomework(); break;
      case 'transport': this.loadTransport(); break;
      case 'users': this.loadUsers(); break;
      case 'admissions': this.loadAdmissions(); break;
      case 'classes': this.loadClasses(); this.loadStudents(); break;
      case 'employees': this.loadEmployees(); break;
      case 'hr-attendance': this.loadHrAtt(); this.loadEmployees(); break;
      case 'payments': this.loadPayments(); break;
    }
  }

  loadDashboard() {
    this.http.get<any[]>(`${API}/students`).subscribe({ next: d => { this.stats.students = d.length; this.students = d; } });
    this.http.get<any[]>(`${API}/teachers`).subscribe({ next: d => { this.stats.teachers = d.length; this.teachers = d; } });
    this.http.get<any[]>(`${API}/exams`).subscribe({ next: d => { this.stats.exams = d.length; } });
    this.http.get<any[]>(`${API}/payments`).subscribe({ next: d => {
      this.stats.paidAmount = d.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
      this.stats.pendingPayments = d.filter(p => p.status !== 'paid').length;
    }});
    this.http.get<any[]>(`${API}/users`, { headers: this.headers }).subscribe({ next: d => { this.stats.users = d.length; }, error: () => {} });
  }

  loadSettings() {
    this.http.get<any>(`${API}/website-settings`).subscribe({ next: d => { this.settings = d; } });
  }

  saveSettings() {
    this.http.put(`${API}/website-settings`, this.settings, { headers: this.headers }).subscribe({
      next: () => { this.settingsSaved = true; setTimeout(() => this.settingsSaved = false, 3000); },
      error: () => {}
    });
  }

  onPrincipalPhoto(e: any) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev: any) => { this.settings['principal_photo'] = ev.target.result; };
    r.readAsDataURL(f);
  }

  onFounderPhoto(e: any) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev: any) => { this.settings['founder_photo'] = ev.target.result; };
    r.readAsDataURL(f);
  }

  onDirectorPhoto(e: any) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev: any) => { this.settings['director_photo'] = ev.target.result; };
    r.readAsDataURL(f);
  }

  loadClasses() {
    this.http.get<any[]>(`${API}/classes`).subscribe({ next: d => { this.classes = d; } });
  }

  getBnClassName(name: string): string {
    const match = this.classNames.find(c => c.en === name);
    return match ? match.bn : name;
  }

  getStudentCountForClass(classId: number): number {
    return this.students.filter((s: any) => s.class_id === classId).length;
  }

  saveClass() {
    this.classError = '';
    if (!this.newClass.class_name || !this.newClass.section) {
      this.classError = 'শ্রেণী এবং শাখা আবশ্যক';
      return;
    }
    const payload = {
      class_name: this.newClass.class_name,
      section: this.newClass.section,
      room_number: this.newClass.room_number || null,
      capacity: this.newClass.capacity || 40,
      class_teacher_id: this.newClass.class_teacher_id || null,
      class_name_bn: this.getBnClassName(this.newClass.class_name),
    };
    this.http.post(`${API}/classes`, payload, { headers: this.headers }).subscribe({
      next: () => {
        this.classSaved = true;
        this.newClass = { class_name: '', section: '', room_number: '', capacity: 40, class_teacher_id: null };
        this.loadClasses();
        setTimeout(() => this.classSaved = false, 3000);
      },
      error: (err: any) => {
        this.classError = err?.error?.message || 'এই শ্রেণী ও শাখা ইতিমধ্যে বিদ্যমান';
      }
    });
  }

  deleteClass(id: number) {
    if (!confirm('এই শ্রেণী মুছে ফেলবেন?')) return;
    this.http.delete(`${API}/classes/${id}`, { headers: this.headers }).subscribe({
      next: () => this.loadClasses(),
      error: (err: any) => alert(err?.error?.message || 'মুছতে ব্যর্থ হয়েছে')
    });
  }

  attCount(status: string): number {
    return this.attendance.filter((a: any) => a.status === status).length;
  }

  loadSubjects() {
    this.http.get<any[]>(`${API}/subjects`).subscribe({ next: d => { this.subjects = d; }, error: () => {} });
  }

  // ── NOTICES ──
  loadNotices() {
    this.http.get<any[]>(`${API}/notices`, { headers: this.headers }).subscribe({ next: d => { this.notices = d; } });
  }
  openNoticeModal() { this.editingNotice = { title_en: '', title_bn: '', content_en: '', content_bn: '', type: 'general', published: false, image_data: null }; this.noticeModal = true; }
  editNotice(n: any) { this.editingNotice = { ...n }; this.noticeModal = true; }
  closeNoticeModal() { this.noticeModal = false; this.editingNotice = null; }
  onNoticeImage(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => { this.editingNotice.image_data = ev.target.result; };
    reader.readAsDataURL(file);
  }
  saveNotice() {
    const obs = this.editingNotice.id
      ? this.http.put(`${API}/notices/${this.editingNotice.id}`, this.editingNotice, { headers: this.headers })
      : this.http.post(`${API}/notices`, this.editingNotice, { headers: this.headers });
    obs.subscribe({ next: () => { this.closeNoticeModal(); this.loadNotices(); this.showToast(this.i18n.isEn ? 'Notice saved!' : 'নোটিশ সফলভাবে সংরক্ষিত হয়েছে!'); } });
  }
  toggleNotice(n: any) {
    this.http.put(`${API}/notices/${n.id}`, { ...n, published: !n.published }, { headers: this.headers }).subscribe({ next: () => this.loadNotices() });
  }
  deleteNotice(id: number) {
    if (!confirm('Delete this notice?')) return;
    this.http.delete(`${API}/notices/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadNotices() });
  }

  // ── GALLERY ──
  loadGallery() {
    this.http.get<any[]>(`${API}/gallery`).subscribe({ next: d => { this.gallery = d; } });
  }
  openGalleryUpload() { this.galleryUploadOpen = true; this.newPhoto = { title: '', image_data: null, category: 'general' }; }
  onGalleryImage(e: any) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => { this.newPhoto.image_data = ev.target.result; };
    reader.readAsDataURL(file);
  }
  uploadPhoto() {
    this.http.post(`${API}/gallery`, this.newPhoto, { headers: this.headers }).subscribe({
      next: () => { this.galleryUploadOpen = false; this.newPhoto = { title: '', image_data: null, category: 'general' }; this.loadGallery(); }
    });
  }
  deletePhoto(id: number) {
    if (!confirm('Delete this photo?')) return;
    this.http.delete(`${API}/gallery/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadGallery() });
  }

  // ── STUDENTS ──
  loadStudents() {
    this.http.get<any[]>(`${API}/students`).subscribe({ next: d => { this.students = d; } });
  }
  applyStudentFilter() {}
  get filteredStudents() {
    return this.students.filter(s =>
      (!this.studentSearch || s.name_en?.toLowerCase().includes(this.studentSearch.toLowerCase()) || s.name_bn?.includes(this.studentSearch) || s.student_id?.toLowerCase().includes(this.studentSearch.toLowerCase())) &&
      (!this.studentClassFilter || String(s.class_id) === String(this.studentClassFilter))
    );
  }
  viewStudent(s: any) { this.viewingStudent = s; }
  openStudentModal() {
    this.http.get<any>(`${API}/students/meta/next-id`, { headers: this.headers }).subscribe({
      next: (d: any) => { this.nextStudentId = d.next_id; },
      error: () => {}
    });
    this.editingStudent = { student_id: '', name_en: '', name_bn: '', father_name: '', mother_name: '', date_of_birth: '', gender: 'male', class_id: '', roll_number: '', blood_group: '', phone: '', address: '', photo: null };
    this.studentModal = true;
  }
  editStudent(s: any) { this.editingStudent = { ...s }; this.studentModal = true; }
  closeStudentModal() { this.studentModal = false; this.editingStudent = null; }
  onStudentPhoto(e: any) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev: any) => { this.editingStudent.photo = ev.target.result; };
    r.readAsDataURL(f);
  }
  saveStudent() {
    const obs = this.editingStudent.id
      ? this.http.put(`${API}/students/${this.editingStudent.id}`, this.editingStudent, { headers: this.headers })
      : this.http.post(`${API}/students`, this.editingStudent, { headers: this.headers });
    obs.subscribe({ next: () => { this.closeStudentModal(); this.loadStudents(); } });
  }
  deleteStudent(id: number) {
    if (!confirm('Delete this student?')) return;
    this.http.delete(`${API}/students/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadStudents() });
  }

  // ── TEACHERS ──
  loadTeachers() {
    this.http.get<any[]>(`${API}/teachers`).subscribe({ next: d => { this.teachers = d; } });
  }
  openTeacherModal() { this.editingTeacher = { teacher_id: '', name_en: '', name_bn: '', designation: '', subject: '', phone: '', email: '', salary: 0, address: '' }; this.teacherModal = true; }
  editTeacher(t: any) { this.editingTeacher = { ...t }; this.teacherModal = true; }
  closeTeacherModal() { this.teacherModal = false; this.editingTeacher = null; }
  saveTeacher() {
    const obs = this.editingTeacher.id
      ? this.http.put(`${API}/teachers/${this.editingTeacher.id}`, this.editingTeacher)
      : this.http.post(`${API}/teachers`, this.editingTeacher);
    obs.subscribe({ next: () => { this.closeTeacherModal(); this.loadTeachers(); } });
  }
  deleteTeacher(id: number) {
    if (!confirm('Delete this teacher?')) return;
    this.http.delete(`${API}/teachers/${id}`).subscribe({ next: () => this.loadTeachers() });
  }

  // ── ATTENDANCE ──
  loadAttendance() {
    if (!this.attClassId || !this.attDate) return;
    this.http.get<any[]>(`${API}/attendance/${this.attClassId}/${this.attDate}`).subscribe({
      next: d => { this.attendance = d.map(s => ({ ...s, status: s.status || 'present' })); }
    });
  }
  markAllPresent() { this.attendance.forEach(a => a.status = 'present'); }
  saveAttendance() {
    const records = this.attendance.map(a => ({ student_id: a.student_id, status: a.status, date: this.attDate }));
    this.http.post(`${API}/attendance/${this.attClassId}/${this.attDate}`, { records }).subscribe({
      next: () => { this.attSaved = true; setTimeout(() => this.attSaved = false, 3000); }
    });
  }

  // ── EXAMS ──
  loadExams() {
    this.http.get<any[]>(`${API}/exams`).subscribe({ next: d => { this.exams = d; } });
  }
  openExamModal() { this.editingExam = { exam_name: '', exam_name_bn: '', exam_type: 'প্রথম সাময়িক', class_id: '', start_date: '', end_date: '', total_marks: 100, pass_marks: 40, status: 'scheduled' }; this.examModal = true; }
  editExam(e: any) { this.editingExam = { ...e }; this.examModal = true; }
  closeExamModal() { this.examModal = false; this.editingExam = null; }
  saveExam() {
    const obs = this.editingExam.id
      ? this.http.put(`${API}/exams/${this.editingExam.id}`, this.editingExam)
      : this.http.post(`${API}/exams`, this.editingExam);
    obs.subscribe({ next: () => { this.closeExamModal(); this.loadExams(); } });
  }
  deleteExam(id: number) {
    if (!confirm('Delete this exam?')) return;
    this.http.delete(`${API}/exams/${id}`).subscribe({ next: () => this.loadExams() });
  }

  // ── PAYMENTS ──
  loadPayments() {
    this.http.get<any[]>(`${API}/payments`, { headers: this.headers }).subscribe({ next: d => {
      this.payments = d;
      this.filteredPayments = d;
      this.paymentStats = {
        paid: d.filter(p => p.status === 'paid').length,
        pending: d.filter(p => p.status === 'pending').length,
        overdue: d.filter(p => p.status === 'overdue').length,
        total: d.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
      };
    }});
    this.http.get<any[]>(`${API}/payments/class-stats`, { headers: this.headers }).subscribe({
      next: d => { this.classPaymentStats = d; }, error: () => {}
    });
  }
  filterPayments() {
    this.filteredPayments = this.paymentFilter ? this.payments.filter(p => p.status === this.paymentFilter) : this.payments;
    this.payPage = 1;
  }
  get payTotalPages() { return Math.ceil(this.filteredPayments.length / this.payPerPage) || 1; }
  get pagedPayments() {
    const start = (this.payPage - 1) * this.payPerPage;
    return this.filteredPayments.slice(start, start + this.payPerPage);
  }
  openPaymentModal() {
    this.payLookup = { class_id: '', roll: '', student_id_str: '' };
    this.payFoundStudent = null;
    this.payLookupError = '';
    this.editingPayment = { student_id: '', payment_type: 'মাসিক বেতন', amount: 2000, payment_date: new Date().toISOString().split('T')[0], due_date: '', status: 'pending', payment_method: 'cash', transaction_id: '' };
    this.paymentModal = true;
  }
  clearPayStudent() { this.payFoundStudent = null; this.payLookupError = ''; }
  lookupStudent() {
    this.payLookupError = '';
    this.payFoundStudent = null;
    let url = '';
    if (this.payLookup.student_id_str?.trim()) {
      url = `${API}/payments/lookup-student?student_id=${encodeURIComponent(this.payLookup.student_id_str.trim())}`;
    } else if (this.payLookup.class_id && this.payLookup.roll) {
      url = `${API}/payments/lookup-student?class_id=${this.payLookup.class_id}&roll_number=${this.payLookup.roll}`;
    } else {
      this.payLookupError = 'Student ID অথবা শ্রেণী+রোল দিন';
      return;
    }
    this.http.get<any>(url, { headers: this.headers }).subscribe({
      next: d => { this.payFoundStudent = d; this.editingPayment.student_id = d.id; },
      error: () => { this.payLookupError = 'শিক্ষার্থী পাওয়া যায়নি'; }
    });
  }
  savePayment() {
    if (!this.editingPayment.student_id) return;
    this.http.post(`${API}/payments`, this.editingPayment, { headers: this.headers }).subscribe({ next: () => { this.paymentModal = false; this.loadPayments(); } });
  }
  markPaid(p: any) {
    this.http.put(`${API}/payments/${p.id}/status`, { status: 'paid' }, { headers: this.headers }).subscribe({ next: () => this.loadPayments() });
  }
  deletePayment(id: number) {
    if (!confirm('Delete this payment?')) return;
    this.http.delete(`${API}/payments/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadPayments() });
  }

  // ── HOMEWORK ──
  loadHomework() {
    this.http.get<any[]>(`${API}/homework/class/1`).subscribe({ next: d => { this.homework = d; } });
  }
  openHwModal() { this.editingHw = { class_id: '', subject_id: '', teacher_id: '', description: '', due_date: '' }; this.hwModal = true; }
  saveHomework() {
    this.http.post(`${API}/homework`, this.editingHw).subscribe({ next: () => { this.hwModal = false; this.loadHomework(); } });
  }
  deleteHomework(id: number) {
    if (!confirm('Delete?')) return;
    this.http.delete(`${API}/homework/${id}`).subscribe({ next: () => this.loadHomework() });
  }

  // ── TRANSPORT ──
  loadTransport() {
    this.http.get<any[]>(`${API}/transport`).subscribe({ next: d => { this.transport = d; } });
  }
  openTransportModal() { this.editingTransport = { route_name: '', route_name_bn: '', driver_name: '', driver_phone: '', vehicle_number: '', capacity: 30, monthly_fee: 500 }; this.transportModal = true; }
  editTransportRoute(r: any) { this.editingTransport = { ...r }; this.transportModal = true; }
  saveTransport() {
    const obs = this.editingTransport.id
      ? this.http.put(`${API}/transport/${this.editingTransport.id}`, this.editingTransport, { headers: this.headers })
      : this.http.post(`${API}/transport`, this.editingTransport, { headers: this.headers });
    obs.subscribe({ next: () => { this.transportModal = false; this.loadTransport(); this.showToast(this.i18n.isEn ? 'Route saved successfully!' : 'রুট সফলভাবে সংরক্ষিত হয়েছে!'); } });
  }
  deleteTransport(id: number) {
    if (!confirm('Delete route?')) return;
    this.http.delete(`${API}/transport/${id}`).subscribe({ next: () => this.loadTransport() });
  }

  // ── EMPLOYEES (HR) ──
  loadEmployees() {
    this.http.get<any[]>(`${API}/employees`, { headers: this.headers }).subscribe({ next: d => { this.employees = d; } });
  }
  get filteredEmployees() {
    return this.employees.filter(e =>
      (!this.empSearch || e.name_en?.toLowerCase().includes(this.empSearch.toLowerCase()) || e.name_bn?.includes(this.empSearch)) &&
      (!this.empDeptFilter || e.department === this.empDeptFilter)
    );
  }
  openEmpModal() { this.editingEmp = { emp_id: '', name_en: '', name_bn: '', designation: '', department: 'Academic', phone: '', email: '', address: '', join_date: new Date().toISOString().split('T')[0], salary: 0, nid: '', status: 'active', photo: null }; this.empModal = true; }
  editEmployee(e: any) { this.editingEmp = { ...e }; this.empModal = true; }
  onEmpPhoto(ev: any) {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (e: any) => { this.editingEmp.photo = e.target.result; };
    r.readAsDataURL(f);
  }
  saveEmployee() {
    const obs = this.editingEmp.id
      ? this.http.put(`${API}/employees/${this.editingEmp.id}`, this.editingEmp, { headers: this.headers })
      : this.http.post(`${API}/employees`, this.editingEmp, { headers: this.headers });
    obs.subscribe({ next: () => { this.empModal = false; this.loadEmployees(); } });
  }
  deleteEmployee(id: number) {
    if (!confirm('Delete this employee?')) return;
    this.http.delete(`${API}/employees/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadEmployees() });
  }

  // ── HR ATTENDANCE ──
  loadHrAtt() {
    let url = `${API}/employee-attendance?date=${this.hrAttDate}`;
    if (this.hrAttDept) url += `&department=${encodeURIComponent(this.hrAttDept)}`;
    this.http.get<any[]>(url, { headers: this.headers }).subscribe({ next: d => { this.hrAttList = d; this.hrAttSaved = false; } });
  }
  markAllHrPresent() { this.hrAttList.forEach(e => e.status = 'present'); }
  saveHrAtt() {
    const records = this.hrAttList.map(e => ({ emp_db_id: e.emp_db_id, status: e.status }));
    this.http.post(`${API}/employee-attendance`, { date: this.hrAttDate, records }, { headers: this.headers }).subscribe({
      next: () => { this.hrAttSaved = true; setTimeout(() => this.hrAttSaved = false, 3000); }
    });
  }
  loadHrAttSummary() {
    this.http.get<any[]>(`${API}/employee-attendance/summary?month=${this.hrAttReportMonth}`, { headers: this.headers })
      .subscribe({ next: d => { this.hrAttSummary = d; } });
  }
  loadHrAttReport() {
    let url = `${API}/employee-attendance/report?month=${this.hrAttReportMonth}`;
    if (this.hrAttEmpFilter) url += `&employee_id=${this.hrAttEmpFilter}`;
    this.http.get<any[]>(url, { headers: this.headers }).subscribe({ next: d => { this.hrAttReport = d; } });
  }

  // ── USERS ──
  loadUsers() {
    this.http.get<any[]>(`${API}/users`, { headers: this.headers }).subscribe({ next: d => { this.users = d; } });
  }
  openUserModal() { this.editingUser = { username: '', email: '', role: 'teacher', full_name: '', phone: '', is_active: true, password: '', permissions: '' }; this.userModal = true; }
  editUser(u: any) { this.editingUser = { ...u, password: '' }; this.userModal = true; }
  closeUserModal() { this.userModal = false; this.editingUser = null; }
  hasPermission(key: string): boolean {
    if (!this.editingUser) return false;
    const perms = (this.editingUser.permissions || '').split(',').filter((p: string) => p);
    return perms.includes(key);
  }
  togglePermission(key: string, event: any) {
    if (!this.editingUser) return;
    let perms = (this.editingUser.permissions || '').split(',').filter((p: string) => p);
    if (event.target.checked) { if (!perms.includes(key)) perms.push(key); }
    else { perms = perms.filter((p: string) => p !== key); }
    this.editingUser.permissions = perms.join(',');
  }
  isModuleFullyChecked(m: any): boolean {
    return m.features.every((f: any) => this.hasPermission(f.key));
  }
  isModulePartiallyChecked(m: any): boolean {
    const cnt = m.features.filter((f: any) => this.hasPermission(f.key)).length;
    return cnt > 0 && cnt < m.features.length;
  }
  toggleModule(m: any, event: any) {
    m.features.forEach((f: any) => this.togglePermission(f.key, event));
  }
  openEditClass(c: any) { this.editingClass = { ...c }; this.editClassModal = true; }
  saveEditClass() {
    if (!this.editingClass?.id) return;
    const payload = {
      class_name: this.editingClass.class_name,
      class_name_bn: this.getBnClassName(this.editingClass.class_name),
      section: this.editingClass.section,
      room_number: this.editingClass.room_number,
      capacity: this.editingClass.capacity,
      class_teacher_id: this.editingClass.class_teacher_id || null,
    };
    this.http.put(`${API}/classes/${this.editingClass.id}`, payload, { headers: this.headers }).subscribe({
      next: () => { this.editClassModal = false; this.editingClass = null; this.loadClasses(); this.showToast(this.i18n.isEn ? 'Class updated!' : 'শ্রেণী সফলভাবে আপডেট হয়েছে!'); },
      error: () => {}
    });
  }
  loadAdminAttReport() {
    let url = `${API}/attendance/report-summary?month=${this.adminAttReportMonth}`;
    if (this.adminAttReportClassId) url += `&class_id=${this.adminAttReportClassId}`;
    this.http.get<any[]>(url, { headers: this.headers }).subscribe({ next: d => { this.adminAttReport = d; } });
  }
  printAdminAttReport() {
    const el = document.getElementById('admin-att-report-area');
    if (!el) return;
    const cls = this.classes.find((c: any) => String(c.id) === String(this.adminAttReportClassId));
    const clsLabel = cls ? `${cls.class_name} ${cls.section}` : 'সকল শ্রেণী';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>উপস্থিতি রিপোর্ট - ${clsLabel} - ${this.adminAttReportMonth}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #1C2A1D; }
        h2 { color: #1A4731; } p { color: #666; font-size: 13px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead tr { background: #1A4731; color: white; }
        th { padding: 8px 10px; text-align: left; font-weight: 600; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f8fafc; }
        .g { color: #059669; font-weight:700; } .r { color:#c0392b;font-weight:700; } .y { color:#D4911A;font-weight:700; }
        .pg { background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:20px;font-weight:700;display:inline-block; }
        .py { background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:20px;font-weight:700;display:inline-block; }
        .pb { background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:20px;font-weight:700;display:inline-block; }
      </style></head><body>
      <h2>উপস্থিতি রিপোর্ট</h2>
      <p>শ্রেণী: ${clsLabel} | মাস: ${this.adminAttReportMonth} | মোট: ${this.adminAttReport.length} জন</p>
      <table><thead><tr><th>রোল</th><th>আইডি</th><th>নাম</th><th class="g">উপস্থিত</th><th class="r">অনুপস্থিত</th><th class="y">দেরিতে</th><th>মোট</th><th>হার</th></tr></thead><tbody>
      ${this.adminAttReport.map(r => `<tr><td>${r.roll_number}</td><td>${r.student_id}</td><td>${r.name_en}<br><small>${r.name_bn}</small></td><td class="g">${r.present}</td><td class="r">${r.absent}</td><td class="y">${r.late}</td><td>${r.total}</td><td><span class="${r.pct>=75?'pg':r.pct>=50?'py':'pb'}">${r.pct}%</span></td></tr>`).join('')}
      </tbody></table></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
  saveUser() {
    const payload = { ...this.editingUser };
    if (!payload.password) delete payload.password;
    const obs = payload.id
      ? this.http.put(`${API}/users/${payload.id}`, payload, { headers: this.headers })
      : this.http.post(`${API}/users`, payload, { headers: this.headers });
    obs.subscribe({ next: () => { this.closeUserModal(); this.loadUsers(); this.showToast(this.i18n.isEn ? 'User saved successfully!' : 'ব্যবহারকারী সফলভাবে সংরক্ষিত হয়েছে!'); } });
  }
  deleteUser(id: number) {
    if (id === this.currentUserId) return;
    if (!confirm('Delete this user?')) return;
    this.http.delete(`${API}/users/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadUsers() });
  }

  // ── RESET CREDENTIALS ──
  openResetCred(u: any) { this.resetCredUser = { ...u, newUsername: '', newPassword: '' }; this.resetCredModal = true; }
  closeResetCred() { this.resetCredModal = false; this.resetCredUser = null; }
  saveResetCred() {
    if (!this.resetCredUser) return;
    if (!this.resetCredUser.newPassword) { alert('পাসওয়ার্ড আবশ্যক'); return; }
    const payload: any = { ...this.resetCredUser, password: this.resetCredUser.newPassword };
    if (this.resetCredUser.newUsername?.trim()) payload.username = this.resetCredUser.newUsername.trim();
    this.http.put(`${API}/users/${this.resetCredUser.id}`, payload, { headers: this.headers }).subscribe({
      next: () => { this.closeResetCred(); this.loadUsers(); alert('সফলভাবে রিসেট হয়েছে!'); },
      error: (e: any) => alert(e?.error?.message || 'রিসেট ব্যর্থ')
    });
  }

  // ── ADMISSIONS ──
  loadAdmissions() {
    const url = this.admissionFilter === 'all'
      ? `${API}/admissions`
      : `${API}/admissions?status=${this.admissionFilter}`;
    this.http.get<any[]>(url, { headers: this.headers }).subscribe({
      next: (d) => {
        this.admissions = d;
        this.http.get<any[]>(`${API}/admissions`, { headers: this.headers }).subscribe({
          next: (all) => {
            this.admissionStats.total = all.length;
            this.admissionStats.pending = all.filter(a => a.status === 'pending').length;
            this.admissionStats.approved = all.filter(a => a.status === 'approved').length;
            this.admissionStats.admitted = all.filter(a => a.status === 'admitted').length;
            this.admissionStats.rejected = all.filter(a => a.status === 'rejected').length;
          }
        });
      }
    });
  }
  viewAdmission(a: any) { this.viewingAdmission = a; }
  updateAdmissionStatus(id: number, status: string) {
    this.http.put(`${API}/admissions/${id}/status`, { status }, { headers: this.headers }).subscribe({
      next: () => {
        this.loadAdmissions();
        const msg: any = { approved: 'অনুমোদিত হয়েছে!', rejected: 'প্রত্যাখ্যাত হয়েছে।', admitted: 'ভর্তি সম্পন্ন হয়েছে! 🎓' };
        this.showToast(msg[status] || 'আপডেট সফল!');
      },
      error: (e: any) => alert(e?.error?.message || 'আপডেট ব্যর্থ')
    });
  }
  deleteAdmission(id: number) {
    if (!confirm('এই আবেদনটি মুছে ফেলবেন?')) return;
    this.http.delete(`${API}/admissions/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadAdmissions() });
  }

  // ── HELPERS ──
  getClassName(id: any) { return this.classes.find(c => c.id == id)?.class_name || id; }
  getStudentName(id: any) { const s = this.students.find(s => s.id == id); return s ? s.name_en : `Student #${id}`; }

  // ── HERO SLIDES ──
  loadHeroSlides() {
    this.http.get<any[]>(`${API}/hero-slides/all`, { headers: this.headers }).subscribe({ next: d => { this.heroSlides = d; } });
  }
  openSlideModal() { this.editingSlide = { title_en: '', title_bn: '', subtitle_en: '', subtitle_bn: '', image_data: null, sort_order: 0, is_active: true }; this.slideModal = true; }
  editSlide(s: any) { this.editingSlide = { ...s }; this.slideModal = true; }
  closeSlideModal() { this.slideModal = false; this.editingSlide = null; }
  onSlideImage(e: any) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev: any) => this.editingSlide.image_data = ev.target.result; r.readAsDataURL(f); }
  saveSlide() {
    const obs = this.editingSlide.id
      ? this.http.put(`${API}/hero-slides/${this.editingSlide.id}`, this.editingSlide, { headers: this.headers })
      : this.http.post(`${API}/hero-slides`, this.editingSlide, { headers: this.headers });
    obs.subscribe({ next: () => { this.closeSlideModal(); this.loadHeroSlides(); } });
  }
  deleteSlide(id: number) {
    if (!confirm('Delete this slide?')) return;
    this.http.delete(`${API}/hero-slides/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadHeroSlides() });
  }

  // ── QUICK LINKS ──
  loadQuickLinks() {
    this.http.get<any[]>(`${API}/quick-links`).subscribe({ next: d => { this.quickLinks = d; } });
  }
  openQLModal() { this.editingQL = { label_en: '', label_bn: '', icon: '🔗', link_type: 'login', sort_order: 0 }; this.qlModal = true; }
  editQL(q: any) { this.editingQL = { ...q }; this.qlModal = true; }
  saveQL() {
    const obs = this.editingQL.id
      ? this.http.put(`${API}/quick-links/${this.editingQL.id}`, this.editingQL, { headers: this.headers })
      : this.http.post(`${API}/quick-links`, this.editingQL, { headers: this.headers });
    obs.subscribe({ next: () => { this.qlModal = false; this.loadQuickLinks(); } });
  }
  deleteQL(id: number) {
    if (!confirm('Delete?')) return;
    this.http.delete(`${API}/quick-links/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadQuickLinks() });
  }

  // ── SCHOOL EVENTS ──
  loadSchoolEvents() {
    this.http.get<any[]>(`${API}/events`).subscribe({ next: d => { this.schoolEvents = d; } });
  }
  openEventModal() { this.editingEvent = { title_en: '', title_bn: '', description_en: '', description_bn: '', event_date: new Date().toISOString().split('T')[0], image_data: null, category: 'general' }; this.eventModal = true; }
  editEvent(e: any) { this.editingEvent = { ...e }; this.eventModal = true; }
  closeEventModal() { this.eventModal = false; this.editingEvent = null; }
  onEventImage(e: any) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev: any) => this.editingEvent.image_data = ev.target.result; r.readAsDataURL(f); }
  saveEvent() {
    const obs = this.editingEvent.id
      ? this.http.put(`${API}/events/${this.editingEvent.id}`, this.editingEvent, { headers: this.headers })
      : this.http.post(`${API}/events`, this.editingEvent, { headers: this.headers });
    obs.subscribe({ next: () => { this.closeEventModal(); this.loadSchoolEvents(); } });
  }
  deleteEvent(id: number) {
    if (!confirm('Delete this event?')) return;
    this.http.delete(`${API}/events/${id}`, { headers: this.headers }).subscribe({ next: () => this.loadSchoolEvents() });
  }

  showToast(msg: string) {
    this.toastMsg = msg;
    setTimeout(() => { this.toastMsg = ''; }, 3000);
  }

  visitSite() { this.router.navigate(['/']); }
  logout() { this.auth.logout(); this.router.navigate(['/']); }
}
