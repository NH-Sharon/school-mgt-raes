import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DashboardService } from '../services/dashboard.service';
import { I18nService } from '../services/i18n.service';

interface ActivityGroup { kind: 'exam' | 'simulation'; title: string; count: number; last: string; detail: string; ok: boolean; }
interface HeatCell { day: string; count: number; level: number; future: boolean; label: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="loading-state" *ngIf="role === 'student' && !student || role === 'teacher' && !teacher">
        <div class="spinner"></div><p>{{ i18n.t('loading') }}</p>
      </div>

      <ng-container [ngSwitch]="role">

        <!-- ================= STUDENT ================= -->
        <div *ngSwitchCase="'student'">
          <ng-container *ngIf="student as s">
            <!-- hero -->
            <section class="hero">
              <div class="hero-text">
                <p class="hello">{{ i18n.isEn ? 'Welcome back' : 'স্বাগতম' }},</p>
                <h1>{{ userName }}</h1>
                <p class="hero-sub">
                  <span class="pill">{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ classLevel }}</span>
                  <span class="pill warm">🔥 {{ s.streakDays }} {{ i18n.isEn ? 'day streak' : 'দিনের ধারা' }}</span>
                  <span class="pill">⭐ {{ s.points }} {{ i18n.t('points') }}</span>
                </p>
              </div>
              <div class="hero-actions">
                <button class="act primary" (click)="go('/labs')">🧪 {{ i18n.isEn ? 'Open a lab' : 'ল্যাবে যান' }}</button>
                <button class="act" (click)="go('/practice')">📝 {{ i18n.isEn ? 'Practice exam' : 'অনুশীলন পরীক্ষা' }}</button>
                <button class="act" (click)="go('/subjects')">📚 {{ i18n.isEn ? 'Study' : 'অধ্যয়ন' }}</button>
              </div>
            </section>

            <!-- stats -->
            <section class="stats">
              <div class="stat"><span class="si">🧪</span><b>{{ s.simulationsCompleted }}</b><small>{{ i18n.isEn ? 'Labs completed' : 'সম্পন্ন ল্যাব' }}</small></div>
              <div class="stat"><span class="si">📝</span><b>{{ s.examsTaken }}</b><small>{{ i18n.isEn ? 'Exams taken' : 'দেওয়া পরীক্ষা' }}</small></div>
              <div class="stat"><span class="si">🎯</span><b>{{ s.avgScoreRatio != null ? (s.avgScoreRatio * 100 | number:'1.0-0') + '%' : '—' }}</b><small>{{ i18n.isEn ? 'Average score' : 'গড় স্কোর' }}</small></div>
              <div class="stat"><span class="si">📖</span><b>{{ s.chaptersStudied }}</b><small>{{ i18n.isEn ? 'Chapters studied' : 'পড়া অধ্যায়' }}</small></div>
              <div class="stat"><span class="si">⏱️</span><b>{{ duration(s.totalStudySeconds) }}</b><small>{{ i18n.isEn ? 'Lab time' : 'ল্যাবে সময়' }}</small></div>
            </section>

            <!-- subject mastery + score trend -->
            <section class="grid2">
              <div class="card">
                <div class="card-h"><h3>{{ i18n.isEn ? 'Mastery by subject' : 'বিষয়ভিত্তিক দক্ষতা' }}</h3><small>{{ i18n.isEn ? 'chapters ≥ 80% done' : '৮০%+ সম্পন্ন অধ্যায়' }}</small></div>
                <div class="mrow" *ngFor="let m of s.mastery">
                  <div class="mtop">
                    <span class="mname">{{ subjectIcon(m.name_en) }} {{ i18n.isEn ? m.name_en : m.name_bn }}</span>
                    <span class="mnum">{{ m.mastered }}/{{ m.total_chapters }}</span>
                  </div>
                  <div class="bar"><div class="bar-in" [style.width.%]="pct(m.in_progress, m.total_chapters) + pct(m.mastered, m.total_chapters)" style="background:#9fd8cf"></div><div class="bar-in main" [style.width.%]="pct(m.mastered, m.total_chapters)"></div></div>
                  <small class="msub">{{ m.mastered }} {{ i18n.isEn ? 'mastered' : 'সম্পন্ন' }} · {{ m.in_progress }} {{ i18n.isEn ? 'in progress' : 'চলমান' }}</small>
                </div>
              </div>

              <div class="card">
                <div class="card-h"><h3>{{ i18n.isEn ? 'Exam score trend' : 'পরীক্ষার স্কোর প্রবণতা' }}</h3></div>
                <ng-container *ngIf="s.scoreTrend.length >= 2; else fewScores">
                  <svg viewBox="0 0 260 120" class="trend">
                    <line x1="28" y1="10" x2="28" y2="100" stroke="#e2e8ec"/><line x1="28" y1="100" x2="252" y2="100" stroke="#e2e8ec"/>
                    <line x1="28" y1="55" x2="252" y2="55" stroke="#eef2f4" stroke-dasharray="3 3"/>
                    <text x="2" y="14" class="ax">100%</text><text x="6" y="58" class="ax">50%</text><text x="12" y="103" class="ax">0</text>
                    <polyline [attr.points]="trendPoints()" fill="none" stroke="#1a6d5e" stroke-width="2.2" stroke-linejoin="round"/>
                    <circle *ngFor="let p of trendPointsArr()" [attr.cx]="p.x" [attr.cy]="p.y" r="3.4" fill="#fff" stroke="#1a6d5e" stroke-width="2"/>
                  </svg>
                </ng-container>
                <ng-template #fewScores>
                  <div class="empty">
                    <div class="big" *ngIf="s.scoreTrend.length === 1">{{ s.scoreTrend[0].score / s.scoreTrend[0].max_score * 100 | number:'1.0-0' }}%</div>
                    <p>{{ s.scoreTrend.length === 1
                        ? (i18n.isEn ? 'Take one more exam to see your trend line.' : 'প্রবণতা দেখতে আরও একটি পরীক্ষা দিন।')
                        : (i18n.isEn ? 'No exams yet — your scores will appear here.' : 'এখনও পরীক্ষা দেননি — স্কোর এখানে দেখা যাবে।') }}</p>
                    <button class="act small" (click)="go('/practice')">📝 {{ i18n.isEn ? 'Start a practice exam' : 'অনুশীলন পরীক্ষা শুরু করুন' }}</button>
                  </div>
                </ng-template>

                <div class="card-h" style="margin-top:16px"><h3>🏅 {{ i18n.t('badges') }}</h3></div>
                <div class="badge-row" *ngIf="s.badges.length; else noBadges">
                  <span class="badge-chip" *ngFor="let b of s.badges">{{ b.icon }} {{ i18n.isEn ? b.title_en : b.title_bn }}</span>
                </div>
                <ng-template #noBadges><p class="dim">{{ i18n.isEn ? 'Complete labs and exams to earn badges.' : 'ল্যাব ও পরীক্ষা সম্পন্ন করে ব্যাজ অর্জন করুন।' }}</p></ng-template>
              </div>
            </section>

            <!-- activity heat strip -->
            <section class="card">
              <div class="card-h">
                <h3>{{ i18n.isEn ? 'Activity — last 13 weeks' : 'কার্যকলাপ — গত ১৩ সপ্তাহ' }}</h3>
                <small>{{ activeDays }} {{ i18n.isEn ? 'active days' : 'দিন সক্রিয়' }}</small>
              </div>
              <div class="heat-wrap">
                <div class="heat-days"><span>{{ i18n.isEn ? 'Sun' : 'রবি' }}</span><span></span><span>{{ i18n.isEn ? 'Tue' : 'মঙ্গল' }}</span><span></span><span>{{ i18n.isEn ? 'Thu' : 'বৃহ' }}</span><span></span><span>{{ i18n.isEn ? 'Sat' : 'শনি' }}</span></div>
                <div class="heat">
                  <div class="heat-col" *ngFor="let w of weeks">
                    <div class="hc" *ngFor="let c of w" [class.future]="c.future" [attr.data-l]="c.level" [title]="c.label"></div>
                  </div>
                </div>
              </div>
              <div class="legend"><small>{{ i18n.isEn ? 'Less' : 'কম' }}</small><i class="hc" data-l="0"></i><i class="hc" data-l="1"></i><i class="hc" data-l="2"></i><i class="hc" data-l="3"></i><small>{{ i18n.isEn ? 'More' : 'বেশি' }}</small></div>
            </section>

            <!-- recent activity -->
            <section class="card">
              <div class="card-h"><h3>{{ i18n.isEn ? 'Recent activity' : 'সাম্প্রতিক কার্যক্রম' }}</h3>
                <button class="link" *ngIf="groups.length > 6" (click)="showAll = !showAll">{{ showAll ? (i18n.isEn ? 'Show less' : 'কম দেখান') : (i18n.isEn ? 'Show all' : 'সব দেখুন') + ' (' + groups.length + ')' }}</button></div>
              <p class="dim" *ngIf="!groups.length">{{ i18n.isEn ? 'Nothing yet — open a lab to begin.' : 'এখনও কিছু নেই — একটি ল্যাব খুলে শুরু করুন।' }}</p>
              <ul class="feed">
                <li *ngFor="let g of visibleGroups()">
                  <span class="fi" [class.exam]="g.kind === 'exam'">{{ g.kind === 'exam' ? '📝' : '🧪' }}</span>
                  <div class="fb">
                    <b>{{ g.title }}</b>
                    <small>{{ g.detail }}</small>
                  </div>
                  <span class="fcount" *ngIf="g.count > 1">×{{ g.count }}</span>
                  <span class="ftime">{{ rel(g.last) }}</span>
                </li>
              </ul>
            </section>
          </ng-container>
        </div>

        <!-- ================= TEACHER / ADMIN ================= -->
        <div *ngSwitchCase="'teacher'">
          <ng-container *ngIf="teacher as t">
            <section class="hero staff">
              <div class="hero-text">
                <p class="hello">{{ isStaffAdmin ? (i18n.isEn ? 'Administration' : 'প্রশাসন') : (i18n.isEn ? 'Teacher' : 'শিক্ষক') }}</p>
                <h1>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ classLevel }} {{ i18n.isEn ? 'overview' : 'সারসংক্ষেপ' }}</h1>
                <div class="seg" *ngIf="isStaffAdmin">
                  <button *ngFor="let c of staffClasses" [class.on]="c === classLevel" (click)="pickClass(c)">{{ c }}</button>
                </div>
              </div>
              <div class="hero-actions">
                <button class="act" (click)="exportClassCsv()" [disabled]="!t.students.length">⬇️ {{ i18n.isEn ? 'Export CSV' : 'CSV এক্সপোর্ট' }}</button>
                <button class="act" *ngIf="isStaffAdmin || role === 'teacher'" (click)="go('/admin')">⚙️ {{ i18n.isEn ? 'Admin' : 'অ্যাডমিন' }}</button>
              </div>
            </section>

            <section class="stats">
              <div class="stat"><span class="si">👥</span><b>{{ t.students.length }}</b><small>{{ i18n.isEn ? 'Students' : 'শিক্ষার্থী' }}</small></div>
              <div class="stat"><span class="si">🎯</span><b>{{ classAvg(t) }}</b><small>{{ i18n.isEn ? 'Class average' : 'শ্রেণির গড় স্কোর' }}</small></div>
              <div class="stat"><span class="si">📝</span><b>{{ sum(t.students, 'exams_taken') }}</b><small>{{ i18n.isEn ? 'Exams taken' : 'মোট পরীক্ষা' }}</small></div>
              <div class="stat"><span class="si">🧪</span><b>{{ sum(t.students, 'sims_completed') }}</b><small>{{ i18n.isEn ? 'Labs completed' : 'সম্পন্ন ল্যাব' }}</small></div>
            </section>

            <section class="grid2 wide-left">
              <div class="card">
                <div class="card-h"><h3>{{ i18n.isEn ? 'Students' : 'শিক্ষার্থীর তালিকা' }}</h3><small>{{ t.students.length }}</small></div>
                <p class="dim" *ngIf="!t.students.length">{{ i18n.isEn ? 'No students registered in this class yet.' : 'এই শ্রেণিতে এখনও কোনো শিক্ষার্থী নিবন্ধিত নয়।' }}</p>
                <div class="tbl" *ngIf="t.students.length">
                  <div class="tr th"><span>{{ i18n.isEn ? 'Student' : 'শিক্ষার্থী' }}</span><span>{{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</span><span>{{ i18n.isEn ? 'Avg score' : 'গড় স্কোর' }}</span><span>{{ i18n.isEn ? 'Labs' : 'ল্যাব' }}</span></div>
                  <div class="tr" *ngFor="let s of t.students">
                    <span class="who"><i class="av">{{ (s.full_name || '?').charAt(0) }}</i>{{ s.full_name }}</span>
                    <span>{{ s.exams_taken }}</span>
                    <span class="sc"><span class="bar sm"><span class="bar-in main" [class.low]="s.avg_ratio != null && s.avg_ratio < .5" [style.width.%]="(s.avg_ratio || 0) * 100"></span></span>{{ s.avg_ratio != null ? (s.avg_ratio * 100 | number:'1.0-0') + '%' : '—' }}</span>
                    <span>{{ s.sims_completed }}</span>
                  </div>
                </div>
              </div>
              <div class="card">
                <div class="card-h"><h3>⚠️ {{ i18n.t('weakChapters') }}</h3></div>
                <p class="dim" *ngIf="!t.weakestChapters.length">{{ i18n.isEn ? 'No exam data yet.' : 'এখনও পরীক্ষার তথ্য নেই।' }}</p>
                <div class="weak" *ngFor="let w of t.weakestChapters">
                  <div class="mtop"><span class="mname">{{ i18n.isEn ? w.title_en : w.title_bn }}</span><span class="weak-pct">{{ (w.avg_ratio * 100) | number:'1.0-0' }}%</span></div>
                  <div class="bar sm"><span class="bar-in low" [style.width.%]="w.avg_ratio * 100"></span></div>
                  <small class="msub">{{ w.attempts }} {{ i18n.isEn ? 'attempts' : 'প্রচেষ্টা' }}</small>
                </div>
              </div>
            </section>
          </ng-container>
        </div>

        <!-- ================= GUARDIAN ================= -->
        <div *ngSwitchCase="'guardian'">
          <section class="hero staff">
            <div class="hero-text">
              <p class="hello">{{ i18n.isEn ? 'Guardian' : 'অভিভাবক' }}</p>
              <h1>{{ userName }}</h1>
            </div>
          </section>
          <section class="card">
            <div class="card-h"><h3>{{ i18n.isEn ? 'Linked students' : 'সংযুক্ত শিক্ষার্থীরা' }}</h3></div>
            <p class="dim" *ngIf="!linkedStudents.length">{{ i18n.isEn ? 'No linked students yet.' : 'এখনও কোনো শিক্ষার্থী সংযুক্ত নেই।' }}</p>
            <div class="linked" *ngFor="let ls of linkedStudents">
              <i class="av">{{ (ls.full_name || '?').charAt(0) }}</i>
              <div class="fb"><b>{{ ls.full_name }}</b><small>{{ i18n.isEn ? 'Class' : 'শ্রেণি' }} {{ ls.class_level }}</small></div>
              <span class="pending" *ngIf="!ls.confirmed">{{ i18n.isEn ? 'Pending confirmation' : 'নিশ্চিতকরণ বাকি' }}</span>
              <button class="act small" *ngIf="ls.confirmed" (click)="loadGuardianSummary(ls.student_id)">{{ i18n.isEn ? 'Weekly summary' : 'সাপ্তাহিক সারসংক্ষেপ' }}</button>
            </div>
          </section>
          <section *ngIf="guardianSummary">
            <h3 class="sec-title">{{ i18n.isEn ? 'This week' : 'এই সপ্তাহে' }}</h3>
            <div class="stats">
              <div class="stat"><span class="si">🧪</span><b>{{ guardianSummary.simulations }}</b><small>{{ i18n.isEn ? 'Labs' : 'ল্যাব' }}</small></div>
              <div class="stat"><span class="si">📝</span><b>{{ guardianSummary.exams }}</b><small>{{ i18n.isEn ? 'Exams' : 'পরীক্ষা' }}</small></div>
              <div class="stat"><span class="si">🎯</span><b>{{ guardianSummary.avg_ratio ? (guardianSummary.avg_ratio * 100 | number:'1.0-0') + '%' : '—' }}</b><small>{{ i18n.isEn ? 'Average score' : 'গড় স্কোর' }}</small></div>
            </div>
          </section>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    :host { --b: #1a6d5e; --bd: #144f45; --soft: #eef6f4; --line: #e2e8ec; --tx: #22323b; --mu: #6b7a84; }
    .page { max-width: 1080px; margin: 0 auto; padding: 20px 16px 48px; color: var(--tx); }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; color: var(--mu); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--line); border-top-color: var(--b); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .dim { color: var(--mu); font-size: .86rem; margin: 6px 0; }

    /* hero */
    .hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 22px 24px; border-radius: 18px; color: #fff;
      background: radial-gradient(1200px 300px at 100% -40%, rgba(55,194,181,.55), transparent 60%), linear-gradient(135deg, #1a6d5e, #144f45); box-shadow: 0 10px 28px rgba(20,79,69,.25); margin-bottom: 16px; }
    .hero.staff { padding: 18px 24px; }
    .hello { margin: 0; font-size: .85rem; opacity: .85; }
    .hero h1 { margin: 2px 0 8px; font-size: 1.6rem; line-height: 1.2; }
    .hero-sub { margin: 0; display: flex; gap: 8px; flex-wrap: wrap; }
    .pill { background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 3px 11px; font-size: .78rem; }
    .pill.warm { background: rgba(255,170,60,.28); }
    .hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .act { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.35); color: #fff; padding: 9px 14px; border-radius: 10px; font-size: .86rem; font-weight: 600; cursor: pointer; transition: .15s; }
    .act:hover:not(:disabled) { background: rgba(255,255,255,.26); }
    .act:disabled { opacity: .5; cursor: default; }
    .act.primary { background: #fff; color: var(--bd); border-color: #fff; }
    .act.primary:hover { background: #e8fbf7; }
    .act.small { background: var(--b); color: #fff; border: none; padding: 7px 12px; font-size: .8rem; }
    .seg { display: inline-flex; flex-wrap: wrap; gap: 4px; background: rgba(0,0,0,.18); padding: 4px; border-radius: 12px; }
    .seg button { border: none; background: transparent; color: #fff; min-width: 34px; padding: 5px 10px; border-radius: 9px; font-size: .84rem; cursor: pointer; }
    .seg button.on { background: #fff; color: var(--bd); font-weight: 700; }

    /* stats */
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .stat { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 14px 12px; display: flex; flex-direction: column; gap: 2px; box-shadow: 0 1px 2px rgba(20,40,40,.05); }
    .si { font-size: 1.2rem; }
    .stat b { font-size: 1.5rem; color: var(--b); line-height: 1.15; }
    .stat small { color: var(--mu); font-size: .76rem; }

    /* cards */
    .card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 16px 18px; box-shadow: 0 1px 2px rgba(20,40,40,.05); margin-bottom: 16px; }
    .card-h { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 10px; }
    .card-h h3 { margin: 0; font-size: .98rem; color: var(--bd); }
    .card-h small { color: var(--mu); font-size: .76rem; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .grid2.wide-left { grid-template-columns: 1.6fr 1fr; }
    .grid2 .card { margin-bottom: 0; }
    section.grid2 { margin-bottom: 16px; }
    @media (max-width: 820px) { .grid2, .grid2.wide-left { grid-template-columns: 1fr; } .hero h1 { font-size: 1.3rem; } }
    .sec-title { margin: 8px 0; color: var(--bd); }

    /* mastery */
    .mrow { margin-bottom: 13px; }
    .mtop { display: flex; justify-content: space-between; font-size: .86rem; margin-bottom: 4px; gap: 8px; }
    .mname { font-weight: 600; }
    .mnum { color: var(--mu); }
    .bar { height: 9px; background: #edf2f1; border-radius: 99px; position: relative; overflow: hidden; }
    .bar.sm { height: 7px; }
    .bar-in { position: absolute; inset: 0 auto 0 0; border-radius: 99px; transition: width .6s ease; }
    .bar-in.main { background: linear-gradient(90deg, #37c2b5, var(--b)); }
    .bar-in.low { background: linear-gradient(90deg, #f0a53e, #d9534f); }
    .msub { color: var(--mu); font-size: .72rem; }

    /* trend */
    .trend { width: 100%; height: auto; background: #fbfdfc; border: 1px solid var(--line); border-radius: 12px; }
    .ax { font-size: 7px; fill: #8a97a0; }
    .empty { text-align: center; padding: 14px 6px; background: var(--soft); border-radius: 12px; }
    .empty .big { font-size: 2rem; font-weight: 800; color: var(--b); }
    .empty p { margin: 6px 0 10px; font-size: .84rem; color: var(--mu); }
    .badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge-chip { background: #fff8ee; border: 1px solid #f3d9a8; border-radius: 999px; padding: 6px 12px; font-size: .82rem; }

    /* heatmap */
    .heat-wrap { display: flex; gap: 8px; padding-bottom: 4px; }
    .heat-days { display: grid; grid-template-rows: repeat(7, 18px); gap: 4px; font-size: .62rem; color: var(--mu); align-items: center; }
    .heat { display: flex; gap: 4px; flex: 1; }
    .heat-col { display: grid; grid-template-rows: repeat(7, 18px); gap: 4px; flex: 1; }
    .hc { width: 100%; height: 18px; border-radius: 4px; background: #edf2f1; display: inline-block; }
    .hc[data-l="1"] { background: #bfe6df; } .hc[data-l="2"] { background: #5cc4b4; } .hc[data-l="3"] { background: #1a6d5e; }
    .hc.future { visibility: hidden; }
    .legend { display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-top: 8px; color: var(--mu); }
    .legend .hc { width: 14px; height: 14px; }

    /* feed */
    .feed { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .feed li { display: flex; align-items: center; gap: 12px; padding: 10px 2px; border-bottom: 1px solid #eef2f4; }
    .feed li:last-child { border-bottom: none; }
    .fi { width: 36px; height: 36px; border-radius: 10px; background: var(--soft); display: grid; place-items: center; flex-shrink: 0; }
    .fi.exam { background: #fff6e6; }
    .fb { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .fb b { font-size: .88rem; }
    .fb small { color: var(--mu); font-size: .76rem; }
    .fcount { background: var(--soft); color: var(--b); font-weight: 700; font-size: .74rem; padding: 2px 8px; border-radius: 99px; }
    .ftime { color: var(--mu); font-size: .76rem; white-space: nowrap; }
    .link { background: none; border: none; color: var(--b); font-weight: 600; font-size: .82rem; cursor: pointer; }

    /* staff table */
    .tbl { display: flex; flex-direction: column; }
    .tr { display: grid; grid-template-columns: 2.2fr .7fr 1.6fr .7fr; gap: 8px; align-items: center; padding: 9px 4px; border-bottom: 1px solid #eef2f4; font-size: .86rem; }
    .tr.th { color: var(--mu); font-size: .74rem; text-transform: uppercase; letter-spacing: .03em; font-weight: 700; }
    .who { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .av { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #37c2b5, var(--b)); color: #fff; display: grid; place-items: center; font-style: normal; font-weight: 700; font-size: .82rem; flex-shrink: 0; }
    .sc { display: flex; align-items: center; gap: 8px; }
    .sc .bar { flex: 1; min-width: 40px; }
    .weak { margin-bottom: 12px; }
    .weak-pct { font-weight: 800; color: #c0392b; }

    /* guardian */
    .linked { display: flex; align-items: center; gap: 12px; padding: 10px 2px; border-bottom: 1px solid #eef2f4; }
    .linked:last-child { border-bottom: none; }
    .pending { color: #a5690c; background: #fff6e6; border-radius: 99px; padding: 3px 10px; font-size: .76rem; }
  `],
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  i18n = inject(I18nService);
  Math = Math;

  role = '';
  userName = '';
  classLevel = 9;
  student: any = null;
  teacher: any = null;
  linkedStudents: any[] = [];
  guardianSummary: any = null;
  isStaffAdmin = false;
  staffClasses = [6, 7, 8, 9, 10, 11, 12];

  groups: ActivityGroup[] = [];
  showAll = false;
  weeks: HeatCell[][] = [];
  activeDays = 0;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    // system_admin / content_admin see everything a teacher sees (with a class selector)
    this.isStaffAdmin = user.role === 'system_admin' || user.role === 'content_admin';
    this.role = this.isStaffAdmin ? 'teacher' : user.role;
    this.userName = user.fullName || user.username;
    this.classLevel = user.classLevel || 9;

    if (user.role === 'student') {
      this.dashboardService.student().subscribe(s => { this.student = s; this.buildGroups(s.timeline || []); this.buildHeat(s.heatmap || []); });
    } else if (this.role === 'teacher') {
      this.loadTeacher();
    } else if (user.role === 'guardian') {
      this.auth.myLinkedStudents().subscribe(ls => this.linkedStudents = ls);
    }
  }

  go(path: string) { this.router.navigateByUrl(path); }
  loadTeacher() { this.teacher = null; this.dashboardService.teacherClass(this.classLevel).subscribe(t => this.teacher = t); }
  pickClass(c: number) { this.classLevel = c; this.loadTeacher(); }

  // ---------- helpers ----------
  pct(n: any, total: any): number { const t = +total; return t > 0 ? Math.min(100, (+n / t) * 100) : 0; }
  subjectIcon(nameEn: string): string {
    const n = (nameEn || '').toLowerCase();
    return n.includes('chem') ? '⚗️' : n.includes('phys') ? '⚡' : n.includes('bio') ? '🧬' : n.includes('ict') || n.includes('info') ? '💻' : '📘';
  }
  duration(sec: number): string {
    sec = +sec || 0;
    if (sec < 60) return `${sec}${this.i18n.isEn ? 's' : ' সে.'}`;
    const m = Math.round(sec / 60);
    if (m < 60) return `${m} ${this.i18n.isEn ? 'min' : 'মিনিট'}`;
    return `${Math.floor(m / 60)}${this.i18n.isEn ? 'h ' : ' ঘ. '}${m % 60}${this.i18n.isEn ? 'm' : ' মি.'}`;
  }
  rel(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    const en = this.i18n.isEn;
    if (diff < 60) return en ? 'just now' : 'এইমাত্র';
    if (diff < 3600) return en ? `${Math.floor(diff / 60)} min ago` : `${Math.floor(diff / 60)} মিনিট আগে`;
    if (diff < 86400) return en ? `${Math.floor(diff / 3600)} h ago` : `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
    if (diff < 86400 * 7) return en ? `${Math.floor(diff / 86400)} d ago` : `${Math.floor(diff / 86400)} দিন আগে`;
    return new Date(iso).toLocaleDateString(en ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short' });
  }
  visibleGroups(): ActivityGroup[] { return this.showAll ? this.groups : this.groups.slice(0, 6); }

  /** Collapse repeated entries of the same lab/exam into one row with a count. */
  private buildGroups(timeline: any[]) {
    const en = this.i18n.isEn;
    const map = new Map<string, ActivityGroup & { done: number; secs: number; hints: number; best: number | null }>();
    for (const t of timeline) {
      const title = t.kind === 'exam' ? (en ? 'Exam' : 'পরীক্ষা') : (en ? t.title_en : t.title_bn);
      const key = t.kind + '|' + title;
      let g = map.get(key);
      if (!g) { g = { kind: t.kind, title, count: 0, last: t.at, detail: '', ok: true, done: 0, secs: 0, hints: 0, best: null }; map.set(key, g); }
      g.count++;
      if (new Date(t.at) > new Date(g.last)) g.last = t.at;
      if (t.kind === 'exam' && t.max_score) { const r = Math.round((t.score / t.max_score) * 100); g.best = g.best == null ? r : Math.max(g.best, r); g.done++; }
      if (t.kind === 'simulation') { if (t.status === 'completed') g.done++; g.secs += +t.duration_seconds || 0; g.hints += +t.hints_used || 0; }
    }
    this.groups = [...map.values()].sort((a, b) => +new Date(b.last) - +new Date(a.last)).map(g => {
      const parts: string[] = [];
      if (g.kind === 'exam') { if (g.best != null) parts.push(`${en ? 'Best' : 'সর্বোচ্চ'} ${g.best}%`); }
      else {
        parts.push(`${g.done} ${en ? 'completed' : 'সম্পন্ন'}`);
        if (g.count - g.done > 0) parts.push(`${g.count - g.done} ${en ? 'unfinished' : 'অসমাপ্ত'}`);
        if (g.secs) parts.push(this.duration(g.secs));
        if (g.hints) parts.push(`${g.hints} ${en ? 'hints' : 'হিন্ট'}`);
      }
      return { kind: g.kind, title: g.title, count: g.count, last: g.last, detail: parts.join(' · '), ok: true };
    });
  }

  /** 13 weeks × 7 days grid (week starts Sunday), counts → 4 intensity levels. */
  private buildHeat(heatmap: any[]) {
    const counts = new Map<string, number>();
    heatmap.forEach(h => counts.set(String(h.day).slice(0, 10), +h.count));
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - today.getDay() - 12 * 7);
    const weeks: HeatCell[][] = []; let active = 0;
    for (let w = 0; w < 13; w++) {
      const col: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
        const k = key(dt); const c = counts.get(k) || 0; if (c) active++;
        col.push({ day: k, count: c, level: c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : 3, future: dt > today,
          label: `${dt.toLocaleDateString(this.i18n.isEn ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short' })} — ${c} ${this.i18n.isEn ? 'activities' : 'কার্যক্রম'}` });
      }
      weeks.push(col);
    }
    this.weeks = weeks; this.activeDays = active;
  }

  trendPointsArr(): { x: number; y: number }[] {
    const trend = [...(this.student?.scoreTrend || [])].reverse(); // oldest → newest
    return trend.map((t: any, i: number) => ({
      x: trend.length > 1 ? 32 + (i / (trend.length - 1)) * 216 : 140,
      y: 100 - (t.max_score > 0 ? (t.score / t.max_score) * 90 : 0),
    }));
  }
  trendPoints(): string { return this.trendPointsArr().map(p => `${p.x},${p.y}`).join(' '); }

  // staff
  sum(list: any[], k: string): number { return (list || []).reduce((s, x) => s + (+x[k] || 0), 0); }
  classAvg(t: any): string {
    const v = (t.students || []).filter((s: any) => s.avg_ratio != null).map((s: any) => +s.avg_ratio);
    return v.length ? Math.round((v.reduce((a: number, b: number) => a + b, 0) / v.length) * 100) + '%' : '—';
  }

  loadGuardianSummary(studentId: number) {
    this.dashboardService.guardianStudent(studentId).subscribe(s => this.guardianSummary = s);
  }

  exportClassCsv() {
    if (!this.teacher) return;
    const rows = [['Student', 'Exams Taken', 'Avg Score %', 'Simulations Completed']];
    for (const s of this.teacher.students) {
      rows.push([s.full_name, s.exams_taken, s.avg_ratio ? Math.round(s.avg_ratio * 100) : '', s.sims_completed]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `class-${this.classLevel}-report.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
