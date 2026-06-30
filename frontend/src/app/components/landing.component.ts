import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../services/i18n.service';

const API = 'https://raes-backend.vercel.app/api';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ═══ ALERT / ANNOUNCEMENT BAR ═══ -->
<div class="alert-bar" *ngIf="notices.length">
  <span class="alert-label">📢 {{ i18n.isEn ? 'Notice' : 'নোটিশ' }} :</span>
  <div class="marquee-wrap">
    <div class="marquee-track">
      <span class="marquee-item" *ngFor="let n of notices">
        {{ i18n.isEn ? n.title_en : n.title_bn }}
        <span class="marquee-sep">★</span>
      </span>
      <!-- duplicate for seamless loop -->
      <span class="marquee-item" *ngFor="let n of notices">
        {{ i18n.isEn ? n.title_en : n.title_bn }}
        <span class="marquee-sep">★</span>
      </span>
    </div>
  </div>
  <button class="lang-pill" (click)="i18n.toggle()">{{ i18n.isEn ? 'বাং' : 'EN' }}</button>
</div>

<!-- ═══ HEADER ═══ -->
<header class="site-header">
  <div class="header-inner">
    <div class="header-brand">
      <div class="header-logo">🏫</div>
      <div class="header-brand-text">
        <div class="header-school-name">{{ settings['school_name_bn'] || 'রওশন আমির এলিমেন্টারি স্কুল' }}</div>
        <div class="header-tagline">{{ i18n.isEn ? (settings['tagline_en'] || '') : (settings['tagline_bn'] || '') }}</div>
      </div>
    </div>
    <div class="header-contact">
      <div class="contact-item">📞 {{ settings['phone'] || '+880 1711-000001' }}</div>
      <div class="contact-item">✉ {{ settings['email'] || 'info@rowshonamir.edu.bd' }}</div>
      <div class="contact-item">🕐 {{ i18n.isEn ? (settings['office_hours_en'] || 'Sat–Thu 8AM–4PM') : (settings['office_hours_bn'] || 'শনি–বৃহস্পতি ৮টা–৪টা') }}</div>
    </div>
  </div>
</header>

<!-- ═══ NAVIGATION ═══ -->
<nav class="main-nav" [class.sticky]="scrolled">
  <div class="nav-inner">
    <div class="nav-brand-mini" (click)="goHome()">
      <span>🏫</span> রওশন আমির
    </div>
    <ul class="nav-menu">
      <li><a (click)="goHome()">{{ i18n.isEn ? 'Home' : 'হোম' }}</a></li>
      <li class="has-dropdown">
        <a>{{ i18n.isEn ? 'About' : 'আমাদের সম্পর্কে' }} ▾</a>
        <ul class="dropdown">
          <li><a (click)="scrollTo('about')">{{ i18n.isEn ? 'Our History' : 'আমাদের ইতিহাস' }}</a></li>
          <li><a (click)="scrollTo('mission')">{{ i18n.isEn ? 'Mission & Vision' : 'লক্ষ্য ও উদ্দেশ্য' }}</a></li>
          <li><a (click)="scrollTo('founder')">{{ i18n.isEn ? "Founder's Message" : 'প্রতিষ্ঠাতার বার্তা' }}</a></li>
          <li><a (click)="scrollTo('director')">{{ i18n.isEn ? "Director's Message" : 'পরিচালকের বার্তা' }}</a></li>
          <li><a (click)="scrollTo('principal')">{{ i18n.isEn ? "Principal's Message" : 'প্রধান শিক্ষকের বার্তা' }}</a></li>
        </ul>
      </li>
      <li class="has-dropdown">
        <a>{{ i18n.isEn ? 'Academic' : 'একাডেমিক' }} ▾</a>
        <ul class="dropdown">
          <li><a (click)="scrollTo('programs')">{{ i18n.isEn ? 'Programs' : 'পাঠ্যক্রম' }}</a></li>
          <li><a (click)="goToLogin()">{{ i18n.isEn ? 'Results' : 'ফলাফল' }}</a></li>
          <li><a (click)="goToLogin()">{{ i18n.isEn ? 'Attendance' : 'উপস্থিতি' }}</a></li>
        </ul>
      </li>
      <li><a (click)="scrollTo('notice-section')">{{ i18n.isEn ? 'Notice' : 'নোটিশ' }}</a></li>
      <li><a (click)="scrollTo('events-section')">{{ i18n.isEn ? 'Events' : 'অনুষ্ঠান' }}</a></li>
      <li><a (click)="scrollTo('gallery-section')">{{ i18n.isEn ? 'Gallery' : 'গ্যালারি' }}</a></li>
      <li><a (click)="scrollTo('admission-section')" class="nav-admission-link">🎓 {{ i18n.isEn ? 'Admission' : 'ভর্তি' }}</a></li>
      <li><a (click)="scrollTo('contact')">{{ i18n.isEn ? 'Contact' : 'যোগাযোগ' }}</a></li>
    </ul>
    <button class="nav-login-btn" (click)="goToLogin()">{{ i18n.isEn ? 'Login Portal' : 'পোর্টালে প্রবেশ' }}</button>
  </div>
</nav>

<!-- ═══ HERO CAROUSEL ═══ -->
<section class="hero-carousel">
  <div class="carousel-track" [style.transform]="'translateX(-' + (currentSlide * 100) + '%)'">
    <div class="carousel-slide" *ngFor="let s of heroSlides; let i = index"
         [class]="'slide-gradient-' + ((i % 4) + 1)">
      <img *ngIf="s.image_data" [src]="s.image_data" class="slide-bg-img" alt="">
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <div class="slide-eyebrow">{{ settings['school_name_bn'] || 'রওশন আমির এলিমেন্টারি স্কুল' }}</div>
        <h1 class="slide-title">{{ i18n.isEn ? s.title_en : s.title_bn }}</h1>
        <p class="slide-subtitle">{{ i18n.isEn ? s.subtitle_en : s.subtitle_bn }}</p>
        <div class="slide-actions">
          <button class="slide-btn-primary" (click)="scrollTo('about')">{{ i18n.isEn ? 'Learn More' : 'আরও জানুন' }} →</button>
          <button class="slide-btn-ghost" (click)="scrollTo('programs')">{{ i18n.isEn ? 'Our Programs' : 'পাঠ্যক্রম' }}</button>
        </div>
      </div>
    </div>
  </div>
  <!-- Controls -->
  <button class="carousel-prev" (click)="prevSlide()">‹</button>
  <button class="carousel-next" (click)="nextSlide()">›</button>
  <div class="carousel-dots">
    <button *ngFor="let s of heroSlides; let i = index"
            [class.active]="i === currentSlide"
            (click)="goToSlide(i)"></button>
  </div>
</section>

<!-- ═══ QUICK ACCESS CARDS ═══ -->
<section class="quick-access">
  <div class="qa-inner">
    <div class="qa-card" *ngFor="let q of quickLinks" (click)="handleQuickLink(q)">
      <div class="qa-icon">{{ q.icon }}</div>
      <div class="qa-label">{{ i18n.isEn ? q.label_en : q.label_bn }}</div>
    </div>
  </div>
