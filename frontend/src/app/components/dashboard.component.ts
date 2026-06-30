import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="school-header">
      <div class="school-logo">🏫</div>
      <div>
        <h1 style="margin-bottom:0.25rem">Rowshon Amir Elementary School</h1>
        <p style="color:#666;margin:0">রওশন আমির প্রাথমিক বিদ্যালয় · স্কুল ম্যানেজমেন্ট সিস্টেম</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>মোট শিক্ষার্থী</h3>
        <div class="stat-number">{{ stats.students }}</div>
        <div style="color:#888;font-size:0.8rem;margin-top:0.25rem">নথিভুক্ত</div>
      </div>
      <div class="stat-card green">
        <h3>মোট শিক্ষক</h3>
        <div class="stat-number">{{ stats.teachers }}</div>
        <div style="color:#888;font-size:0.8rem;margin-top:0.25rem">কর্মরত</div>
      </div>
      <div class="stat-card orange">
        <h3>মোট ক্লাস</h3>
        <div class="stat-number">{{ stats.classes }}</div>
        <div style="color:#888;font-size:0.8rem;margin-top:0.25rem">সক্রিয়</div>
      </div>
      <div class="stat-card" style="border-left-color:#764ba2">
        <h3>পরীক্ষা</h3>
        <div class="stat-number" style="color:#764ba2">{{ stats.exams }}</div>
        <div style="color:#888;font-size:0.8rem;margin-top:0.25rem">নথিভুক্ত</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
      <div class="card" style="margin-bottom:0">
        <h3>দ্রুত কাজ</h3>
        <div class="action-grid">
          <a routerLink="/students" class="action-btn">
            <span class="action-icon">👨‍🎓</span>
            <span>নতুন শিক্ষার্থী ভর্তি</span>
          </a>
          <a routerLink="/attendance" class="action-btn">
            <span class="action-icon">📋</span>
            <span>উপস্থিতি নিন</span>
          </a>
          <a routerLink="/exams" class="action-btn">
            <span class="action-icon">📝</span>
            <span>পরীক্ষা তৈরি করুন</span>
          </a>
          <a routerLink="/payments" class="action-btn">
            <span class="action-icon">💰</span>
            <span>ফি সংগ্রহ</span>
          </a>
          <a routerLink="/homework" class="action-btn">
            <span class="action-icon">📚</span>
            <span>হোমওয়ার্ক দিন</span>
          </a>
          <a routerLink="/transport" class="action-btn">
            <span class="action-icon">🚌</span>
            <span>পরিবহন</span>
          </a>
        </div>
      </div>

      <div class="card" style="margin-bottom:0">
        <h3>স্কুল তথ্য</h3>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">স্কুলের নাম</span>
            <span class="info-value">Rowshon Amir Elementary School</span>
          </div>
          <div class="info-item">
            <span class="info-label">বাংলা নাম</span>
            <span class="info-value">রওশন আমির প্রাথমিক বিদ্যালয়</span>
          </div>
          <div class="info-item">
            <span class="info-label">ধরন</span>
            <span class="info-value">প্রাথমিক বিদ্যালয়</span>
          </div>
          <div class="info-item">
            <span class="info-label">শিক্ষাবর্ষ</span>
            <span class="info-value">{{ currentYear }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">আজকের তারিখ</span>
            <span class="info-value">{{ today | date:'dd MMMM yyyy' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">সিস্টেম</span>
            <span class="info-value" style="color:#2d6a4f;font-weight:600">● সক্রিয়</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>মডিউল সমূহ</h3>
      <div class="module-grid">
        <a routerLink="/students" class="module-card">
          <div class="module-icon">👨‍🎓</div>
          <div class="module-name">শিক্ষার্থী ব্যবস্থাপনা</div>
          <div class="module-desc">ভর্তি, প্রোফাইল, তালিকা</div>
        </a>
        <a routerLink="/teachers" class="module-card">
          <div class="module-icon">👨‍🏫</div>
          <div class="module-name">শিক্ষক ব্যবস্থাপনা</div>
          <div class="module-desc">তথ্য, নিয়োগ</div>
        </a>
        <a routerLink="/attendance" class="module-card">
          <div class="module-icon">📋</div>
          <div class="module-name">উপস্থিতি</div>
          <div class="module-desc">দৈনিক উপস্থিতি, রিপোর্ট</div>
        </a>
        <a routerLink="/exams" class="module-card">
          <div class="module-icon">📝</div>
          <div class="module-name">পরীক্ষা</div>
          <div class="module-desc">রুটিন, ফলাফল</div>
        </a>
        <a routerLink="/payments" class="module-card">
          <div class="module-icon">💰</div>
          <div class="module-name">পেমেন্ট</div>
          <div class="module-desc">ফি, বেতন</div>
        </a>
        <a routerLink="/homework" class="module-card">
          <div class="module-icon">📚</div>
          <div class="module-name">হোমওয়ার্ক</div>
          <div class="module-desc">অ্যাসাইনমেন্ট, জমা</div>
        </a>
        <a routerLink="/transport" class="module-card">
          <div class="module-icon">🚌</div>
          <div class="module-name">পরিবহন</div>
          <div class="module-desc">রুট, বাস</div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .school-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 5px solid #1a3c5e;
    }

    .school-logo {
      font-size: 3.5rem;
      line-height: 1;
    }

    .action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #1a3c5e 0%, #1b5e3b 100%);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(26, 60, 94, 0.3);
    }

    .action-icon {
      font-size: 1.2rem;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #666;
      font-size: 0.875rem;
    }

    .info-value {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .module-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem 1rem;
      background: #f8f9fa;
      border-radius: 10px;
      text-align: center;
      text-decoration: none;
      transition: all 0.2s;
      border: 2px solid transparent;
      cursor: pointer;
    }

    .module-card:hover {
      background: #e8f0fe;
      border-color: #1a3c5e;
      transform: translateY(-2px);
    }

    .module-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .module-name {
      font-weight: 600;
      font-size: 0.85rem;
      color: #1a3c5e;
      margin-bottom: 0.25rem;
    }

    .module-desc {
      font-size: 0.75rem;
      color: #888;
    }
  `]
})
export class DashboardComponent implements OnInit {
  http = inject(HttpClient);

  stats = { students: 0, teachers: 0, classes: 0, exams: 0 };
  today = new Date();
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<any[]>('http://localhost:3000/api/students').subscribe({
      next: (data) => { this.stats.students = data.length; },
      error: () => {}
    });
    this.http.get<any[]>('http://localhost:3000/api/teachers').subscribe({
      next: (data) => { this.stats.teachers = data.length; },
      error: () => {}
    });
    this.http.get<any[]>('http://localhost:3000/api/classes').subscribe({
      next: (data) => { this.stats.classes = data.length; },
      error: () => {}
    });
    this.http.get<any[]>('http://localhost:3000/api/exams').subscribe({
      next: (data) => { this.stats.exams = data.length; },
      error: () => {}
    });
  }
}
