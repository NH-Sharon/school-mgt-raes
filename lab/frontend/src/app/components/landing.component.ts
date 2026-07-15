import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <h2>{{ i18n.isEn ? 'Virtual labs, chapter notes and MCQ exams for Classes 6-12' : 'ষষ্ঠ থেকে দ্বাদশ শ্রেণির জন্য ভার্চুয়াল ল্যাব, অধ্যায় নোট ও এমসিকিউ পরীক্ষা' }}</h2>
      <p>{{ i18n.isEn ? 'NCTB-aligned Physics, Chemistry, Biology and ICT — simulate, learn, and test yourself, with every attempt tracked on a beautiful dashboard.' : 'NCTB সিলেবাস অনুযায়ী পদার্থ, রসায়ন, জীববিজ্ঞান ও আইসিটি — সিমুলেট করুন, পড়ুন এবং নিজেকে যাচাই করুন, প্রতিটি প্রচেষ্টা সুন্দর ড্যাশবোর্ডে ট্র্যাক হবে।' }}</p>
      <div class="cta-row">
        <button class="primary-btn" (click)="go(auth.isLoggedIn() ? '/subjects' : '/register')">
          {{ i18n.isEn ? 'Get Started' : 'শুরু করুন' }}
        </button>
        <button class="ghost-btn" *ngIf="!auth.isLoggedIn()" (click)="go('/login')">{{ i18n.t('login') }}</button>
      </div>
    </section>

    <section class="feature-grid">
      <div class="feature-card" *ngFor="let f of features">
        <div class="feature-icon">{{ f.icon }}</div>
        <h3>{{ i18n.isEn ? f.titleEn : f.titleBn }}</h3>
        <p>{{ i18n.isEn ? f.descEn : f.descBn }}</p>
      </div>
    </section>
  `,
  styles: [`
    .hero { text-align: center; padding: 48px 20px 24px; max-width: 760px; margin: 0 auto; }
    .hero h2 { font-size: 1.6rem; color: #1a6d5e; margin: 0 0 12px; }
    .hero p { color: #55666f; line-height: 1.6; }
    .cta-row { display: flex; gap: 10px; justify-content: center; margin-top: 18px; flex-wrap: wrap; }
    .primary-btn {
      background: linear-gradient(135deg, #1a6d5e, #144f45); color: #fff; border: none;
      padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 0.95rem;
    }
    .ghost-btn { background: transparent; border: 1px solid #cfd9dd; color: #33454f; padding: 11px 20px; border-radius: 10px; }
    .feature-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px; max-width: 1100px; margin: 20px auto 48px; padding: 0 20px;
    }
    .feature-card { background: #fff; border: 1px solid #e2e8ec; border-radius: 14px; padding: 20px; text-align: center; }
    .feature-icon { font-size: 2rem; margin-bottom: 8px; }
    .feature-card h3 { font-size: 1rem; margin: 0 0 6px; color: #1a6d5e; }
    .feature-card p { font-size: 0.85rem; color: #667680; line-height: 1.5; margin: 0; }
  `],
})
export class LandingComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);
  go(path: string) { this.router.navigateByUrl(path); }

  features = [
    { icon: '⚗️', titleBn: 'ভার্চুয়াল ল্যাব সিমুলেশন', titleEn: 'Virtual Lab Simulations', descBn: 'পদার্থ, রসায়ন, জীববিজ্ঞান ও আইসিটির ইন্টারেক্টিভ পরীক্ষা।', descEn: 'Interactive Physics, Chemistry, Biology and ICT experiments.' },
    { icon: '📘', titleBn: 'অধ্যায়ভিত্তিক পাঠ', titleEn: 'Chapter-wise Learning', descBn: 'নোট, সূত্র ও ডায়াগ্রাম সহ প্রতিটি অধ্যায়।', descEn: 'Notes, formulas and diagrams for every chapter.' },
    { icon: '📝', titleBn: 'এমসিকিউ পরীক্ষা', titleEn: 'MCQ Examinations', descBn: 'টাইমার, নেগেটিভ মার্কিং ও তাৎক্ষণিক ব্যাখ্যাসহ।', descEn: 'Timed, with negative marking and instant explanations.' },
    { icon: '📊', titleBn: 'অগ্রগতি ড্যাশবোর্ড', titleEn: 'Progress Dashboard', descBn: 'প্রতিটি কার্যকলাপ সুন্দরভাবে ট্র্যাক ও দৃশ্যমান।', descEn: 'Every activity tracked and beautifully visualized.' },
  ];
}
