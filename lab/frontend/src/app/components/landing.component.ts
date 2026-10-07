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
    <!-- ================= HERO ================= -->
    <section class="hero">
      <div class="blob b1"></div><div class="blob b2"></div>
      <div class="hero-in">
        <div class="hero-copy">
          <span class="eyebrow">🇧🇩 {{ i18n.isEn ? 'NCTB-aligned · Classes 6–12' : 'NCTB সিলেবাস · ষষ্ঠ থেকে দ্বাদশ' }}</span>
          <h1>{{ i18n.isEn ? 'Do real experiments,' : 'হাতে-কলমে পরীক্ষা করুন,' }}<br><span class="grad">{{ i18n.isEn ? 'right from your screen.' : 'স্ক্রিনেই, নিরাপদে।' }}</span></h1>
          <p class="lead">{{ i18n.isEn
              ? 'Physics, Chemistry, Biology and ICT virtual labs with real equipment, exact amounts and step-by-step explanations — plus chapter notes and MCQ exams.'
              : 'পদার্থ, রসায়ন, জীববিজ্ঞান ও আইসিটির ভার্চুয়াল ল্যাব — আসল যন্ত্রপাতি, নিজের পছন্দমতো পরিমাণ আর ধাপে ধাপে বাংলা ব্যাখ্যা। সাথে অধ্যায়ভিত্তিক পাঠ ও এমসিকিউ পরীক্ষা।' }}</p>
          <div class="cta-row">
            <ng-container *ngIf="!auth.isLoggedIn(); else loggedInCta">
              <button class="btn primary" (click)="go('/register')">🚀 {{ i18n.isEn ? 'Get started free' : 'বিনামূল্যে শুরু করুন' }}</button>
              <button class="btn ghost" (click)="go('/login')">{{ i18n.t('login') }}</button>
            </ng-container>
            <ng-template #loggedInCta>
              <button class="btn primary" (click)="go('/labs')">🧪 {{ i18n.isEn ? 'Open the labs' : 'ল্যাবে যান' }}</button>
              <button class="btn ghost" (click)="go('/dashboard')">📊 {{ i18n.t('dashboard') }}</button>
            </ng-template>
          </div>
          <ul class="trust">
            <li><b>4</b><span>{{ i18n.isEn ? 'subjects' : 'বিষয়' }}</span></li>
            <li><b>৬–১২</b><span>{{ i18n.isEn ? 'classes' : 'শ্রেণি' }}</span></li>
            <li><b>বাংলা + EN</b><span>{{ i18n.isEn ? 'bilingual' : 'দ্বিভাষিক' }}</span></li>
            <li><b>📱</b><span>{{ i18n.isEn ? 'works on phones' : 'মোবাইলেও চলে' }}</span></li>
          </ul>
        </div>

        <!-- animated lab scene -->
        <div class="hero-art" aria-hidden="true">
          <svg viewBox="0 0 420 340" class="scene">
            <defs>
              <linearGradient id="gl" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#d9f3ee" stop-opacity=".6"/></linearGradient>
              <linearGradient id="la" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5ad4c3"/><stop offset="1" stop-color="#1a8f7e"/></linearGradient>
              <linearGradient id="lb" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f7a8d8"/><stop offset="1" stop-color="#d9559f"/></linearGradient>
              <linearGradient id="lc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fb4ff"/><stop offset="1" stop-color="#2f6bd8"/></linearGradient>
              <clipPath id="cf"><path d="M178 60 V120 L120 230 Q112 252 134 252 H246 Q268 252 260 230 L202 120 V60 Z"/></clipPath>
              <clipPath id="ct"><path d="M312 110 V232 A22 22 0 0 0 356 232 V110 Z"/></clipPath>
              <clipPath id="cb"><path d="M44 140 V240 Q44 252 56 252 H116 Q128 252 128 240 V140 Z"/></clipPath>
            </defs>
            <rect x="0" y="262" width="420" height="14" rx="7" fill="#b98b5a"/><rect x="20" y="276" width="380" height="8" rx="4" fill="#8f6a3f" opacity=".5"/>
            <!-- beaker -->
            <g clip-path="url(#cb)"><rect x="40" y="170" width="92" height="90" fill="url(#lc)"/></g>
            <path d="M44 140 V240 Q44 252 56 252 H116 Q128 252 128 240 V140" fill="none" stroke="#bfe5ef" stroke-width="3" stroke-linecap="round"/><path d="M38 140 H134" stroke="#bfe5ef" stroke-width="3" stroke-linecap="round"/>
            <!-- flask -->
            <g clip-path="url(#cf)"><rect x="110" y="168" width="170" height="90" fill="url(#la)" class="wave"/></g>
            <path d="M178 60 V120 L120 230 Q112 252 134 252 H246 Q268 252 260 230 L202 120 V60" fill="url(#gl)" stroke="#bfe5ef" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M170 60 H210" stroke="#bfe5ef" stroke-width="3.5" stroke-linecap="round"/>
            <!-- test tube -->
            <g clip-path="url(#ct)"><rect x="300" y="150" width="70" height="110" fill="url(#lb)"/></g>
            <path d="M312 110 V232 A22 22 0 0 0 356 232 V110" fill="none" stroke="#bfe5ef" stroke-width="3" stroke-linecap="round"/><path d="M306 110 H362" stroke="#bfe5ef" stroke-width="3" stroke-linecap="round"/>
            <!-- bubbles -->
            <g class="bub"><circle cx="190" cy="215" r="5"/><circle cx="214" cy="225" r="4"/><circle cx="200" cy="232" r="3.2"/><circle cx="228" cy="210" r="3"/></g>
            <g class="bub b2"><circle cx="334" cy="215" r="4"/><circle cx="344" cy="228" r="3"/><circle cx="326" cy="236" r="2.6"/></g>
            <g class="bub b3"><circle cx="76" cy="222" r="4"/><circle cx="96" cy="232" r="3"/><circle cx="106" cy="216" r="2.6"/></g>
            <!-- steam -->
            <g class="steam"><circle cx="190" cy="48" r="9"/><circle cx="204" cy="36" r="7"/><circle cx="194" cy="22" r="6"/></g>
            <!-- dropper -->
            <g class="dropper"><rect x="330" y="30" width="12" height="26" rx="6" fill="#d9534f"/><rect x="328" y="54" width="16" height="8" rx="2" fill="#8d9aa3"/><path d="M331 62 H341 V84 L336 98 L331 84 Z" fill="#fff" fill-opacity=".7" stroke="#bfe5ef" stroke-width="2"/></g>
            <circle class="drop" cx="336" cy="104" r="3.6" fill="#e8629b"/>
            <!-- formula chips -->
            <g font-family="sans-serif" font-weight="700" font-size="13"><rect x="26" y="70" width="72" height="28" rx="14" fill="#fff"/><text x="62" y="89" text-anchor="middle" fill="#1a6d5e">H₂ + O₂</text>
            <rect x="248" y="86" width="64" height="26" rx="13" fill="#fff"/><text x="280" y="104" text-anchor="middle" fill="#1a6d5e">pH 7</text></g>
          </svg>
        </div>
      </div>
    </section>

    <!-- ================= SUBJECTS ================= -->
    <section class="block">
      <div class="head"><h2>{{ i18n.isEn ? 'Four subjects, one lab' : 'চারটি বিষয়, একটি ল্যাব' }}</h2><p>{{ i18n.isEn ? 'Pick a subject and jump straight into an experiment.' : 'বিষয় বেছে সরাসরি পরীক্ষায় ঢুকে পড়ুন।' }}</p></div>
      <div class="subjects">
        <article class="subj" *ngFor="let s of subjects" [style.--c1]="s.c1" [style.--c2]="s.c2" (click)="go(auth.isLoggedIn() ? '/labs' : '/register')">
          <span class="s-ico">{{ s.icon }}</span>
          <h3>{{ i18n.isEn ? s.en : s.bn }}</h3>
          <p>{{ i18n.isEn ? s.descEn : s.descBn }}</p>
          <span class="go">{{ i18n.isEn ? 'Explore' : 'দেখুন' }} →</span>
        </article>
      </div>
    </section>

    <!-- ================= CHEMISTRY SPOTLIGHT ================= -->
    <section class="block spot">
      <div class="spot-in">
        <div class="spot-copy">
          <span class="eyebrow dark">⚗️ {{ i18n.isEn ? 'Chemistry lab bench' : 'রসায়ন ল্যাব বেঞ্চ' }}</span>
          <h2>{{ i18n.isEn ? 'It feels like a real lab.' : 'একদম আসল ল্যাবের অনুভূতি।' }}</h2>
          <p>{{ i18n.isEn
              ? 'Take reagents from the cabinet, use a spoon, dropper, forceps and funnel, choose your own quantity and watch the reaction unfold — with the reason behind every colour, bubble and precipitate.'
              : 'আলমারি থেকে রাসায়নিক নিন, চামচ-ড্রপার-চিমটা-ফানেল ব্যবহার করুন, নিজের পছন্দমতো পরিমাণ দিন আর বিক্রিয়া ঘটতে দেখুন — প্রতিটি রং, বুদবুদ ও অধঃক্ষেপ কেন হলো তার ব্যাখ্যাসহ।' }}</p>
          <ul class="ticks">
            <li *ngFor="let t of spotPoints">✔ {{ i18n.isEn ? t.en : t.bn }}</li>
          </ul>
          <button class="btn primary" (click)="go(auth.isLoggedIn() ? '/labs' : '/register')">🧪 {{ i18n.isEn ? 'Try the chemistry lab' : 'রসায়ন ল্যাব চালিয়ে দেখুন' }}</button>
        </div>
        <div class="spot-card">
          <div class="mini-h"><span>⚗️ Zn + 2HCl → ZnCl₂ + H₂↑</span><i>● ● ●</i></div>
          <div class="mini-row"><span>🧴 HCl</span><b>10 mL</b></div>
          <div class="mini-row"><span>🔩 Zn</span><b>0.5 g</b></div>
          <div class="mini-bar"><span></span></div>
          <div class="mini-meta"><span>⏱ 105 s</span><span>💨 H₂ ≈ 120 mL</span><span>🌡 +18 °C</span></div>
          <p class="mini-why">❓ {{ i18n.isEn ? 'Zinc is more reactive than hydrogen, so it pushes H⁺ out of the acid.' : 'জিংক হাইড্রোজেনের চেয়ে সক্রিয়, তাই এসিড থেকে H⁺ সরিয়ে দেয়।' }}</p>
        </div>
      </div>
    </section>

    <!-- ================= FEATURES ================= -->
    <section class="block">
      <div class="head"><h2>{{ i18n.isEn ? 'Everything you need to learn' : 'শেখার জন্য যা যা লাগে' }}</h2></div>
      <div class="features">
        <div class="feature" *ngFor="let f of features">
          <div class="f-ico">{{ f.icon }}</div>
          <h3>{{ i18n.isEn ? f.titleEn : f.titleBn }}</h3>
          <p>{{ i18n.isEn ? f.descEn : f.descBn }}</p>
        </div>
      </div>
    </section>

    <!-- ================= STEPS ================= -->
    <section class="block">
      <div class="head"><h2>{{ i18n.isEn ? 'How it works' : 'কীভাবে কাজ করে' }}</h2></div>
      <ol class="steps">
        <li *ngFor="let s of steps; let i = index"><span class="num">{{ i + 1 }}</span><div><h3>{{ i18n.isEn ? s.en : s.bn }}</h3><p>{{ i18n.isEn ? s.descEn : s.descBn }}</p></div></li>
      </ol>
    </section>

    <!-- ================= CTA ================= -->
    <section class="cta">
      <h2>{{ i18n.isEn ? 'Ready to experiment?' : 'পরীক্ষা শুরু করতে প্রস্তুত?' }}</h2>
      <p>{{ i18n.isEn ? 'Create a free account — pick your class and begin in under a minute.' : 'বিনামূল্যে অ্যাকাউন্ট খুলুন — শ্রেণি বেছে এক মিনিটেই শুরু করুন।' }}</p>
      <div class="cta-row center">
        <button class="btn light" (click)="go(auth.isLoggedIn() ? '/labs' : '/register')">{{ auth.isLoggedIn() ? (i18n.isEn ? 'Open labs' : 'ল্যাবে যান') : (i18n.isEn ? 'Create account' : 'অ্যাকাউন্ট খুলুন') }}</button>
        <button class="btn outline" *ngIf="!auth.isLoggedIn()" (click)="go('/login')">{{ i18n.t('login') }}</button>
      </div>
    </section>

    <footer class="foot">
      <span>🧪 {{ i18n.t('appName') }}</span>
      <span>{{ i18n.isEn ? 'Interactive lab simulation, learning and MCQ exam platform' : 'ইন্টারেক্টিভ ল্যাব সিমুলেশন, শিক্ষা ও এমসিকিউ পরীক্ষা প্ল্যাটফর্ম' }}</span>
    </footer>
  `,
  styles: [`
    :host { display: block; color: #22323b; overflow-x: hidden; }
    .btn { border: none; border-radius: 12px; padding: 13px 24px; font-weight: 700; font-size: .95rem; cursor: pointer; transition: .18s; font-family: inherit; }
    .btn.primary { background: linear-gradient(135deg, #1f8a76, #144f45); color: #fff; box-shadow: 0 8px 20px rgba(20,79,69,.28); }
    .btn.primary:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(20,79,69,.34); }
    .btn.ghost { background: #fff; border: 1px solid #cfd9dd; color: #33454f; }
    .btn.ghost:hover { border-color: #1a6d5e; color: #1a6d5e; }
    .btn.light { background: #fff; color: #144f45; }
    .btn.light:hover { transform: translateY(-2px); }
    .btn.outline { background: transparent; border: 1.5px solid rgba(255,255,255,.7); color: #fff; }
    .cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
    .cta-row.center { justify-content: center; }

    /* hero */
    .hero { position: relative; padding: 56px 20px 40px; background: linear-gradient(180deg, #e9f6f3 0%, #f4f7f7 100%); overflow: hidden; }
    .blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .55; pointer-events: none; }
    .blob.b1 { width: 340px; height: 340px; background: #7fe0d2; top: -90px; left: -80px; }
    .blob.b2 { width: 300px; height: 300px; background: #ffd9a0; bottom: -100px; right: 5%; opacity: .45; }
    .hero-in { position: relative; max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: 1.05fr .95fr; gap: 28px; align-items: center; }
    .eyebrow { display: inline-block; background: #fff; border: 1px solid #cfe3de; color: #1a6d5e; padding: 5px 13px; border-radius: 99px; font-size: .78rem; font-weight: 700; box-shadow: 0 2px 6px rgba(20,60,50,.08); }
    .eyebrow.dark { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.3); color: #d7f5ef; box-shadow: none; }
    h1 { font-size: 2.6rem; line-height: 1.18; margin: 14px 0 12px; color: #12362f; letter-spacing: -.01em; }
    .grad { background: linear-gradient(90deg, #1a8f7e, #2f6bd8); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .lead { font-size: 1.05rem; line-height: 1.7; color: #4b5c66; max-width: 560px; margin: 0; }
    .trust { list-style: none; display: flex; gap: 22px; margin: 26px 0 0; padding: 0; flex-wrap: wrap; }
    .trust li { display: flex; flex-direction: column; }
    .trust b { font-size: 1.15rem; color: #1a6d5e; }
    .trust span { font-size: .76rem; color: #6b7a84; }
    .hero-art { display: flex; justify-content: center; }
    .scene { width: 100%; max-width: 460px; filter: drop-shadow(0 18px 24px rgba(20,60,50,.18)); }
    .bub circle { fill: rgba(255,255,255,.85); animation: rise 3s ease-in infinite; }
    .bub circle:nth-child(2) { animation-delay: .7s; } .bub circle:nth-child(3) { animation-delay: 1.4s; } .bub circle:nth-child(4) { animation-delay: 2.1s; }
    .bub.b2 circle { animation-duration: 2.6s; } .bub.b3 circle { animation-duration: 3.4s; }
    @keyframes rise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .95; } 100% { transform: translateY(-70px); opacity: 0; } }
    .steam circle { fill: rgba(255,255,255,.9); animation: steam 3.4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
    .steam circle:nth-child(2) { animation-delay: 1s; } .steam circle:nth-child(3) { animation-delay: 2s; }
    @keyframes steam { 0% { transform: translateY(24px) scale(.5); opacity: 0; } 25% { opacity: .9; } 100% { transform: translateY(-26px) scale(1.7); opacity: 0; } }
    .wave { animation: sway 4s ease-in-out infinite; transform-origin: center; }
    @keyframes sway { 50% { transform: translateY(-3px); } }
    .dropper { animation: squeeze 3s ease-in-out infinite; transform-origin: 336px 60px; }
    @keyframes squeeze { 0%, 70%, 100% { transform: translateY(0); } 80% { transform: translateY(2px); } }
    .drop { animation: drop 3s ease-in infinite; }
    @keyframes drop { 0%, 60% { transform: translateY(-6px); opacity: 0; } 72% { opacity: 1; } 100% { transform: translateY(46px); opacity: .2; } }

    /* sections */
    .block { max-width: 1120px; margin: 0 auto; padding: 56px 20px 8px; }
    .head { text-align: center; margin-bottom: 26px; }
    .head h2 { font-size: 1.8rem; margin: 0 0 6px; color: #12362f; }
    .head p { margin: 0; color: #6b7a84; }

    .subjects { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; }
    .subj { position: relative; color: #fff; padding: 22px 20px 18px; border-radius: 18px; cursor: pointer; overflow: hidden; background: linear-gradient(135deg, var(--c1), var(--c2)); box-shadow: 0 10px 24px rgba(20,40,40,.14); transition: .2s; }
    .subj::after { content: ''; position: absolute; width: 140px; height: 140px; right: -40px; top: -40px; border-radius: 50%; background: rgba(255,255,255,.14); }
    .subj:hover { transform: translateY(-5px); box-shadow: 0 16px 32px rgba(20,40,40,.22); }
    .s-ico { font-size: 2.2rem; display: block; margin-bottom: 8px; }
    .subj h3 { margin: 0 0 4px; font-size: 1.12rem; }
    .subj p { margin: 0 0 14px; font-size: .84rem; line-height: 1.55; opacity: .92; }
    .go { font-weight: 700; font-size: .84rem; }

    .spot { max-width: none; padding: 0; margin-top: 56px; background: linear-gradient(135deg, #12362f, #1a6d5e); color: #fff; }
    .spot-in { max-width: 1120px; margin: 0 auto; padding: 52px 20px; display: grid; grid-template-columns: 1.1fr .9fr; gap: 34px; align-items: center; }
    .spot h2 { font-size: 1.9rem; margin: 12px 0 10px; }
    .spot p { color: #cfe9e3; line-height: 1.7; }
    .ticks { list-style: none; padding: 0; margin: 14px 0 20px; display: grid; gap: 7px; color: #e5f6f2; font-size: .92rem; }
    .spot-card { background: #fff; color: #22323b; border-radius: 18px; padding: 16px 18px; box-shadow: 0 20px 40px rgba(0,0,0,.28); transform: rotate(1.5deg); }
    .mini-h { display: flex; justify-content: space-between; font-weight: 700; font-size: .9rem; color: #144f45; margin-bottom: 10px; }
    .mini-h i { font-style: normal; color: #cfd9dd; letter-spacing: 2px; }
    .mini-row { display: flex; justify-content: space-between; background: #f2f9f7; border-radius: 9px; padding: 8px 12px; margin-bottom: 6px; font-size: .9rem; }
    .mini-bar { height: 9px; border-radius: 9px; background: #e3ece9; overflow: hidden; margin: 12px 0 8px; }
    .mini-bar span { display: block; height: 100%; width: 72%; background: linear-gradient(90deg, #37c2b5, #1a6d5e); border-radius: 9px; animation: fill 3.5s ease-in-out infinite alternate; }
    @keyframes fill { from { width: 18%; } to { width: 96%; } }
    .mini-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: .78rem; color: #55666f; }
    .mini-why { margin: 10px 0 0; font-size: .82rem; background: #eef6f4; border-left: 3px solid #1a6d5e; padding: 7px 10px; border-radius: 6px; color: #33454f !important; line-height: 1.5; }

    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 860px) { .features { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .features { grid-template-columns: 1fr; } }
    .feature { background: #fff; border: 1px solid #e2e8ec; border-radius: 16px; padding: 20px; transition: .2s; }
    .feature:hover { border-color: #9fd3c9; box-shadow: 0 10px 22px rgba(20,60,50,.1); transform: translateY(-3px); }
    .f-ico { width: 46px; height: 46px; border-radius: 13px; background: #eef6f4; display: grid; place-items: center; font-size: 1.5rem; margin-bottom: 10px; }
    .feature h3 { margin: 0 0 5px; font-size: 1rem; color: #144f45; }
    .feature p { margin: 0; font-size: .86rem; color: #667680; line-height: 1.6; }

    .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; counter-reset: s; }
    .steps li { display: flex; gap: 14px; align-items: flex-start; background: #fff; border: 1px solid #e2e8ec; border-radius: 16px; padding: 18px; }
    .num { flex: 0 0 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #37c2b5, #1a6d5e); color: #fff; display: grid; place-items: center; font-weight: 800; }
    .steps h3 { margin: 0 0 3px; font-size: .98rem; }
    .steps p { margin: 0; font-size: .84rem; color: #667680; line-height: 1.55; }

    .cta { margin: 56px 20px 0; border-radius: 22px; padding: 44px 20px; text-align: center; color: #fff; max-width: 1080px; margin-left: auto; margin-right: auto;
      background: radial-gradient(600px 200px at 85% 0%, rgba(255,255,255,.2), transparent 60%), linear-gradient(135deg, #1f8a76, #144f45); }
    .cta h2 { margin: 0 0 6px; font-size: 1.7rem; }
    .cta p { margin: 0; opacity: .9; }
    .foot { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; max-width: 1120px; margin: 0 auto; padding: 26px 20px 34px; color: #6b7a84; font-size: .8rem; }

    @media (max-width: 860px) {
      .hero-in, .spot-in { grid-template-columns: 1fr; }
      .hero-art { order: -1; } .scene { max-width: 320px; }
      h1 { font-size: 1.9rem; } .head h2 { font-size: 1.45rem; } .spot h2 { font-size: 1.5rem; }
      .spot-card { transform: none; }
      .cta { margin-left: 16px; margin-right: 16px; }
    }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  `],
})
export class LandingComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);
  private router = inject(Router);
  go(path: string) { this.router.navigateByUrl(path); }

  subjects = [
    { icon: '⚗️', bn: 'রসায়ন', en: 'Chemistry', descBn: 'এসিড-ক্ষার, বিক্রিয়া, টাইট্রেশন — পরিমাণ ও সময় নিজে ঠিক করে পরীক্ষা করুন।', descEn: 'Acids, bases, reactions, titration — set amounts and time yourself.', c1: '#1f8a76', c2: '#144f45' },
    { icon: '⚡', bn: 'পদার্থবিজ্ঞান', en: 'Physics', descBn: 'দোলক, বর্তনী, লেন্স — মান বদলে ফলাফল দেখুন।', descEn: 'Pendulum, circuits, lenses — change values and watch results.', c1: '#3b7ddd', c2: '#23459a' },
    { icon: '🧬', bn: 'জীববিজ্ঞান', en: 'Biology', descBn: 'অণুবীক্ষণ যন্ত্র ও সালোকসংশ্লেষণ — জীবনের রহস্য কাছ থেকে।', descEn: 'Microscope and photosynthesis — life up close.', c1: '#43a56b', c2: '#216b43' },
    { icon: '💻', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'ICT', descBn: 'লজিক গেট ও HTML/CSS এডিটর — করে করে শিখুন।', descEn: 'Logic gates and a live HTML/CSS editor — learn by doing.', c1: '#8a5cd6', c2: '#533299' },
  ];

  spotPoints = [
    { bn: 'আসল ল্যাবের যন্ত্রপাতি: টেস্ট টিউব, বীকার, ফ্লাস্ক, ফানেল, ড্রপার, চামচ, চিমটা, বার্নার', en: 'Real equipment: test tubes, beakers, flasks, funnel, dropper, spoon, forceps, burner' },
    { bn: 'নিজের পছন্দমতো পরিমাণ (mL / g / ফোঁটা) ও বিক্রিয়ার সময় নিয়ন্ত্রণ', en: 'Choose your own quantity (mL / g / drops) and control reaction time' },
    { bn: 'কী ঘটছে, কেন ঘটছে, কীভাবে ঘটছে — বাংলায় বিস্তারিত ব্যাখ্যা', en: 'What, why and how it happens — explained in Bangla' },
    { bn: 'ভুল রাসায়নিক বা ঝুঁকিপূর্ণ কাজে সঙ্গে সঙ্গে সতর্কতা', en: 'Instant warnings for wrong chemicals or risky actions' },
  ];

  features = [
    { icon: '🧪', titleBn: 'ভার্চুয়াল ল্যাব সিমুলেশন', titleEn: 'Virtual Lab Simulations', descBn: 'গাইডেড ও ফ্রি মোডে ইন্টারেক্টিভ পরীক্ষা, নিরাপত্তা-যাচাইসহ।', descEn: 'Guided and free-mode interactive experiments with a safety check.' },
    { icon: '📘', titleBn: 'অধ্যায়ভিত্তিক পাঠ', titleEn: 'Chapter-wise Learning', descBn: 'নোট, সূত্র ও ডায়াগ্রামসহ প্রতিটি অধ্যায়।', descEn: 'Notes, formulas and diagrams for every chapter.' },
    { icon: '📝', titleBn: 'এমসিকিউ পরীক্ষা', titleEn: 'MCQ Examinations', descBn: 'টাইমার, নেগেটিভ মার্কিং ও তাৎক্ষণিক ব্যাখ্যা।', descEn: 'Timer, negative marking and instant explanations.' },
    { icon: '📊', titleBn: 'অগ্রগতি ড্যাশবোর্ড', titleEn: 'Progress Dashboard', descBn: 'বিষয়ভিত্তিক দক্ষতা, স্কোর প্রবণতা ও কার্যকলাপের ছক।', descEn: 'Mastery by subject, score trend and an activity grid.' },
    { icon: '👨‍🏫', titleBn: 'শিক্ষক ও অভিভাবকের জন্য', titleEn: 'For Teachers & Guardians', descBn: 'শ্রেণির ফলাফল, দুর্বল অধ্যায় ও সাপ্তাহিক সারসংক্ষেপ।', descEn: 'Class results, weak chapters and weekly summaries.' },
    { icon: '🌐', titleBn: 'বাংলা ও ইংরেজি', titleEn: 'Bangla & English', descBn: 'এক ক্লিকে ভাষা বদলান; মোবাইলেও সুন্দরভাবে চলে।', descEn: 'Switch language in one click; works great on phones.' },
  ];

  steps = [
    { bn: 'অ্যাকাউন্ট খুলুন', en: 'Create an account', descBn: 'শ্রেণি ও মাধ্যম বেছে নিন।', descEn: 'Pick your class and medium.' },
    { bn: 'ল্যাব বেছে নিন', en: 'Choose a lab', descBn: 'শ্রেণি → বিষয় → অধ্যায় থেকে প্রয়োজনীয় ল্যাব।', descEn: 'Class → subject → chapter.' },
    { bn: 'পরীক্ষা করুন', en: 'Experiment', descBn: 'নিজের পরিমাণে রাসায়নিক নিন, বিক্রিয়া ঘটান।', descEn: 'Use your own amounts and react.' },
    { bn: 'বুঝুন ও যাচাই করুন', en: 'Understand & test', descBn: 'ব্যাখ্যা পড়ুন, এমসিকিউ দিন, অগ্রগতি দেখুন।', descEn: 'Read the explanation, take MCQs, track progress.' },
  ];
}