</section>

<!-- ═══ STATS STRIP ═══ -->
<div class="stats-strip">
  <div class="stats-inner">
    <div class="stat-box">
      <div class="stat-num">{{ settings['stat_students'] || stats.students }}+</div>
      <div class="stat-lbl">{{ i18n.isEn ? 'Students' : 'শিক্ষার্থী' }}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-box">
      <div class="stat-num">{{ settings['stat_teachers'] || stats.teachers }}+</div>
      <div class="stat-lbl">{{ i18n.isEn ? 'Teachers' : 'শিক্ষক' }}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-box">
      <div class="stat-num">{{ settings['stat_years'] || '40' }}+</div>
      <div class="stat-lbl">{{ i18n.isEn ? 'Years of Excellence' : 'বছরের অভিজ্ঞতা' }}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-box">
      <div class="stat-num">{{ settings['stat_classes'] || '5' }}</div>
      <div class="stat-lbl">{{ i18n.isEn ? 'Classes' : 'শ্রেণী' }}</div>
    </div>
  </div>
</div>

<!-- ═══ FOUNDER'S MESSAGE ═══ -->
<section class="founder-section" id="founder" *ngIf="settings['founder_name_en'] || settings['founder_name_bn']">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>{{ i18n.isEn ? "Founder's Message" : 'প্রতিষ্ঠাতার বার্তা' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="principal-grid">
      <div class="principal-photo-col">
        <div class="principal-photo-frame founder-frame">
          <img *ngIf="settings['founder_photo']" [src]="settings['founder_photo']" alt="Founder" class="principal-img">
          <div *ngIf="!settings['founder_photo']" class="principal-placeholder founder-placeholder">
            <div class="placeholder-icon">👴</div>
          </div>
        </div>
        <div class="principal-name">{{ i18n.isEn ? (settings['founder_name_en'] || '') : (settings['founder_name_bn'] || '') }}</div>
        <div class="principal-title-text">{{ i18n.isEn ? (settings['founder_title_en'] || '') : (settings['founder_title_bn'] || '') }}</div>
      </div>
      <div class="principal-msg-col">
        <div class="principal-quote-mark founder-quote">"</div>
        <p class="principal-msg">{{ i18n.isEn ? (settings['founder_message_en'] || '') : (settings['founder_message_bn'] || '') }}</p>
        <div class="principal-sig">— {{ i18n.isEn ? (settings['founder_name_en'] || '') : (settings['founder_name_bn'] || '') }}</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ DIRECTOR'S MESSAGE ═══ -->
<section class="director-section" id="director" *ngIf="settings['director_name_en'] || settings['director_name_bn']">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>{{ i18n.isEn ? "Director's Message" : 'পরিচালকের বার্তা' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="principal-grid director-grid">
      <div class="principal-msg-col">
        <div class="principal-quote-mark director-quote">"</div>
        <p class="principal-msg">{{ i18n.isEn ? (settings['director_message_en'] || '') : (settings['director_message_bn'] || '') }}</p>
        <div class="principal-sig">— {{ i18n.isEn ? (settings['director_name_en'] || '') : (settings['director_name_bn'] || '') }}</div>
      </div>
      <div class="principal-photo-col director-photo-col">
        <div class="principal-photo-frame director-frame">
          <img *ngIf="settings['director_photo']" [src]="settings['director_photo']" alt="Director" class="principal-img">
          <div *ngIf="!settings['director_photo']" class="principal-placeholder director-placeholder">
            <div class="placeholder-icon">👨‍💼</div>
          </div>
        </div>
        <div class="principal-name">{{ i18n.isEn ? (settings['director_name_en'] || '') : (settings['director_name_bn'] || '') }}</div>
        <div class="principal-title-text">{{ i18n.isEn ? (settings['director_title_en'] || '') : (settings['director_title_bn'] || '') }}</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ PRINCIPAL MESSAGE ═══ -->
<section class="principal-section" id="principal">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>{{ i18n.isEn ? "Principal's Message" : 'প্রধান শিক্ষকের বার্তা' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="principal-grid">
      <div class="principal-photo-col">
        <div class="principal-photo-frame">
          <img *ngIf="settings['principal_photo']" [src]="settings['principal_photo']" alt="Principal" class="principal-img">
          <div *ngIf="!settings['principal_photo']" class="principal-placeholder">
            <div class="placeholder-icon">👨‍🏫</div>
          </div>
        </div>
        <div class="principal-name">{{ i18n.isEn ? (settings['principal_name_en'] || 'Md. Karim Hossain') : (settings['principal_name_bn'] || 'মোঃ করিম হোসেন') }}</div>
        <div class="principal-title-text">{{ i18n.isEn ? (settings['principal_title_en'] || 'Principal') : (settings['principal_title_bn'] || 'প্রধান শিক্ষক') }}</div>
      </div>
      <div class="principal-msg-col">
        <div class="principal-quote-mark">"</div>
        <p class="principal-msg">{{ i18n.isEn ? (settings['principal_message_en'] || '') : (settings['principal_message_bn'] || '') }}</p>
        <div class="principal-sig">— {{ i18n.isEn ? (settings['principal_name_en'] || 'Principal') : (settings['principal_name_bn'] || 'প্রধান শিক্ষক') }}</div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ ABOUT / HISTORY ═══ -->
<section class="about-section" id="about">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>{{ i18n.isEn ? 'About Our School' : 'আমাদের বিদ্যালয় সম্পর্কে' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="about-grid">
      <div class="about-text">
        <h3 class="about-sub">{{ i18n.isEn ? 'Our History' : 'আমাদের ইতিহাস' }}</h3>
        <p>{{ i18n.isEn ? (settings['about_en'] || '') : (settings['about_bn'] || '') }}</p>
        <div class="about-highlight">
          <div class="ah-item">
            <span class="ah-year">{{ settings['est_year'] || '1985' }}</span>
            <span class="ah-desc">{{ i18n.isEn ? 'Year Established' : 'প্রতিষ্ঠার বছর' }}</span>
          </div>
          <div class="ah-item">
            <span class="ah-year">Govt.</span>
            <span class="ah-desc">{{ i18n.isEn ? 'Registered' : 'নিবন্ধিত' }}</span>
          </div>
          <div class="ah-item">
            <span class="ah-year">Class<br>1–5</span>
            <span class="ah-desc">{{ i18n.isEn ? 'All Grades' : 'সব শ্রেণী' }}</span>
          </div>
        </div>
      </div>
      <div class="about-visual" id="mission">
        <div class="mv-card mv-mission">
          <div class="mv-icon-big">🎯</div>
          <h3>{{ i18n.isEn ? 'Our Mission' : 'আমাদের লক্ষ্য' }}</h3>
          <p>{{ i18n.isEn ? (settings['mission_en'] || '') : (settings['mission_bn'] || '') }}</p>
        </div>
        <div class="mv-card mv-vision">
          <div class="mv-icon-big">🌟</div>
          <h3>{{ i18n.isEn ? 'Our Vision' : 'আমাদের উদ্দেশ্য' }}</h3>
          <p>{{ i18n.isEn ? (settings['vision_en'] || '') : (settings['vision_bn'] || '') }}</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ PROGRAMS ═══ -->
<section class="programs-section" id="programs">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>{{ i18n.isEn ? 'Academic Programs' : 'পাঠ্যক্রম' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="programs-grid">
      <div class="program-card" *ngFor="let p of programs; let i = index">
        <div class="program-badge">{{ i18n.isEn ? p.class_en : p.class_bn }}</div>
        <div class="program-age">{{ i18n.isEn ? p.age : p.age_bn }}</div>
        <div class="program-subjects">
          <span *ngFor="let s of p.subjects" class="subject-chip">{{ s }}</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ NOTICE + EVENTS (2-col) ═══ -->
<section class="ne-section" id="notice-section">
  <div class="section-container">
    <div class="ne-grid">

      <!-- NOTICES -->
      <div class="ne-col" id="notice-section">
        <div class="ne-header">
          <h2>{{ i18n.isEn ? 'Notice Board' : 'নোটিশ বোর্ড' }}</h2>
          <div class="ne-accent-bar"></div>
        </div>
        <div class="notice-list">
          <div class="notice-row" *ngFor="let n of notices; let i = index"
               (click)="toggleNotice(i)" [class.notice-open]="expandedNotices.has(i)">
            <div class="notice-date-badge">
              <span class="nd-day">{{ n.created_at | date:'dd' }}</span>
              <span class="nd-mon">{{ n.created_at | date:'MMM' }}</span>
            </div>
            <div class="notice-body">
              <div class="notice-type-chip" [class]="'nchip-' + n.type">{{ noticeTypeLbl(n.type) }}</div>
              <div class="notice-title">{{ i18n.isEn ? n.title_en : n.title_bn }}</div>
              <div class="notice-desc" [class.notice-desc-open]="expandedNotices.has(i)" *ngIf="n.content_en || n.content_bn">
                {{ i18n.isEn ? n.content_en : n.content_bn }}
              </div>
              <div class="notice-img-wrap" *ngIf="expandedNotices.has(i) && n.image_data">
                <img [src]="n.image_data" [alt]="i18n.isEn ? n.title_en : n.title_bn" class="notice-full-img">
              </div>
              <div class="notice-expand-hint" *ngIf="n.content_en || n.content_bn || n.image_data">
                {{ expandedNotices.has(i) ? (i18n.isEn ? '▲ Collapse' : '▲ সংকুচিত') : (i18n.isEn ? '▼ Read more' : '▼ পড়ুন') }}
              </div>
            </div>
          </div>
          <div class="ne-empty" *ngIf="!notices.length">{{ i18n.isEn ? 'No notices yet.' : 'কোনো নোটিশ নেই।' }}</div>
        </div>
      </div>

      <!-- EVENTS -->
      <div class="ne-col" id="events-section">
        <div class="ne-header">
          <h2>{{ i18n.isEn ? 'Upcoming Events' : 'আসন্ন অনুষ্ঠান' }}</h2>
          <div class="ne-accent-bar"></div>
        </div>
        <div class="event-list">
          <div class="event-row" *ngFor="let e of events">
            <div class="event-date-badge">
              <span class="ed-day">{{ e.event_date | date:'dd' }}</span>
              <span class="ed-mon">{{ e.event_date | date:'MMM yyyy' }}</span>
            </div>
            <div class="event-body">
              <div class="event-cat-chip">{{ eventCatLbl(e.category) }}</div>
              <div class="event-title">{{ i18n.isEn ? e.title_en : e.title_bn }}</div>
              <div class="event-desc" *ngIf="e.description_en">{{ i18n.isEn ? e.description_en : e.description_bn }}</div>
            </div>
            <div class="event-thumb" *ngIf="e.image_data">
              <img [src]="e.image_data" [alt]="e.title_en">
            </div>
          </div>
          <div class="ne-empty" *ngIf="!events.length">{{ i18n.isEn ? 'No events yet.' : 'কোনো অনুষ্ঠান নেই।' }}</div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- ═══ GALLERY ═══ -->
<section class="gallery-section" id="gallery-section" *ngIf="gallery.length">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>{{ i18n.isEn ? 'Photo Gallery' : 'ফটো গ্যালারি' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="gallery-grid">
      <div class="gallery-item" *ngFor="let g of gallery.slice(0,8)">
        <img [src]="g.image_data" [alt]="g.title" loading="lazy">
        <div class="gallery-item-overlay">
          <div class="gallery-item-title">{{ g.title }}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ ADMISSION SECTION ═══ -->
<section class="admission-section" id="admission-section">
  <div class="section-container">
    <div class="section-title-bar">
      <span class="section-title-line"></span>
      <h2>🎓 {{ i18n.isEn ? 'Admission 2026' : 'ভর্তি ২০২৬' }}</h2>
      <span class="section-title-line"></span>
    </div>
    <div class="admission-grid">
      <!-- Info Column -->
      <div class="adm-info-col">
        <div class="adm-info-card">
          <h3>{{ i18n.isEn ? 'Admission Information' : 'ভর্তি সংক্রান্ত তথ্য' }}</h3>
          <ul class="adm-info-list">
            <li><span class="adm-bullet">📋</span> {{ i18n.isEn ? 'Application available online below' : 'নিচে অনলাইনে আবেদন করুন' }}</li>
            <li><span class="adm-bullet">📅</span> {{ i18n.isEn ? 'Admission open: January – March 2026' : 'ভর্তি চলছে: জানুয়ারি – মার্চ ২০২৬' }}</li>
            <li><span class="adm-bullet">🏫</span> {{ i18n.isEn ? 'Classes: Play Group, Nursery, Class 1–5' : 'শ্রেণী: প্লে গ্রুপ, নার্সারি, ১ম–৫ম শ্রেণী' }}</li>
            <li><span class="adm-bullet">📞</span> {{ i18n.isEn ? 'Contact us for details' : 'বিস্তারিতের জন্য যোগাযোগ করুন' }}</li>
          </ul>
          <div class="adm-class-badges">
            <span class="adm-class-badge">🌱 Play Group</span>
            <span class="adm-class-badge">🌿 Nursery</span>
            <span class="adm-class-badge">📖 Class 1</span>
            <span class="adm-class-badge">📖 Class 2</span>
            <span class="adm-class-badge">📖 Class 3</span>
            <span class="adm-class-badge">📖 Class 4</span>
            <span class="adm-class-badge">📖 Class 5</span>
          </div>
        </div>
      </div>

      <!-- Form Column -->
      <div class="adm-form-col">
        <div class="adm-form-card" *ngIf="!admissionSubmitted">
          <h3>📝 {{ i18n.isEn ? 'Online Application Form' : 'অনলাইন আবেদন ফর্ম' }}</h3>
          <div class="adm-form-grid">
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Student Name (English) *' : 'শিক্ষার্থীর নাম (ইংরেজি) *' }}</label>
              <input class="adm-input" [(ngModel)]="admForm.student_name_en" placeholder="Full name in English">
            </div>
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Student Name (Bengali)' : 'শিক্ষার্থীর নাম (বাংলা)' }}</label>
              <input class="adm-input" [(ngModel)]="admForm.student_name_bn" placeholder="বাংলায় নাম">
            </div>
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Date of Birth' : 'জন্ম তারিখ' }}</label>
              <input class="adm-input" type="date" [(ngModel)]="admForm.date_of_birth">
            </div>
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Gender' : 'লিঙ্গ' }}</label>
              <select class="adm-input" [(ngModel)]="admForm.gender">
                <option value="">{{ i18n.isEn ? 'Select' : 'নির্বাচন করুন' }}</option>
                <option value="Male">{{ i18n.isEn ? 'Male' : 'ছেলে' }}</option>
                <option value="Female">{{ i18n.isEn ? 'Female' : 'মেয়ে' }}</option>
              </select>
            </div>
            <div class="adm-form-group span2">
              <label>{{ i18n.isEn ? 'Class Applying For *' : 'যে শ্রেণীতে ভর্তি হতে চান *' }}</label>
              <select class="adm-input" [(ngModel)]="admForm.class_applying">
                <option value="">{{ i18n.isEn ? 'Select class' : 'শ্রেণী নির্বাচন করুন' }}</option>
                <option value="Play Group">🌱 Play Group (প্লে গ্রুপ)</option>
                <option value="Nursery">🌿 Nursery (নার্সারি)</option>
                <option value="Class 1">Class 1 (প্রথম শ্রেণী)</option>
                <option value="Class 2">Class 2 (দ্বিতীয় শ্রেণী)</option>
                <option value="Class 3">Class 3 (তৃতীয় শ্রেণী)</option>
                <option value="Class 4">Class 4 (চতুর্থ শ্রেণী)</option>
                <option value="Class 5">Class 5 (পঞ্চম শ্রেণী)</option>
              </select>
            </div>
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Guardian Name' : 'অভিভাবকের নাম' }}</label>
              <input class="adm-input" [(ngModel)]="admForm.guardian_name" placeholder="{{ i18n.isEn ? 'Father/Mother/Guardian' : 'পিতা/মাতা/অভিভাবক' }}">
            </div>
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Phone Number *' : 'ফোন নম্বর *' }}</label>
              <input class="adm-input" type="tel" [(ngModel)]="admForm.guardian_phone" placeholder="01XXXXXXXXX">
            </div>
            <div class="adm-form-group">
              <label>Email</label>
              <input class="adm-input" type="email" [(ngModel)]="admForm.guardian_email" placeholder="email@example.com">
            </div>
            <div class="adm-form-group">
              <label>{{ i18n.isEn ? 'Address' : 'ঠিকানা' }}</label>
              <input class="adm-input" [(ngModel)]="admForm.address" placeholder="{{ i18n.isEn ? 'Home address' : 'বাড়ির ঠিকানা' }}">
            </div>
          </div>
          <div class="adm-error" *ngIf="admFormError">{{ admFormError }}</div>
          <button class="adm-submit-btn" (click)="submitAdmission()" [disabled]="admSubmitting">
            {{ admSubmitting ? (i18n.isEn ? 'Submitting...' : 'জমা হচ্ছে...') : (i18n.isEn ? 'Submit Application' : 'আবেদন জমা দিন') }} →
          </button>
        </div>
        <div class="adm-success-card" *ngIf="admissionSubmitted">
          <div class="adm-success-icon">✅</div>
          <h3>{{ i18n.isEn ? 'Application Submitted!' : 'আবেদন সফলভাবে জমা হয়েছে!' }}</h3>
          <p>{{ i18n.isEn ? 'Thank you for applying. We will contact you shortly.' : 'আবেদনের জন্য ধন্যবাদ। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।' }}</p>
          <p style="font-size:.85rem;color:var(--muted)">{{ admSubmitMsg }}</p>
          <button class="adm-submit-btn" style="margin-top:1rem" (click)="admissionSubmitted=false;admForm={student_name_en:'',student_name_bn:'',date_of_birth:'',gender:'',class_applying:'',guardian_name:'',guardian_phone:'',guardian_email:'',address:''}">{{ i18n.isEn ? 'Submit Another' : 'আরেকটি আবেদন করুন' }}</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ FOOTER ═══ -->
<footer class="site-footer" id="contact">
  <div class="footer-inner">
    <div class="footer-col footer-brand-col">
      <div class="footer-logo">🏫</div>
      <div class="footer-school">{{ settings['school_name_bn'] || 'রওশন আমির এলিমেন্টারি স্কুল' }}</div>
      <p class="footer-desc">{{ i18n.isEn ? (settings['tagline_en'] || '') : (settings['tagline_bn'] || '') }}</p>
      <div class="footer-social">
        <a *ngIf="settings['facebook_url']" [href]="settings['facebook_url']" target="_blank" class="social-btn">f</a>
      </div>
    </div>
    <div class="footer-col">
      <h4>{{ i18n.isEn ? 'Quick Links' : 'দ্রুত লিংক' }}</h4>
      <ul>
        <li><a (click)="goHome()">{{ i18n.isEn ? 'Home' : 'হোম' }}</a></li>
        <li><a (click)="scrollTo('about')">{{ i18n.isEn ? 'About School' : 'বিদ্যালয় সম্পর্কে' }}</a></li>
        <li><a (click)="scrollTo('programs')">{{ i18n.isEn ? 'Programs' : 'পাঠ্যক্রম' }}</a></li>
        <li><a (click)="scrollTo('notice-section')">{{ i18n.isEn ? 'Notice Board' : 'নোটিশ বোর্ড' }}</a></li>
        <li><a (click)="scrollTo('gallery-section')">{{ i18n.isEn ? 'Gallery' : 'গ্যালারি' }}</a></li>
        <li><a (click)="scrollTo('events-section')">{{ i18n.isEn ? 'Events' : 'অনুষ্ঠান' }}</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>{{ i18n.isEn ? 'Contact Us' : 'যোগাযোগ' }}</h4>
      <ul>
        <li>📍 {{ i18n.isEn ? (settings['address_en'] || '') : (settings['address_bn'] || '') }}</li>
        <li>📞 {{ settings['phone'] || '' }}</li>
        <li>✉ {{ settings['email'] || '' }}</li>
        <li>🕐 {{ i18n.isEn ? (settings['office_hours_en'] || '') : (settings['office_hours_bn'] || '') }}</li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© {{ currentYear }} {{ settings['school_name_bn'] || 'রওশন আমির এলিমেন্টারি স্কুল' }}. {{ i18n.isEn ? 'All Rights Reserved.' : 'সর্বস্বত্ব সংরক্ষিত।' }} &nbsp;|&nbsp; Powered by <strong>Specter Technologies Ltd.</strong></span>
    <button class="footer-lang-btn" (click)="i18n.toggle()">{{ i18n.isEn ? 'বাংলা' : 'English' }}</button>
  </div>
</footer>
  `,
  styles: [`
    :host {
      --green: #1A4731;
      --green-dark: #0f3020;
      --green-light: #2a6046;
      --gold: #D4911A;
      --gold-light: #F5E6C8;
      --parch: #F7F5EC;
      --white: #ffffff;
      --text: #1C2A1D;
      --muted: #5a6a5c;
      --border: rgba(26,71,49,0.12);
      --shadow: 0 4px 24px rgba(0,0,0,0.08);
      display: block;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
      color: var(--text);
      background: var(--white);
    }

    /* ── ALERT BAR ── */
    .alert-bar {
      background: var(--gold);
      color: #fff;
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .35rem 1rem;
      font-size: .82rem;
      font-family: 'DM Sans', sans-serif;
      overflow: hidden;
    }
    .alert-label { font-weight: 700; white-space: nowrap; flex-shrink: 0; }
    .marquee-wrap { flex: 1; overflow: hidden; }
    .marquee-track { display: flex; width: max-content; animation: marquee 40s linear infinite; }
    .marquee-track:hover { animation-play-state: paused; }
    .marquee-item { white-space: nowrap; padding: 0 2rem; }
    .marquee-sep { margin: 0 .5rem; opacity: .6; }
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .lang-pill { flex-shrink: 0; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: .15rem .6rem; border-radius: 2rem; font-size: .75rem; cursor: pointer; font-family: 'Noto Sans Bengali', sans-serif; }

    /* ── HEADER ── */
    .site-header { background: var(--green); color: rgba(255,255,255,0.9); }
    .header-inner { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .header-brand { display: flex; align-items: center; gap: 1rem; }
    .header-logo { font-size: 2.8rem; line-height: 1; }
    .header-school-name { font-family: 'Noto Serif Bengali', serif; font-size: 1.3rem; font-weight: 700; color: #fff; line-height: 1.2; }
    .header-tagline { font-size: .78rem; color: rgba(255,255,255,.65); margin-top: .2rem; font-family: 'DM Sans', sans-serif; }
    .header-contact { display: flex; flex-direction: column; gap: .3rem; align-items: flex-end; }
    .contact-item { font-size: .78rem; color: rgba(255,255,255,.75); font-family: 'DM Sans', sans-serif; }

    /* ── NAVIGATION ── */
    .main-nav { background: var(--green-dark); position: sticky; top: 0; z-index: 200; box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
    .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; align-items: center; gap: 1rem; }
    .nav-brand-mini { color: rgba(255,255,255,.7); font-size: .85rem; padding: .75rem 0; cursor: pointer; white-space: nowrap; display: none; }
    .nav-menu { display: flex; list-style: none; margin: 0; padding: 0; flex: 1; }
    .nav-menu li { position: relative; }
    .nav-menu li a { display: block; color: rgba(255,255,255,.85); padding: .85rem .9rem; font-size: .82rem; cursor: pointer; white-space: nowrap; transition: all .15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; border-bottom: 3px solid transparent; }
    .nav-menu li a:hover { color: #fff; border-bottom-color: var(--gold); background: rgba(255,255,255,.06); }
    .has-dropdown { position: relative; }
    .dropdown { display: none; position: absolute; top: 100%; left: 0; background: var(--green-dark); min-width: 200px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); z-index: 300; border-top: 3px solid var(--gold); }
    .has-dropdown:hover .dropdown { display: block; }
    .dropdown li a { padding: .65rem 1rem; font-size: .8rem; border-bottom: 1px solid rgba(255,255,255,.06); }
    .nav-login-btn { background: var(--gold); color: #fff; border: none; padding: .5rem 1.2rem; border-radius: 3px; font-size: .82rem; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; transition: background .15s; flex-shrink: 0; }
    .nav-login-btn:hover { background: #b87a14; }

    /* ── HERO CAROUSEL ── */
    .hero-carousel { position: relative; overflow: hidden; height: 520px; }
    .carousel-track { display: flex; height: 100%; transition: transform .6s cubic-bezier(0.4,0,0.2,1); }
    .carousel-slide { flex: 0 0 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
    .slide-gradient-1 { background: linear-gradient(135deg, #1A4731 0%, #2a6046 50%, #0f3020 100%); }
    .slide-gradient-2 { background: linear-gradient(135deg, #0f3020 0%, #1A4731 40%, #D4911A 100%); }
    .slide-gradient-3 { background: linear-gradient(135deg, #2a6046 0%, #1a3a28 50%, #0a2010 100%); }
    .slide-gradient-4 { background: linear-gradient(135deg, #1a3a28 0%, #2a5040 50%, #D4911A 100%); }
    .slide-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 1; }
    .slide-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.08) 100%); }
    .slide-content { position: relative; z-index: 2; max-width: 700px; padding: 0 4rem; text-align: left; }
    .slide-eyebrow { font-size: .85rem; color: var(--gold); font-family: 'DM Sans', sans-serif; letter-spacing: .12em; text-transform: uppercase; margin-bottom: .75rem; }
    .slide-title { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 2.6rem; font-weight: 700; color: #fff; line-height: 1.2; margin: 0 0 .75rem; }
    .slide-subtitle { font-size: 1.05rem; color: rgba(255,255,255,.8); margin-bottom: 1.5rem; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .slide-actions { display: flex; gap: .75rem; flex-wrap: wrap; }
    .slide-btn-primary { background: var(--gold); color: #fff; border: none; padding: .75rem 1.6rem; border-radius: 3px; font-size: .9rem; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; transition: background .15s; }
    .slide-btn-primary:hover { background: #b87a14; }
    .slide-btn-ghost { background: transparent; border: 2px solid rgba(255,255,255,.5); color: rgba(255,255,255,.85); padding: .7rem 1.4rem; border-radius: 3px; font-size: .9rem; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; transition: all .15s; }
    .slide-btn-ghost:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,.08); }
    .carousel-prev, .carousel-next { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.35); border: none; color: #fff; width: 44px; height: 44px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; z-index: 10; transition: background .15s; line-height: 1; display: flex; align-items: center; justify-content: center; }
    .carousel-prev { left: 1rem; }
    .carousel-next { right: 1rem; }
    .carousel-prev:hover, .carousel-next:hover { background: rgba(0,0,0,.6); }
    .carousel-dots { position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); display: flex; gap: .4rem; z-index: 10; }
    .carousel-dots button { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,.6); background: transparent; cursor: pointer; transition: all .2s; }
    .carousel-dots button.active { background: var(--gold); border-color: var(--gold); transform: scale(1.2); }

    /* ── QUICK ACCESS ── */
    .quick-access { background: var(--white); box-shadow: var(--shadow); position: relative; z-index: 5; }
    .qa-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: center; flex-wrap: wrap; }
    .qa-card { flex: 1; min-width: 140px; max-width: 200px; display: flex; flex-direction: column; align-items: center; gap: .4rem; padding: 1.25rem 1rem; cursor: pointer; border-right: 1px solid var(--border); transition: all .2s; }
    .qa-card:last-child { border-right: none; }
    .qa-card:hover { background: var(--green); }
    .qa-card:hover .qa-icon, .qa-card:hover .qa-label { color: #fff; }
    .qa-icon { font-size: 1.8rem; transition: color .2s; }
    .qa-label { font-size: .82rem; font-weight: 600; color: var(--text); text-align: center; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; transition: color .2s; }

    /* ── STATS STRIP ── */
    .stats-strip { background: var(--green); color: #fff; }
    .stats-inner { max-width: 1200px; margin: 0 auto; display: flex; justify-content: center; align-items: center; padding: 2rem; flex-wrap: wrap; gap: 0; }
    .stat-box { flex: 1; min-width: 150px; text-align: center; padding: 1rem; }
    .stat-num { font-family: 'Cormorant Garamond', serif; font-size: 2.8rem; font-weight: 700; color: var(--gold); line-height: 1; }
    .stat-lbl { font-size: .82rem; color: rgba(255,255,255,.75); margin-top: .2rem; font-family: 'DM Sans', sans-serif; }
    .stat-divider { width: 1px; height: 60px; background: rgba(255,255,255,.2); flex-shrink: 0; }

    /* ── SECTION SHARED ── */
    .section-container { max-width: 1200px; margin: 0 auto; padding: 3.5rem 2rem; }
    .section-title-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 2.5rem; }
    .section-title-bar h2 { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.65rem; font-weight: 700; color: var(--green); white-space: nowrap; }
    .section-title-line { flex: 1; height: 2px; background: linear-gradient(to right, var(--green), var(--gold), rgba(212,145,26,0)); }
    .section-title-line:first-child { background: linear-gradient(to left, var(--green), rgba(26,71,49,0)); }

    /* ── PRINCIPAL ── */
    .principal-section { background: var(--parch); border-top: 4px solid var(--green); }
    .principal-grid { display: grid; grid-template-columns: 280px 1fr; gap: 3rem; align-items: start; }
    .principal-photo-frame { width: 200px; height: 220px; border: 4px solid var(--green); border-radius: 4px; overflow: hidden; margin-bottom: 1rem; }
    .principal-img { width: 100%; height: 100%; object-fit: cover; }
    .principal-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, var(--green), var(--green-light)); display: flex; align-items: center; justify-content: center; }
    .placeholder-icon { font-size: 4rem; }
    .principal-name { font-family: 'Noto Serif Bengali', serif; font-size: 1.1rem; font-weight: 700; color: var(--green); }
    .principal-title-text { font-size: .8rem; color: var(--muted); margin-top: .2rem; }
    .principal-quote-mark { font-size: 5rem; color: var(--gold); line-height: .8; font-family: Georgia, serif; margin-bottom: .5rem; }
    .principal-msg { font-size: 1rem; color: var(--text); line-height: 1.8; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .principal-sig { margin-top: 1.25rem; font-style: italic; color: var(--green); font-weight: 600; border-top: 1px solid var(--border); padding-top: .75rem; }

    /* ── ABOUT ── */
    .about-section { background: var(--white); }
    .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .about-text h3.about-sub { font-family: 'Noto Serif Bengali', serif; color: var(--green); font-size: 1.1rem; margin-bottom: .75rem; }
    .about-text p { line-height: 1.8; color: var(--muted); }
    .about-highlight { display: flex; gap: 1.5rem; margin-top: 1.5rem; flex-wrap: wrap; }
    .ah-item { text-align: center; background: var(--parch); border: 1px solid var(--border); border-radius: 6px; padding: .75rem 1rem; min-width: 80px; }
    .ah-year { display: block; font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 700; color: var(--green); line-height: 1.1; }
    .ah-desc { display: block; font-size: .72rem; color: var(--muted); margin-top: .2rem; }
    .mv-card { background: var(--green); color: #fff; border-radius: 6px; padding: 1.5rem; margin-bottom: 1rem; }
    .mv-card:last-child { margin-bottom: 0; background: var(--green-dark); }
    .mv-icon-big { font-size: 1.8rem; margin-bottom: .5rem; }
    .mv-card h3 { font-family: 'Noto Serif Bengali', serif; font-size: 1.05rem; margin-bottom: .5rem; color: var(--gold-light); }
    .mv-card p { font-size: .85rem; line-height: 1.7; color: rgba(255,255,255,.8); }

    /* ── PROGRAMS ── */
    .programs-section { background: var(--parch); }
    .programs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
    .program-card { background: var(--white); border-radius: 6px; padding: 1.25rem 1rem; border: 1px solid var(--border); border-top: 4px solid var(--green); text-align: center; }
    .program-badge { font-family: 'Noto Serif Bengali', serif; font-size: 1rem; font-weight: 700; color: var(--green); margin-bottom: .5rem; }
    .program-age { font-size: .75rem; color: var(--muted); margin-bottom: .75rem; font-family: 'DM Sans', sans-serif; }
    .program-subjects { display: flex; flex-wrap: wrap; gap: .3rem; justify-content: center; }
    .subject-chip { font-size: .68rem; background: var(--parch); border: 1px solid var(--border); color: var(--text); padding: .1rem .4rem; border-radius: 2rem; }

    /* ── NOTICE + EVENTS ── */
    .ne-section { background: var(--white); border-top: 1px solid var(--border); }
    .ne-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .ne-header { margin-bottom: 1.25rem; }
    .ne-header h2 { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.35rem; font-weight: 700; color: var(--green); margin-bottom: .5rem; }
    .ne-accent-bar { height: 3px; width: 60px; background: var(--gold); border-radius: 2px; }
    .notice-list, .event-list { display: flex; flex-direction: column; gap: 0; }
    .notice-row, .event-row { display: flex; gap: .75rem; align-items: flex-start; padding: .85rem 0; border-bottom: 1px solid var(--border); }
    .notice-row:last-child, .event-row:last-child { border-bottom: none; }
    .notice-date-badge, .event-date-badge { flex-shrink: 0; width: 46px; text-align: center; background: var(--green); color: #fff; border-radius: 4px; padding: .35rem .25rem; }
    .nd-day, .ed-day { display: block; font-size: 1.2rem; font-weight: 700; line-height: 1; font-family: 'DM Sans', sans-serif; }
    .nd-mon, .ed-mon { display: block; font-size: .6rem; font-family: 'DM Sans', sans-serif; opacity: .8; margin-top: .1rem; }
    .notice-body, .event-body { flex: 1; }
    .notice-type-chip, .event-cat-chip { display: inline-block; font-size: .65rem; padding: .1rem .45rem; border-radius: 2rem; margin-bottom: .3rem; font-family: 'DM Sans', sans-serif; font-weight: 600; }
    .nchip-exam { background: #FEF3C7; color: #92400E; }
    .nchip-event { background: #EDE9FE; color: #5B21B6; }
    .nchip-fee { background: #D1FAE5; color: #065F46; }
    .nchip-holiday { background: #F3F4F6; color: #374151; }
    .nchip-general { background: #DBEAFE; color: #1E40AF; }
    .event-cat-chip { background: rgba(26,71,49,.1); color: var(--green); }
    .notice-title, .event-title { font-size: .88rem; font-weight: 600; color: var(--text); line-height: 1.4; }
    .notice-desc, .event-desc { font-size: .78rem; color: var(--muted); margin-top: .25rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .event-thumb { flex-shrink: 0; width: 70px; height: 60px; border-radius: 4px; overflow: hidden; }
    .event-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ne-empty { padding: 1.5rem 0; color: var(--muted); font-size: .875rem; text-align: center; }
    .ne-more-btn { margin-top: 1rem; background: none; border: 2px solid var(--green); color: var(--green); padding: .5rem 1.2rem; border-radius: 3px; font-size: .82rem; font-weight: 600; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; transition: all .15s; }
    .ne-more-btn:hover { background: var(--green); color: #fff; }

    /* ── GALLERY ── */
    .gallery-section { background: var(--parch); }
    .gallery-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }
    .gallery-item { position: relative; aspect-ratio: 4/3; border-radius: 4px; overflow: hidden; cursor: pointer; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s; display: block; }
    .gallery-item:hover img { transform: scale(1.06); }
    .gallery-item-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.7), transparent); opacity: 0; transition: opacity .2s; display: flex; align-items: flex-end; padding: .75rem; }
    .gallery-item:hover .gallery-item-overlay { opacity: 1; }
    .gallery-item-title { color: #fff; font-size: .78rem; font-weight: 600; }

    /* ── FOUNDER / DIRECTOR ── */
    .founder-section { background: #f0f7f3; border-top: 4px solid var(--gold); }
    .founder-frame { border-color: var(--gold); }
    .founder-placeholder { background: linear-gradient(135deg, #8B6914, #D4911A); }
    .founder-quote { color: var(--green); }
    .director-section { background: var(--white); border-top: 4px solid var(--green-light); }
    .director-grid { grid-template-columns: 1fr 280px; }
    .director-photo-col { text-align: right; }
    .director-photo-col .principal-photo-frame { margin-left: auto; }
    .director-frame { border-color: var(--green-light); }
    .director-placeholder { background: linear-gradient(135deg, var(--green-light), var(--green)); }
    .director-quote { color: var(--gold); }

    /* ── NOTICE EXPAND ── */
    .notice-row { cursor: pointer; border-radius: 4px; transition: background .12s; }
    .notice-row:hover { background: rgba(26,71,49,.04); }
    .notice-desc-open { -webkit-line-clamp: unset !important; display: block !important; }
    .notice-open .notice-title { color: var(--green); }
    .notice-expand-hint { font-size: .68rem; color: var(--green); margin-top: .25rem; font-weight: 600; opacity: .7; }
    .notice-img-wrap { margin-top: .75rem; border-radius: 6px; overflow: hidden; border: 1px solid var(--border); }
    .notice-full-img { width: 100%; height: auto; max-height: 320px; object-fit: contain; display: block; background: var(--parch); }

    /* ── FOOTER ── */
    .site-footer { background: var(--green-dark); color: rgba(255,255,255,.8); }
    .footer-inner { max-width: 1200px; margin: 0 auto; padding: 3rem 2rem 2rem; display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 2.5rem; }
    .footer-logo { font-size: 2.5rem; margin-bottom: .5rem; }
    .footer-school { font-family: 'Noto Serif Bengali', serif; font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: .5rem; }
    .footer-desc { font-size: .8rem; color: rgba(255,255,255,.55); line-height: 1.6; margin-bottom: 1rem; }
    .footer-social { display: flex; gap: .5rem; }
    .social-btn { width: 32px; height: 32px; background: rgba(255,255,255,.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-weight: 700; font-size: .85rem; transition: background .15s; }
    .social-btn:hover { background: var(--gold); }
    .footer-col h4 { font-size: .85rem; font-weight: 700; color: var(--gold); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 1rem; font-family: 'DM Sans', sans-serif; }
    .footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
    .footer-col ul li, .footer-col ul li a { font-size: .82rem; color: rgba(255,255,255,.65); cursor: pointer; transition: color .15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .footer-col ul li a:hover { color: var(--gold); }
    .footer-bottom { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem; border-top: 1px solid rgba(255,255,255,.1); display: flex; justify-content: space-between; align-items: center; font-size: .78rem; color: rgba(255,255,255,.45); }
    .footer-lang-btn { background: none; border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.6); padding: .2rem .6rem; border-radius: 2rem; font-size: .75rem; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .footer-lang-btn:hover { border-color: var(--gold); color: var(--gold); }

    /* ── ADMISSION ── */
    .admission-section { background: var(--parch); border-top: 4px solid var(--green); }
    .admission-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2.5rem; align-items: start; }
    .adm-info-card { background: var(--green); color: #fff; border-radius: 8px; padding: 2rem; }
    .adm-info-card h3 { font-family: 'Noto Serif Bengali', serif; font-size: 1.1rem; font-weight: 700; color: var(--gold-light); margin-bottom: 1.25rem; }
    .adm-info-list { list-style: none; padding: 0; margin: 0 0 1.25rem; display: flex; flex-direction: column; gap: .75rem; }
    .adm-info-list li { display: flex; align-items: flex-start; gap: .6rem; font-size: .88rem; color: rgba(255,255,255,.85); line-height: 1.5; }
    .adm-bullet { flex-shrink: 0; font-size: 1rem; }
    .adm-class-badges { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .5rem; }
    .adm-class-badge { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.9); padding: .2rem .6rem; border-radius: 2rem; font-size: .75rem; font-family: 'DM Sans', sans-serif; }
    .adm-form-card { background: #fff; border-radius: 8px; padding: 2rem; border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
    .adm-form-card h3 { font-family: 'Noto Serif Bengali', serif; font-size: 1.05rem; font-weight: 700; color: var(--green); margin-bottom: 1.25rem; }
    .adm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem 1rem; margin-bottom: 1rem; }
    .adm-form-group { display: flex; flex-direction: column; gap: .3rem; }
    .adm-form-group.span2 { grid-column: span 2; }
    .adm-form-group label { font-size: .78rem; font-weight: 600; color: var(--muted); }
    .adm-input { border: 1.5px solid var(--border); border-radius: 6px; padding: .5rem .75rem; font-size: .875rem; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; background: var(--parch); color: var(--text); outline: none; transition: border .15s; width: 100%; box-sizing: border-box; }
    .adm-input:focus { border-color: var(--green); background: #fff; }
    .adm-error { background: #FEE2E2; color: #991B1B; border-radius: 6px; padding: .5rem .75rem; font-size: .82rem; margin-bottom: .75rem; }
    .adm-submit-btn { width: 100%; background: var(--green); color: #fff; border: none; border-radius: 6px; padding: .8rem 1.5rem; font-size: .9rem; font-weight: 700; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; transition: background .15s; }
    .adm-submit-btn:hover:not(:disabled) { background: var(--green-light); }
    .adm-submit-btn:disabled { opacity: .6; cursor: default; }
    .adm-success-card { background: #fff; border-radius: 8px; padding: 2.5rem 2rem; text-align: center; border: 2px solid #059669; }
    .adm-success-icon { font-size: 3rem; margin-bottom: .75rem; }
    .adm-success-card h3 { font-family: 'Noto Serif Bengali', serif; color: #059669; font-size: 1.2rem; margin-bottom: .5rem; }
    .adm-success-card p { color: var(--muted); font-size: .88rem; line-height: 1.6; }
    .nav-admission-link { color: var(--gold) !important; font-weight: 700 !important; }
  `]
})
export class LandingComponent implements OnInit, OnDestroy {
  i18n = inject(I18nService);
  router = inject(Router);
  http = inject(HttpClient);

  scrolled = false;
  currentYear = new Date().getFullYear();
  currentSlide = 0;
  private slideTimer: any;

  settings: any = {};
  heroSlides: any[] = [];
  quickLinks: any[] = [];
  notices: any[] = [];
  events: any[] = [];
  gallery: any[] = [];
  stats = { students: 0, teachers: 0 };
  expandedNotices = new Set<number>();

  // Admission form
  admForm: any = { student_name_en: '', student_name_bn: '', date_of_birth: '', gender: '', class_applying: '', guardian_name: '', guardian_phone: '', guardian_email: '', address: '' };
  admFormError = '';
  admSubmitting = false;
  admissionSubmitted = false;
  admSubmitMsg = '';

  programs = [
    { class_en: 'Play Group', class_bn: 'প্লে গ্রুপ', age: 'Age 3–4', age_bn: 'বয়স ৩–৪', subjects: ['বাংলা', 'Drawing', 'Songs', 'Play'] },
    { class_en: 'Nursery', class_bn: 'নার্সারি', age: 'Age 4–5', age_bn: 'বয়স ৪–৫', subjects: ['বাংলা', 'English', 'Drawing', 'Math'] },
    { class_en: 'Class One', class_bn: 'প্রথম শ্রেণী', age: 'Age 6–7', age_bn: 'বয়স ৬–৭', subjects: ['বাংলা', 'English', 'Math', 'GK'] },
    { class_en: 'Class Two', class_bn: 'দ্বিতীয় শ্রেণী', age: 'Age 7–8', age_bn: 'বয়স ৭–৮', subjects: ['বাংলা', 'English', 'Math', 'Science'] },
    { class_en: 'Class Three', class_bn: 'তৃতীয় শ্রেণী', age: 'Age 8–9', age_bn: 'বয়স ৮–৯', subjects: ['বাংলা', 'English', 'Math', 'Science', 'Social'] },
    { class_en: 'Class Four', class_bn: 'চতুর্থ শ্রেণী', age: 'Age 9–10', age_bn: 'বয়স ৯–১০', subjects: ['বাংলা', 'English', 'Math', 'Science', 'Social', 'ধর্ম'] },
    { class_en: 'Class Five', class_bn: 'পঞ্চম শ্রেণী', age: 'Age 10–11', age_bn: 'বয়স ১০–১১', subjects: ['বাংলা', 'English', 'Math', 'Science', 'Social', 'ধর্ম', 'ICT'] },
  ];

  @HostListener('window:scroll')
  onScroll() { this.scrolled = window.scrollY > 80; }

  ngOnInit() {
    this.http.get<any>(`${API}/website-settings`).subscribe({ next: d => { this.settings = d || {}; } });
    this.http.get<any[]>(`${API}/hero-slides`).subscribe({ next: d => { this.heroSlides = d?.length ? d : this.defaultSlides(); this.startSlider(); } });
    this.http.get<any[]>(`${API}/quick-links`).subscribe({ next: d => { this.quickLinks = d; } });
    this.http.get<any[]>(`${API}/notices/public`).subscribe({ next: d => { this.notices = d || []; } });
    this.http.get<any[]>(`${API}/events`).subscribe({ next: d => { this.events = d || []; } });
    this.http.get<any[]>(`${API}/gallery`).subscribe({ next: d => { this.gallery = d || []; } });
    this.http.get<any[]>(`${API}/students`).subscribe({ next: d => this.stats.students = d.length });
    this.http.get<any[]>(`${API}/teachers`).subscribe({ next: d => this.stats.teachers = d.length });
  }

  ngOnDestroy() { clearInterval(this.slideTimer); }

  defaultSlides() {
    return [
      { title_en: 'Welcome to Rowshon Amir Elementary School', title_bn: 'রওশন আমির এলিমেন্টারি স্কুল-এ স্বাগতম', subtitle_en: 'Nurturing Young Minds Since 1985', subtitle_bn: '১৯৮৫ সাল থেকে তরুণ মেধার বিকাশে', image_data: null },
      { title_en: 'Quality Education for Every Child', title_bn: 'প্রতিটি শিশুর জন্য মানসম্পন্ন শিক্ষা', subtitle_en: 'Building Tomorrow\'s Leaders Today', subtitle_bn: 'আজকের শিশু, আগামীর নেতৃত্ব', image_data: null },
      { title_en: 'Admission Open 2026', title_bn: 'ভর্তি চলছে ২০২৬', subtitle_en: 'Join our family of learners', subtitle_bn: 'আমাদের শিক্ষার পরিবারে যোগ দিন', image_data: null },
    ];
  }

  startSlider() {
    clearInterval(this.slideTimer);
    this.slideTimer = setInterval(() => this.nextSlide(), 5000);
  }

  nextSlide() { this.currentSlide = (this.currentSlide + 1) % this.heroSlides.length; }
  prevSlide() { this.currentSlide = (this.currentSlide - 1 + this.heroSlides.length) % this.heroSlides.length; }
  goToSlide(i: number) { this.currentSlide = i; this.startSlider(); }

  handleQuickLink(q: any) {
    if (q.link_type === 'admin' || q.link_type === 'teacher' || q.link_type === 'student') {
      this.router.navigate(['/login']);
    } else if (q.link_type === 'notice') {
      this.scrollTo('notice-section');
    } else if (q.link_type === 'gallery') {
      this.scrollTo('gallery-section');
    } else if (q.link_type === 'contact') {
      this.scrollTo('contact');
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleNotice(i: number) {
    if (this.expandedNotices.has(i)) this.expandedNotices.delete(i);
    else this.expandedNotices.add(i);
  }

  noticeTypeLbl(type: string): string {
    const m: any = { exam: 'Exam', event: 'Event', fee: 'Fee', holiday: 'Holiday', general: 'Notice' };
    return m[type] || 'Notice';
  }

  eventCatLbl(cat: string): string {
    const m: any = { sports: 'Sports', academic: 'Academic', ceremony: 'Ceremony', meeting: 'Meeting', general: 'Event' };
    return m[cat] || 'Event';
  }

  goHome() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  goToLogin() { this.router.navigate(['/login']); }
  scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  submitAdmission() {
    this.admFormError = '';
    if (!this.admForm.student_name_en.trim()) { this.admFormError = 'শিক্ষার্থীর নাম (ইংরেজি) আবশ্যক।'; return; }
    if (!this.admForm.class_applying) { this.admFormError = 'শ্রেণী নির্বাচন করুন।'; return; }
    if (!this.admForm.guardian_phone.trim()) { this.admFormError = 'অভিভাবকের ফোন নম্বর আবশ্যক।'; return; }
    this.admSubmitting = true;
    this.http.post<any>(`${API}/admissions`, this.admForm).subscribe({
      next: (r) => {
        this.admSubmitting = false;
        this.admissionSubmitted = true;
        this.admSubmitMsg = r.message || '';
      },
      error: (e) => {
        this.admSubmitting = false;
        this.admFormError = e?.error?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      }
    });
  }
}
