import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../services/i18n.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-teacher-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="portal-wrap">
  <!-- Mobile hamburger -->
  <button class="sidebar-toggle" (click)="sidebarOpen=true">☰</button>
  <!-- Sidebar backdrop -->
  <div class="sidebar-backdrop" [class.open]="sidebarOpen" (click)="sidebarOpen=false"></div>
  <!-- SIDEBAR -->
  <aside class="sidebar" [class.open]="sidebarOpen">
    <div class="sidebar-brand">
      <div class="sidebar-logo">🏫</div>
      <div class="sidebar-school">{{ i18n.isEn ? 'Rowshon Amir' : 'রওশন আমির' }}</div>
      <div class="sidebar-role-badge">{{ i18n.t('teacherPortal') }}</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">{{ i18n.isEn ? 'Academic' : 'একাডেমিক' }}</div>
      <button [class.active]="activeTab==='overview'" (click)="activeTab='overview'; sidebarOpen=false">
        <span class="nav-icon">📊</span> {{ i18n.isEn ? 'Overview' : 'সারসংক্ষেপ' }}
      </button>
      <button [class.active]="activeTab==='attendance'" (click)="activeTab='attendance'; loadAttendance(); sidebarOpen=false">
        <span class="nav-icon">📅</span> {{ i18n.t('attendance') }}
      </button>
      <button [class.active]="activeTab==='homework'" (click)="activeTab='homework'; loadHomework(); sidebarOpen=false">
        <span class="nav-icon">📚</span> {{ i18n.t('homework') }}
      </button>
      <button [class.active]="activeTab==='students'" (click)="activeTab='students'; sidebarOpen=false">
        <span class="nav-icon">👨‍🎓</span> {{ i18n.t('myStudents') }}
      </button>
      <button [class.active]="activeTab==='exams'" (click)="activeTab='exams'; sidebarOpen=false">
        <span class="nav-icon">📋</span> {{ i18n.t('exams') }}
      </button>
      <!-- Permission-based extra modules -->
      <ng-container *ngIf="hasPerm('finance')">
        <div class="nav-section-label">{{ i18n.isEn ? 'Finance' : 'ফিনান্স' }}</div>
        <button [class.active]="activeTab==='payments'" (click)="activeTab='payments'; loadPermPayments(); sidebarOpen=false">
          <span class="nav-icon">💰</span> {{ i18n.isEn ? 'Payments' : 'পেমেন্ট' }}
        </button>
      </ng-container>
      <ng-container *ngIf="hasPerm('hr')">
        <div class="nav-section-label">{{ i18n.isEn ? 'HR' : 'এইচআর' }}</div>
        <button [class.active]="activeTab==='hr'" (click)="activeTab='hr'; loadPermHr(); sidebarOpen=false">
          <span class="nav-icon">👔</span> {{ i18n.isEn ? 'HR Management' : 'কর্মী ব্যবস্থাপনা' }}
        </button>
      </ng-container>
      <ng-container *ngIf="hasPerm('transport')">
        <div class="nav-section-label">{{ i18n.isEn ? 'Transport' : 'পরিবহন' }}</div>
        <button [class.active]="activeTab==='transport'" (click)="activeTab='transport'; loadPermTransport(); sidebarOpen=false">
          <span class="nav-icon">🚌</span> {{ i18n.isEn ? 'Transport' : 'পরিবহন' }}
        </button>
      </ng-container>
      <ng-container *ngIf="hasPerm('reports')">
        <div class="nav-section-label">{{ i18n.isEn ? 'Reports' : 'রিপোর্ট' }}</div>
        <button [class.active]="activeTab==='reports'" (click)="activeTab='reports'; loadPermReports(); sidebarOpen=false">
          <span class="nav-icon">📊</span> {{ i18n.isEn ? 'Reports' : 'রিপোর্ট' }}
        </button>
      </ng-container>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">{{ userInitial }}</div>
        <div>
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ i18n.t('roleTeacher') }}</div>
        </div>
      </div>
      <div class="sidebar-actions">
        <button class="action-btn" (click)="i18n.toggle()">{{ i18n.isEn ? 'বাংলা' : 'EN' }}</button>
        <button class="action-btn logout-btn" (click)="logout()">{{ i18n.t('logout') }}</button>
      </div>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="portal-main">

    <!-- OVERVIEW -->
    <div *ngIf="activeTab==='overview'" class="tab-content">
      <div class="page-header">
        <div>
          <div class="page-eyebrow">{{ i18n.isEn ? 'Teacher Dashboard' : 'শিক্ষক ড্যাশবোর্ড' }}</div>
          <h1 class="page-title">{{ i18n.isEn ? 'Welcome, ' : 'স্বাগতম, ' }}{{ userName }}</h1>
        </div>
        <div class="header-date">{{ todayLabel }}</div>
      </div>
      <div class="overview-grid">
        <div class="stat-tile green">
          <div class="tile-icon">👨‍🎓</div>
          <div class="tile-value">{{ students.length }}</div>
          <div class="tile-label">{{ i18n.t('students') }}</div>
        </div>
        <div class="stat-tile blue">
          <div class="tile-icon">📅</div>
          <div class="tile-value">{{ classes.length }}</div>
          <div class="tile-label">{{ i18n.t('classes') }}</div>
        </div>
        <div class="stat-tile yellow">
          <div class="tile-icon">📚</div>
          <div class="tile-value">{{ homeworkList.length }}</div>
          <div class="tile-label">{{ i18n.t('homework') }}</div>
        </div>
        <div class="stat-tile orange">
          <div class="tile-icon">📋</div>
          <div class="tile-value">{{ exams.length }}</div>
          <div class="tile-label">{{ i18n.t('exams') }}</div>
        </div>
      </div>

      <!-- My classes -->
      <div class="section-card">
        <div class="card-header">
          <h2>{{ i18n.t('myClasses') }}</h2>
        </div>
        <div class="classes-grid">
          <div class="class-card" *ngFor="let c of classes">
            <div class="class-icon">🏫</div>
            <div class="class-name">{{ c.class_name }}</div>
            <div class="class-section">{{ i18n.isEn ? 'Section' : 'শাখা' }}: {{ c.section }}</div>
            <div class="class-count">{{ c.student_count || 0 }} {{ i18n.isEn ? 'students' : 'শিক্ষার্থী' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ATTENDANCE -->
    <div *ngIf="activeTab==='attendance'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">{{ i18n.t('attendance') }}</h1>
      </div>
      <!-- Sub-tabs -->
      <div class="att-subtabs">
        <button [class.active]="attSubTab==='take'" (click)="attSubTab='take'">📝 {{ i18n.isEn ? 'Take Attendance' : 'উপস্থিতি নিন' }}</button>
        <button [class.active]="attSubTab==='report'" (click)="attSubTab='report';loadAttReport()">📊 {{ i18n.isEn ? 'Attendance Report' : 'উপস্থিতি রিপোর্ট' }}</button>
      </div>

      <!-- TAKE ATTENDANCE -->
      <div class="section-card" *ngIf="attSubTab==='take'">
        <div class="filter-row">
          <select class="form-select" [(ngModel)]="selectedClassId" (change)="loadAttendance()">
            <option value="">{{ i18n.isEn ? 'Select Class' : 'শ্রেণী নির্বাচন করুন' }}</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
          </select>
          <input type="date" class="form-input" [(ngModel)]="selectedDate" (change)="loadAttendance()">
          <button class="btn-primary" (click)="markAllPresent()" [disabled]="!attendanceList.length">
            {{ i18n.isEn ? 'Mark All Present' : 'সকলকে উপস্থিত করুন' }}
          </button>
          <button class="btn-success" (click)="saveAttendance()" [disabled]="!attendanceList.length">
            {{ i18n.isEn ? 'Save' : 'সংরক্ষণ করুন' }}
          </button>
        </div>
        <div class="att-list" *ngIf="attendanceList.length > 0">
          <div class="att-row" *ngFor="let a of attendanceList">
            <div class="att-student"><strong>{{ a.roll_number }}</strong>. {{ a.name_en }} <span style="color:#666;font-size:.85em">{{ a.name_bn }}</span></div>
            <div class="att-radio-group">
              <label class="radio-chip green">
                <input type="radio" [name]="'att_' + a.student_id" value="present" [(ngModel)]="a.status">
                {{ i18n.isEn ? 'Present' : 'উপস্থিত' }}
              </label>
              <label class="radio-chip red">
                <input type="radio" [name]="'att_' + a.student_id" value="absent" [(ngModel)]="a.status">
                {{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}
              </label>
              <label class="radio-chip yellow">
                <input type="radio" [name]="'att_' + a.student_id" value="late" [(ngModel)]="a.status">
                {{ i18n.isEn ? 'Late' : 'দেরিতে' }}
              </label>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="!attendanceList.length">
          {{ i18n.isEn ? 'Select a class and date to manage attendance' : 'উপস্থিতি পরিচালনার জন্য শ্রেণী ও তারিখ নির্বাচন করুন' }}
        </div>
        <div class="success-msg" *ngIf="saveMsgVisible">
          ✓ {{ i18n.isEn ? 'Attendance saved successfully' : 'উপস্থিতি সংরক্ষিত হয়েছে' }}
        </div>
      </div>

      <!-- ATTENDANCE REPORT -->
      <div class="section-card" *ngIf="attSubTab==='report'">
        <div class="filter-row" style="flex-wrap:wrap;gap:.75rem;margin-bottom:1rem">
          <select class="form-select" [(ngModel)]="attReportClassId" (change)="loadAttReport()">
            <option value="">{{ i18n.isEn ? 'All Classes' : 'সব শ্রেণী' }}</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
          </select>
          <input type="month" class="form-input" [(ngModel)]="attReportMonth" (change)="loadAttReport()" style="width:180px">
          <button class="btn-primary" (click)="printAttReport()" *ngIf="attReport.length" style="margin-left:auto">
            🖨️ {{ i18n.isEn ? 'Print' : 'প্রিন্ট' }}
          </button>
        </div>
        <div id="att-report-print-area">
          <div class="table-scroll-wrap">
          <table class="data-table att-report-table" *ngIf="attReport.length">
            <thead>
              <tr>
                <th>{{ i18n.isEn ? 'Roll' : 'রোল' }}</th>
                <th>{{ i18n.isEn ? 'Student' : 'শিক্ষার্থী' }}</th>
                <th class="att-stat-p">✅ {{ i18n.isEn ? 'Present' : 'উপস্থিত' }}</th>
                <th class="att-stat-a">❌ {{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}</th>
                <th class="att-stat-l">⏰ {{ i18n.isEn ? 'Late' : 'দেরিতে' }}</th>
                <th>{{ i18n.isEn ? 'Total' : 'মোট দিন' }}</th>
                <th>{{ i18n.isEn ? 'Pct' : 'হার' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of attReport">
                <td>{{ r.roll_number }}</td>
                <td>
                  <div style="font-weight:600">{{ r.name_en }}</div>
                  <div style="font-size:.78rem;color:#666">{{ r.name_bn }}</div>
                </td>
                <td class="att-stat-p">{{ r.present }}</td>
                <td class="att-stat-a">{{ r.absent }}</td>
                <td class="att-stat-l">{{ r.late }}</td>
                <td>{{ r.total }}</td>
                <td>
                  <span class="rpt-pct"
                    [class.pct-good]="r.pct>=75"
                    [class.pct-warn]="r.pct>=50 && r.pct<75"
                    [class.pct-bad]="r.pct<50">{{ r.pct }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
        <div class="empty-state" *ngIf="!attReport.length">{{ i18n.isEn ? 'No attendance records found' : 'কোনো উপস্থিতি রেকর্ড নেই' }}</div>
      </div>
    </div>

    <!-- HOMEWORK -->
    <div *ngIf="activeTab==='homework'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">{{ i18n.t('homework') }}</h1>
      </div>
      <!-- Add HW form -->
      <div class="section-card">
        <div class="card-header"><h2>{{ i18n.isEn ? 'Assign Homework' : 'হোমওয়ার্ক দিন' }}</h2></div>
        <div class="form-grid">
          <select class="form-select" [(ngModel)]="newHw.class_id" (change)="loadHomework()">
            <option value="">{{ i18n.isEn ? 'Select Class' : 'শ্রেণী' }}</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
          </select>
          <select class="form-select" [(ngModel)]="newHw.subject_id">
            <option value="">{{ i18n.isEn ? 'Subject' : 'বিষয়' }}</option>
            <option *ngFor="let s of subjects" [value]="s.id">{{ s.subject_name }}</option>
          </select>
          <input type="date" class="form-input" [(ngModel)]="newHw.due_date" placeholder="Due date">
          <input type="text" class="form-input span-full" [(ngModel)]="newHw.description" [placeholder]="i18n.isEn ? 'Description…' : 'বিবরণ…'">
          <button class="btn-primary span-full" (click)="addHomework()">
            {{ i18n.isEn ? 'Assign' : 'দিন' }}
          </button>
        </div>
      </div>
      <div class="section-card">
        <div class="hw-list" *ngIf="homeworkList.length > 0">
          <div class="hw-item" *ngFor="let h of homeworkList">
            <div class="hw-subject">{{ getSubjectName(h.subject_id) }}</div>
            <div class="hw-desc">{{ h.description }}</div>
            <div class="hw-due">{{ i18n.isEn ? 'Due' : 'শেষ তারিখ' }}: <strong>{{ h.due_date | date:'mediumDate' }}</strong></div>
          </div>
        </div>
        <div class="empty-state" *ngIf="!homeworkList.length">{{ i18n.isEn ? 'No homework assigned yet' : 'এখনো কোনো হোমওয়ার্ক নেই' }}</div>
      </div>
    </div>

    <!-- STUDENTS -->
    <div *ngIf="activeTab==='students'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">{{ i18n.t('myStudents') }}</h1>
      </div>
      <div class="section-card">
        <div class="table-scroll-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th>
              <th>{{ i18n.isEn ? 'Class / Section' : 'শ্রেণী / শাখা' }}</th>
              <th>{{ i18n.isEn ? 'Roll' : 'রোল' }}</th>
              <th>{{ i18n.isEn ? 'Father' : 'পিতা' }}</th>
              <th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of students">
              <td style="font-family:monospace;font-size:.8rem">{{ s.student_id }}</td>
              <td>
                <div style="font-weight:600">{{ s.name_en }}</div>
                <div style="font-size:.8rem;color:#666">{{ s.name_bn }}</div>
              </td>
              <td>
                <span class="class-badge">{{ s.class_name || s.class_id }}</span>
                <span class="sec-badge">{{ s.class_section || s.section }}</span>
              </td>
              <td>{{ s.roll_number }}</td>
              <td>{{ s.father_name }}</td>
              <td><span class="badge badge-active">{{ i18n.isEn ? 'Active' : 'সক্রিয়' }}</span></td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="empty-state" *ngIf="!students.length">{{ i18n.isEn ? 'No students found' : 'কোনো শিক্ষার্থী পাওয়া যায়নি' }}</div>
      </div>
    </div>

    <!-- EXAMS -->
    <div *ngIf="activeTab==='exams'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">{{ i18n.t('exams') }}</h1>
      </div>
      <div class="section-card">
        <div class="exam-list">
          <div class="exam-row" *ngFor="let e of exams">
            <div class="exam-icon">📋</div>
            <div class="exam-info">
              <div class="exam-name">{{ e.name }}</div>
              <div class="exam-date">{{ e.start_date | date:'mediumDate' }} → {{ e.end_date | date:'mediumDate' }}</div>
            </div>
            <div class="exam-status" [class]="'status-' + e.status">{{ e.status }}</div>
          </div>
        </div>
        <div class="empty-state" *ngIf="!exams.length">{{ i18n.isEn ? 'No exams found' : 'কোনো পরীক্ষা নেই' }}</div>
      </div>
    </div>

    <!-- PAYMENTS (permission: finance.*) -->
    <div *ngIf="activeTab==='payments'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">💰 {{ i18n.isEn ? 'Payments' : 'পেমেন্ট' }}</h1>
      </div>
      <!-- Summary stats -->
      <div class="perm-stat-row" *ngIf="permPayStats.total > 0">
        <div class="perm-stat-card green">
          <div class="perm-stat-val">{{ permPayStats.paid }}</div>
          <div class="perm-stat-lbl">{{ i18n.isEn ? 'Paid' : 'পরিশোধিত' }}</div>
        </div>
        <div class="perm-stat-card yellow">
          <div class="perm-stat-val">{{ permPayStats.pending }}</div>
          <div class="perm-stat-lbl">{{ i18n.isEn ? 'Pending' : 'বকেয়া' }}</div>
        </div>
        <div class="perm-stat-card blue">
          <div class="perm-stat-val">৳{{ permPayStats.collected | number:'1.0-0' }}</div>
          <div class="perm-stat-lbl">{{ i18n.isEn ? 'Collected' : 'সংগৃহীত' }}</div>
        </div>
        <div class="perm-stat-card red">
          <div class="perm-stat-val">{{ permPayStats.total }}</div>
          <div class="perm-stat-lbl">{{ i18n.isEn ? 'Total Records' : 'মোট রেকর্ড' }}</div>
        </div>
      </div>
      <div class="section-card">
        <div class="table-scroll-wrap">
        <table class="data-table" *ngIf="permPayments.length">
          <thead>
            <tr>
              <th>{{ i18n.isEn ? 'Student' : 'শিক্ষার্থী' }}</th>
              <th>{{ i18n.isEn ? 'Class' : 'শ্রেণী' }}</th>
              <th>{{ i18n.isEn ? 'Type' : 'ধরন' }}</th>
              <th>{{ i18n.isEn ? 'Amount' : 'পরিমাণ' }}</th>
              <th>{{ i18n.isEn ? 'Method' : 'পদ্ধতি' }}</th>
              <th>{{ i18n.isEn ? 'Date' : 'তারিখ' }}</th>
              <th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of permPayments">
              <td>
                <div style="font-weight:600">{{ p.name_en }}</div>
                <div style="font-size:.75rem;color:#666">{{ p.student_code }}</div>
              </td>
              <td>{{ p.class_name }} <span class="sec-badge">{{ p.section }}</span></td>
              <td>{{ p.payment_type }}</td>
              <td style="font-weight:700">৳{{ p.amount | number:'1.0-0' }}</td>
              <td style="color:#666;font-size:.82rem">{{ p.payment_method || '—' }}</td>
              <td style="color:#666;font-size:.82rem">{{ p.payment_date | date:'dd MMM yyyy' }}</td>
              <td><span class="badge" [class]="p.status==='paid' ? 'badge-active' : 'badge-pending'">{{ p.status }}</span></td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="empty-state" *ngIf="!permPayments.length">{{ i18n.isEn ? 'No payment records' : 'পেমেন্ট রেকর্ড নেই' }}</div>
      </div>
    </div>

    <!-- HR MANAGEMENT (permission: hr.*) -->
    <div *ngIf="activeTab==='hr'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">👔 {{ i18n.isEn ? 'HR Management' : 'কর্মী ব্যবস্থাপনা' }}</h1>
      </div>
      <div class="perm-hr-subtabs">
        <button [class.active]="hrSubTab==='employees'" (click)="hrSubTab='employees'">
          👥 {{ i18n.isEn ? 'Employees' : 'কর্মচারী' }}
        </button>
        <button [class.active]="hrSubTab==='attendance'" (click)="hrSubTab='attendance'; loadPermHrAtt()" *ngIf="hasPerm('hr.attendance')">
          📋 {{ i18n.isEn ? 'Attendance' : 'উপস্থিতি' }}
        </button>
      </div>
      <!-- Employee List -->
      <div class="section-card" *ngIf="hrSubTab==='employees'">
        <div class="table-scroll-wrap">
        <table class="data-table" *ngIf="permHrList.length">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ i18n.isEn ? 'Name' : 'নাম' }}</th>
              <th>{{ i18n.isEn ? 'Designation' : 'পদবী' }}</th>
              <th>{{ i18n.isEn ? 'Department' : 'বিভাগ' }}</th>
              <th>{{ i18n.isEn ? 'Phone' : 'ফোন' }}</th>
              <th>{{ i18n.isEn ? 'Status' : 'স্ট্যাটাস' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of permHrList">
              <td style="font-family:monospace;font-size:.78rem">{{ e.emp_id }}</td>
              <td>
                <div style="font-weight:600">{{ e.name_en }}</div>
                <div style="font-size:.78rem;color:#666">{{ e.name_bn }}</div>
              </td>
              <td>{{ e.designation }}</td>
              <td><span class="badge badge-active">{{ e.department }}</span></td>
              <td style="font-size:.82rem">{{ e.phone || '—' }}</td>
              <td><span class="badge" [class]="e.status==='Active' ? 'badge-active' : 'badge-inactive'">{{ e.status }}</span></td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="empty-state" *ngIf="!permHrList.length">{{ i18n.isEn ? 'No employees' : 'কোনো কর্মচারী নেই' }}</div>
      </div>
      <!-- HR Attendance -->
      <div class="section-card" *ngIf="hrSubTab==='attendance'">
        <div class="filter-row" style="margin-bottom:1rem">
          <input type="month" class="form-input" [(ngModel)]="permHrAttMonth" (change)="loadPermHrAtt()" style="width:180px">
        </div>
        <div class="table-scroll-wrap">
        <table class="data-table" *ngIf="permHrAtt.length">
          <thead>
            <tr>
              <th>{{ i18n.isEn ? 'Employee' : 'কর্মচারী' }}</th>
              <th>{{ i18n.isEn ? 'Dept' : 'বিভাগ' }}</th>
              <th style="color:#059669">✅ {{ i18n.isEn ? 'Present' : 'উপস্থিত' }}</th>
              <th style="color:#c0392b">❌ {{ i18n.isEn ? 'Absent' : 'অনুপস্থিত' }}</th>
              <th style="color:#D4911A">⏰ {{ i18n.isEn ? 'Late' : 'দেরিতে' }}</th>
              <th>{{ i18n.isEn ? 'Total' : 'মোট' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of permHrAtt">
              <td>
                <div style="font-weight:600">{{ e.name_en }}</div>
                <div style="font-size:.75rem;color:#666">{{ e.emp_id }}</div>
              </td>
              <td>{{ e.department }}</td>
              <td style="color:#059669;font-weight:700">{{ e.present }}</td>
              <td style="color:#c0392b;font-weight:700">{{ e.absent }}</td>
              <td style="color:#D4911A;font-weight:700">{{ e.late }}</td>
              <td>{{ e.total }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="empty-state" *ngIf="!permHrAtt.length">{{ i18n.isEn ? 'No attendance data' : 'উপস্থিতি তথ্য নেই' }}</div>
      </div>
    </div>

    <!-- TRANSPORT (permission: transport.*) -->
    <div *ngIf="activeTab==='transport'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">🚌 {{ i18n.isEn ? 'Transport' : 'পরিবহন' }}</h1>
      </div>
      <div class="section-card">
        <div class="table-scroll-wrap">
        <table class="data-table" *ngIf="permTransport.length">
          <thead>
            <tr>
              <th>{{ i18n.isEn ? 'Route' : 'রুট' }}</th>
              <th>{{ i18n.isEn ? 'Driver' : 'চালক' }}</th>
              <th>{{ i18n.isEn ? 'Phone' : 'ফোন' }}</th>
              <th>{{ i18n.isEn ? 'Vehicle' : 'যানবাহন' }}</th>
              <th>{{ i18n.isEn ? 'Capacity' : 'ধারণক্ষমতা' }}</th>
              <th>{{ i18n.isEn ? 'Monthly Fee' : 'মাসিক ফি' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of permTransport">
              <td>
                <div style="font-weight:600">{{ r.route_name }}</div>
                <div style="font-size:.78rem;color:#666">{{ r.route_name_bn }}</div>
              </td>
              <td>{{ r.driver_name || '—' }}</td>
              <td style="font-size:.82rem">{{ r.driver_phone || '—' }}</td>
              <td style="font-size:.82rem">{{ r.vehicle_number || '—' }}</td>
              <td>{{ r.capacity }}</td>
              <td style="font-weight:700">৳{{ r.monthly_fee | number:'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="empty-state" *ngIf="!permTransport.length">{{ i18n.isEn ? 'No transport routes' : 'কোনো রুট নেই' }}</div>
      </div>
    </div>

    <!-- REPORTS (permission: reports.*) -->
    <div *ngIf="activeTab==='reports'" class="tab-content">
      <div class="page-header">
        <h1 class="page-title">📊 {{ i18n.isEn ? 'Reports' : 'রিপোর্ট' }}</h1>
      </div>
      <!-- Attendance Report -->
      <div class="section-card" *ngIf="hasPerm('reports.attendance')">
        <div class="card-header"><h2>📅 {{ i18n.isEn ? 'Attendance Report' : 'উপস্থিতি রিপোর্ট' }}</h2></div>
        <div class="filter-row" style="margin-bottom:1rem">
          <select class="form-select" [(ngModel)]="permRptClassId" (change)="loadPermReports()">
            <option value="">{{ i18n.isEn ? 'All Classes' : 'সব শ্রেণী' }}</option>
            <option *ngFor="let c of classes" [value]="c.id">{{ c.class_name }} {{ c.section }}</option>
          </select>
          <input type="month" class="form-input" [(ngModel)]="permRptMonth" (change)="loadPermReports()" style="width:180px">
          <button class="btn-primary" (click)="printAttReport()" *ngIf="permRptData.length" style="margin-left:auto">🖨️ {{ i18n.isEn ? 'Print' : 'প্রিন্ট' }}</button>
        </div>
        <div id="att-report-print-area">
          <div class="table-scroll-wrap">
          <table class="data-table" *ngIf="permRptData.length">
            <thead>
              <tr>
                <th>{{ i18n.isEn ? 'Roll' : 'রোল' }}</th>
                <th>{{ i18n.isEn ? 'Student' : 'শিক্ষার্থী' }}</th>
                <th style="color:#059669">✅</th>
                <th style="color:#c0392b">❌</th>
                <th style="color:#D4911A">⏰</th>
                <th>{{ i18n.isEn ? 'Total' : 'মোট' }}</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of permRptData">
                <td>{{ r.roll_number }}</td>
                <td><div style="font-weight:600">{{ r.name_en }}</div><small style="color:#666">{{ r.name_bn }}</small></td>
                <td class="att-stat-p">{{ r.present }}</td>
                <td class="att-stat-a">{{ r.absent }}</td>
                <td class="att-stat-l">{{ r.late }}</td>
                <td>{{ r.total }}</td>
                <td><span class="rpt-pct" [class.pct-good]="r.pct>=75" [class.pct-warn]="r.pct>=50&&r.pct<75" [class.pct-bad]="r.pct<50">{{ r.pct }}%</span></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
        <div class="empty-state" *ngIf="!permRptData.length">{{ i18n.isEn ? 'Select class and month' : 'শ্রেণী ও মাস নির্বাচন করুন' }}</div>
      </div>
    </div>

  </main>
</div>
  `,
  styles: [`
    :host {
      --surface-dark: #1A4731;
      --accent: #D4911A;
      --ground: #F7F5EC;
      --text: #1C2A1D;
      --muted: #6B7A5E;
      --border: rgba(28,42,29,0.1);
      display: block;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .portal-wrap { display: flex; min-height: 100vh; }
    .sidebar {
      width: 240px;
      background: var(--surface-dark);
      color: rgba(255,255,255,0.85);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .sidebar-brand { padding: 1.75rem 1.25rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-logo { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .sidebar-school { font-family: 'Noto Serif Bengali', serif; font-weight: 700; font-size: 0.9rem; }
    .sidebar-role-badge { display: inline-block; margin-top: 0.4rem; background: rgba(212,145,26,0.25); color: var(--accent); font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 2rem; font-family: 'DM Sans', sans-serif; }
    .sidebar-nav { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
    .sidebar-nav button { display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 0.85rem; border-radius: 6px; background: none; border: none; color: rgba(255,255,255,0.65); cursor: pointer; font-size: 0.875rem; text-align: left; transition: all 0.15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; width: 100%; }
    .sidebar-nav button:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
    .sidebar-nav button.active { background: rgba(255,255,255,0.12); color: #fff; font-weight: 600; }
    .nav-icon { font-size: 1rem; }
    .sidebar-footer { padding: 1rem 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-info { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.75rem; }
    .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(212,145,26,0.3); color: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; }
    .user-name { font-size: 0.85rem; font-weight: 600; color: #fff; }
    .user-role { font-size: 0.7rem; color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif; }
    .sidebar-actions { display: flex; gap: 0.5rem; }
    .action-btn { flex: 1; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.75); padding: 0.35rem 0.5rem; border-radius: 5px; font-size: 0.75rem; cursor: pointer; transition: all 0.15s; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .action-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .logout-btn:hover { background: rgba(220,53,69,0.3); border-color: rgba(220,53,69,0.4); }

    .portal-main { flex: 1; background: #F0F2F5; overflow-y: auto; }
    .tab-content { padding: 2rem; max-width: 1000px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-eyebrow { font-size: 0.75rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
    .page-title { font-family: 'Noto Serif Bengali', 'Cormorant Garamond', serif; font-size: 1.75rem; font-weight: 700; color: var(--text); margin-top: 0.25rem; }
    .header-date { font-size: 0.825rem; color: var(--muted); font-family: 'DM Sans', sans-serif; margin-top: 0.25rem; }

    .overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-tile { background: #fff; border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem; border-left: 4px solid transparent; }
    .stat-tile.green { border-color: #1A4731; }
    .stat-tile.blue { border-color: #1a5c8a; }
    .stat-tile.yellow { border-color: #D4911A; }
    .stat-tile.orange { border-color: #c0392b; }
    .tile-icon { font-size: 1.3rem; }
    .tile-value { font-size: 1.75rem; font-weight: 700; font-family: 'Cormorant Garamond', serif; color: var(--text); }
    .tile-label { font-size: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; }

    .section-card { background: #fff; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-header h2 { font-size: 1rem; font-weight: 600; color: var(--text); font-family: 'Noto Serif Bengali', serif; }
    .empty-state { text-align: center; padding: 2rem; color: var(--muted); font-size: 0.875rem; }
    .success-msg { margin-top: 1rem; padding: 0.75rem 1rem; background: #D1FAE5; color: #065F46; border-radius: 6px; font-size: 0.875rem; }

    /* classes grid */
    .classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
    .class-card { background: var(--ground); border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid var(--border); }
    .class-icon { font-size: 1.5rem; margin-bottom: 0.4rem; }
    .class-name { font-weight: 700; color: var(--text); font-size: 0.9rem; font-family: 'Noto Serif Bengali', serif; }
    .class-section { font-size: 0.775rem; color: var(--muted); margin-top: 0.15rem; }
    .class-count { font-size: 0.75rem; color: var(--accent); margin-top: 0.25rem; font-weight: 600; }

    /* attendance */
    .filter-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.25rem; align-items: center; }
    .form-select, .form-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.875rem;
      background: var(--ground);
      color: var(--text);
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
      outline: none;
    }
    .form-select:focus, .form-input:focus { border-color: var(--surface-dark); }
    .btn-primary, .btn-success {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-size: 0.875rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .btn-primary { background: var(--surface-dark); color: #fff; }
    .btn-primary:hover { background: #0f3020; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-success { background: #059669; color: #fff; }
    .btn-success:hover { background: #047857; }
    .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }

    .att-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .att-row { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.75rem; background: var(--ground); border-radius: 6px; }
    .att-student { font-size: 0.875rem; font-weight: 600; color: var(--text); min-width: 160px; }
    .att-radio-group { display: flex; gap: 0.5rem; }
    .radio-chip {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.65rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.15s;
      font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif;
    }
    .radio-chip.green { border-color: #1A4731; color: #1A4731; }
    .radio-chip.green:has(input:checked) { background: #D1FAE5; }
    .radio-chip.red { border-color: #c0392b; color: #c0392b; }
    .radio-chip.red:has(input:checked) { background: #FEE2E2; }
    .radio-chip.yellow { border-color: #D4911A; color: #D4911A; }
    .radio-chip.yellow:has(input:checked) { background: #FEF3C7; }
    .radio-chip input { display: none; }

    /* homework */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .span-full { grid-column: 1 / -1; }
    .hw-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .hw-item { padding: 1rem; background: var(--ground); border-radius: 8px; border-left: 3px solid var(--accent); }
    .hw-subject { font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem; font-family: 'DM Sans', sans-serif; }
    .hw-desc { font-size: 0.9rem; color: var(--text); margin-bottom: 0.4rem; line-height: 1.5; }
    .hw-due { font-size: 0.775rem; color: var(--muted); font-family: 'DM Sans', sans-serif; }

    /* table */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); font-family: 'DM Sans', sans-serif; }
    .data-table td { padding: 0.75rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); color: var(--text); }
    .data-table tr:last-child td { border-bottom: none; }
    .badge { font-size: 0.7rem; padding: 0.2rem 0.55rem; border-radius: 2rem; font-family: 'DM Sans', sans-serif; font-weight: 600; }
    .badge-active { background: #D1FAE5; color: #065F46; }
    .badge-inactive { background: #F3F4F6; color: #6B7280; }
    .class-badge { background: #e2e8f0; color: #1e293b; font-size:.72rem; font-weight:700; border-radius:5px; padding:.15rem .5rem; margin-right:.3rem; }
    .sec-badge { background: #1e293b; color: #fff; font-size:.72rem; font-weight:700; border-radius:5px; padding:.15rem .5rem; }
    /* Attendance sub-tabs */
    .att-subtabs { display:flex; gap:.5rem; margin-bottom:1rem; }
    .att-subtabs button { background:#fff; border:1.5px solid #e2e8f0; border-radius:8px; padding:.45rem 1rem; font-size:.82rem; font-weight:600; cursor:pointer; }
    .att-subtabs button.active { background:#1e293b; color:#fff; border-color:#1e293b; }
    /* Attendance report table */
    .att-report-table { border-radius:8px; overflow:hidden; }
    .att-stat-p { color:#059669; font-weight:700; }
    .att-stat-a { color:#c0392b; font-weight:700; }
    .att-stat-l { color:#D4911A; font-weight:700; }
    .rpt-pct { font-weight:700; font-size:.9rem; padding:.2rem .55rem; border-radius:2rem; }
    .pct-good { background:#D1FAE5; color:#065F46; }
    .pct-warn { background:#FEF3C7; color:#92400E; }
    .pct-bad { background:#FEE2E2; color:#991B1B; }

    /* Nav section labels */
    .nav-section-label { font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 0.75rem 0.85rem 0.2rem; font-family: 'DM Sans', sans-serif; }
    /* Permission-based stat cards */
    .perm-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    .perm-stat-card { background: #fff; border-radius: 10px; padding: 1rem; text-align: center; border-left: 4px solid transparent; }
    .perm-stat-card.green { border-color: #059669; }
    .perm-stat-card.yellow { border-color: #D4911A; }
    .perm-stat-card.blue { border-color: #1a5c8a; }
    .perm-stat-card.red { border-color: #c0392b; }
    .perm-stat-val { font-size: 1.5rem; font-weight: 700; color: var(--text); font-family: 'Cormorant Garamond', serif; }
    .perm-stat-lbl { font-size: 0.72rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; font-family: 'DM Sans', sans-serif; margin-top: 0.2rem; }
    /* HR sub-tabs */
    .perm-hr-subtabs { display: flex; gap: .5rem; margin-bottom: 1rem; }
    .perm-hr-subtabs button { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: .45rem 1rem; font-size: .82rem; font-weight: 600; cursor: pointer; font-family: 'Noto Sans Bengali', 'DM Sans', sans-serif; }
    .perm-hr-subtabs button.active { background: var(--surface-dark); color: #fff; border-color: var(--surface-dark); }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    /* exams */
    .exam-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .exam-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--ground); border-radius: 8px; }
    .exam-icon { font-size: 1.1rem; }
    .exam-info { flex: 1; }
    .exam-name { font-size: 0.9rem; font-weight: 600; color: var(--text); }
    .exam-date { font-size: 0.775rem; color: var(--muted); margin-top: 0.1rem; font-family: 'DM Sans', sans-serif; }
    .exam-status { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 2rem; font-family: 'DM Sans', sans-serif; font-weight: 600; text-transform: uppercase; }
    .status-scheduled { background: #DBEAFE; color: #1E40AF; }
    .status-ongoing { background: #D1FAE5; color: #065F46; }
    .status-completed { background: #F3F4F6; color: #374151; }

    /* ===== MOBILE RESPONSIVE ===== */

    /* Hamburger toggle button — shown on mobile only */
    .sidebar-toggle {
      display: none;
      position: fixed;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 200;
      background: var(--surface-dark);
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 0.45rem 0.65rem;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
    }

    /* Sidebar overlay backdrop */
    .sidebar-backdrop {
      display: none;
    }

    @media (max-width: 768px) {
      /* Show hamburger */
      .sidebar-toggle { display: block; }

      /* Sidebar: hidden off-screen by default, slides in when .open */
      .sidebar {
        position: fixed;
        left: -260px;
        top: 0;
        height: 100vh;
        z-index: 150;
        transition: left 0.25s ease;
        width: 240px;
      }
      .sidebar.open { left: 0; }

      /* Backdrop */
      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 140;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s;
      }
      .sidebar-backdrop.open { opacity: 1; pointer-events: auto; }

      /* Main takes full width; add top padding for hamburger button */
      .portal-main { width: 100%; padding-top: 3rem; }
      .tab-content { padding: 1rem; }

      /* Page header: stack vertically */
      .page-header { flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
      .page-title { font-size: 1.35rem; }
      .header-date { font-size: 0.75rem; }

      /* Stats: 2 columns */
      .overview-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
      .perm-stat-row { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }

      /* Section card: less padding */
      .section-card { padding: 1rem; }

      /* Tables: horizontal scroll via wrapper div */
      .table-scroll-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

      /* Homework form: single column */
      .form-grid { grid-template-columns: 1fr; }
      .span-full { grid-column: 1; }

      /* Filter row: wrap and stack */
      .filter-row { flex-direction: column; align-items: stretch; }
      .filter-row .form-select,
      .filter-row .form-input,
      .filter-row .btn-primary,
      .filter-row .btn-success { width: 100%; }

      /* Attendance sub-tabs: scrollable */
      .att-subtabs {
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.25rem;
        gap: 0.4rem;
      }
      .att-subtabs button { white-space: nowrap; }

      /* HR sub-tabs */
      .perm-hr-subtabs {
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 0.25rem;
      }
      .perm-hr-subtabs button { white-space: nowrap; }

      /* Attendance row: stack student name above radio chips */
      .att-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .att-student { min-width: unset; }
      .att-radio-group { flex-wrap: wrap; }

      /* Classes grid auto columns work fine on mobile already */
      .classes-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 480px) {
      .overview-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
      .perm-stat-row { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
      .stat-tile { padding: 0.9rem; }
      .tile-value { font-size: 1.4rem; }
      .section-card { padding: 0.75rem; }
      .tab-content { padding: 0.75rem; }
      .page-title { font-size: 1.2rem; }
      .classes-grid { grid-template-columns: 1fr 1fr; }
      .radio-chip { padding: 0.2rem 0.45rem; font-size: 0.7rem; }
    }
  `]
})
export class TeacherPortalComponent implements OnInit {
  i18n = inject(I18nService);
  auth = inject(AuthService);
  router = inject(Router);
  http = inject(HttpClient);

  activeTab = 'overview';
  sidebarOpen = false;
  todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  userName = '';
  userInitial = 'T';

  classes: any[] = [];
  students: any[] = [];
  exams: any[] = [];
  homeworkList: any[] = [];
  subjects: any[] = [];
  attendanceList: any[] = [];

  selectedClassId = '';
  selectedDate = new Date().toISOString().split('T')[0];
  saveMsgVisible = false;
  teacherId: number | null = null;

  attSubTab: 'take' | 'report' = 'take';
  attReportClassId = '';
  attReportMonth = new Date().toISOString().slice(0, 7);
  attReport: any[] = [];

  newHw: any = { class_id: '', subject_id: '', description: '', due_date: '' };

  // Permission-based extra modules
  userPermissions: string[] = [];
  permPayments: any[] = [];
  permPayStats = { paid: 0, pending: 0, collected: 0, total: 0 };
  permHrList: any[] = [];
  hrSubTab: 'employees' | 'attendance' = 'employees';
  permHrAtt: any[] = [];
  permHrAttMonth = new Date().toISOString().slice(0, 7);
  permTransport: any[] = [];
  permRptData: any[] = [];
  permRptClassId = '';
  permRptMonth = new Date().toISOString().slice(0, 7);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.userName = user.full_name || user.username || 'Teacher';
      this.userInitial = this.userName.charAt(0).toUpperCase();
    }
    this.http.get<any>('https://raes-backend.vercel.app/api/auth/me').subscribe({
      next: (me: any) => {
        if (me.linkedId) this.teacherId = me.linkedId;
        if (me.linkedData?.class_id) {
          this.selectedClassId = String(me.linkedData.class_id);
          this.newHw.class_id = String(me.linkedData.class_id);
        }
        // Load granted permissions
        this.userPermissions = (me.permissions || '').split(',').filter((p: string) => p);
      }, error: () => {}
    });
    this.http.get<any[]>('https://raes-backend.vercel.app/api/classes').subscribe({ next: d => { this.classes = d; }, error: () => {} });
    this.http.get<any[]>('https://raes-backend.vercel.app/api/students').subscribe({ next: d => { this.students = d; }, error: () => {} });
    this.http.get<any[]>('https://raes-backend.vercel.app/api/exams').subscribe({ next: d => { this.exams = d; }, error: () => {} });
    this.http.get<any[]>('https://raes-backend.vercel.app/api/subjects').subscribe({ next: d => { this.subjects = d; }, error: () => {} });
  }

  loadAttendance() {
    if (!this.selectedClassId || !this.selectedDate) return;
    this.http.get<any[]>(`https://raes-backend.vercel.app/api/attendance/${this.selectedClassId}/${this.selectedDate}`).subscribe({
      next: d => { this.attendanceList = d.map(s => ({ ...s, status: s.status || 'present' })); },
      error: () => {}
    });
  }

  loadHomework() {
    const classId = this.newHw.class_id || this.selectedClassId || this.classes[0]?.id;
    if (!classId) return;
    this.http.get<any[]>(`https://raes-backend.vercel.app/api/homework/class/${classId}`).subscribe({
      next: d => { this.homeworkList = d; },
      error: () => {}
    });
  }

  markAllPresent() { this.attendanceList.forEach(a => a.status = 'present'); }

  saveAttendance() {
    const records = this.attendanceList.map(a => ({ student_id: a.student_id, status: a.status, date: this.selectedDate }));
    this.http.post(`https://raes-backend.vercel.app/api/attendance/${this.selectedClassId}/${this.selectedDate}`, { records }).subscribe({
      next: () => { this.saveMsgVisible = true; setTimeout(() => { this.saveMsgVisible = false; }, 3000); },
      error: () => {}
    });
  }

  loadAttReport() {
    const API = 'https://raes-backend.vercel.app/api';
    let url = `${API}/attendance/report-summary?month=${this.attReportMonth}`;
    if (this.attReportClassId) url += `&class_id=${this.attReportClassId}`;
    this.http.get<any[]>(url).subscribe({
      next: d => { this.attReport = d; },
      error: () => { this.attReport = []; }
    });
  }

  printAttReport() {
    const el = document.getElementById('att-report-print-area');
    if (!el) return;
    const cls = this.classes.find(c => String(c.id) === String(this.attReportClassId));
    const clsLabel = cls ? `${cls.class_name} ${cls.section}` : 'সকল শ্রেণী';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>উপস্থিতি রিপোর্ট - ${clsLabel} - ${this.attReportMonth}</title>
      <style>
        body { font-family: 'Noto Sans Bengali', Arial, sans-serif; padding: 20px; color: #1C2A1D; }
        h2 { color: #1A4731; margin-bottom: 4px; }
        p { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead tr { background: #1A4731; color: white; }
        th { padding: 8px 12px; text-align: left; font-weight: 600; }
        td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background: #f8fafc; }
        .att-stat-p { color: #059669; font-weight: 700; }
        .att-stat-a { color: #c0392b; font-weight: 700; }
        .att-stat-l { color: #D4911A; font-weight: 700; }
        .pct-good { background: #D1FAE5; color: #065F46; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
        .pct-warn { background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
        .pct-bad { background: #FEE2E2; color: #991B1B; padding: 2px 8px; border-radius: 20px; font-weight: 700; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>উপস্থিতি রিপোর্ট</h2>
      <p>শ্রেণী: ${clsLabel} | মাস: ${this.attReportMonth} | মোট শিক্ষার্থী: ${this.attReport.length}</p>
      ${el.innerHTML}
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  }

  addHomework() {
    if (!this.newHw.description || !this.newHw.class_id) return;
    this.http.post('https://raes-backend.vercel.app/api/homework', { ...this.newHw, teacher_id: this.teacherId || 1 }).subscribe({
      next: () => {
        this.loadHomework();
        this.newHw = { class_id: this.newHw.class_id, subject_id: '', description: '', due_date: '' };
      },
      error: () => {}
    });
  }

  getSubjectName(id: number) {
    return this.subjects.find(s => s.id === id)?.subject_name || 'Subject';
  }

  hasPerm(prefix: string): boolean {
    return this.userPermissions.some(p => p === prefix || p.startsWith(prefix + '.'));
  }

  loadPermPayments() {
    const API = 'https://raes-backend.vercel.app/api';
    this.http.get<any[]>(`${API}/payments`).subscribe({
      next: d => {
        this.permPayments = d;
        this.permPayStats = {
          paid: d.filter(p => p.status === 'paid').length,
          pending: d.filter(p => p.status !== 'paid').length,
          collected: d.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.amount || 0), 0),
          total: d.length
        };
      }, error: () => {}
    });
  }

  loadPermHr() {
    const API = 'https://raes-backend.vercel.app/api';
    this.http.get<any[]>(`${API}/employees`).subscribe({
      next: d => { this.permHrList = d; }, error: () => {}
    });
  }

  loadPermHrAtt() {
    const API = 'https://raes-backend.vercel.app/api';
    this.http.get<any[]>(`${API}/employee-attendance/summary?month=${this.permHrAttMonth}`).subscribe({
      next: d => { this.permHrAtt = d; }, error: () => {}
    });
  }

  loadPermTransport() {
    const API = 'https://raes-backend.vercel.app/api';
    this.http.get<any[]>(`${API}/transport`).subscribe({
      next: d => { this.permTransport = d; }, error: () => {}
    });
  }

  loadPermReports() {
    const API = 'https://raes-backend.vercel.app/api';
    let url = `${API}/attendance/report-summary?month=${this.permRptMonth}`;
    if (this.permRptClassId) url += `&class_id=${this.permRptClassId}`;
    this.http.get<any[]>(url).subscribe({
      next: d => { this.permRptData = d; this.attReport = d; }, error: () => {}
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
