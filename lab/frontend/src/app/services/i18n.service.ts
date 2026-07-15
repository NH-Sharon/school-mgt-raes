import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'bn';

export const T = {
  bn: {
    appName: 'বিডি ভার্চুয়াল ল্যাব',
    tagline: 'ইন্টারেক্টিভ ল্যাব সিমুলেশন, শিক্ষা ও এমসিকিউ পরীক্ষা প্ল্যাটফর্ম',
    login: 'লগইন',
    logout: 'লগআউট',
    register: 'রেজিস্ট্রেশন',
    dashboard: 'ড্যাশবোর্ড',
    subjects: 'বিষয়সমূহ',
    username: 'ইউজারনেম',
    password: 'পাসওয়ার্ড',
    fullName: 'পূর্ণ নাম',
    role: 'ভূমিকা',
    classLevel: 'শ্রেণি',
    medium: 'মাধ্যম',
    institution: 'প্রতিষ্ঠান (ঐচ্ছিক)',
    submit: 'জমা দিন',
    student: 'শিক্ষার্থী',
    teacher: 'শিক্ষক',
    guardian: 'অভিভাবক',
    contentAdmin: 'কনটেন্ট অ্যাডমিন',
    systemAdmin: 'সিস্টেম অ্যাডমিন',
    learn: 'পড়ুন',
    simulate: 'সিমুলেট করুন',
    exam: 'পরীক্ষা',
    notes: 'নোট',
    formula: 'সূত্র',
    startExam: 'পরীক্ষা শুরু করুন',
    practiceMode: 'অনুশীলন মোড',
    examMode: 'পরীক্ষা মোড',
    submitExam: 'পরীক্ষা জমা দিন',
    score: 'স্কোর',
    timeLeft: 'বাকি সময়',
    weakChapters: 'দুর্বল অধ্যায়সমূহ',
    badges: 'ব্যাজসমূহ',
    streak: 'ধারাবাহিকতা',
    points: 'পয়েন্ট',
    admin: 'অ্যাডমিন',
    loading: 'লোড হচ্ছে...',
    save: 'সংরক্ষণ করুন',
    publish: 'প্রকাশ করুন',
    cancel: 'বাতিল',
  },
  en: {
    appName: 'BdVirtualLab',
    tagline: 'Interactive Lab Simulation, Learning & MCQ Examination Platform',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    dashboard: 'Dashboard',
    subjects: 'Subjects',
    username: 'Username',
    password: 'Password',
    fullName: 'Full Name',
    role: 'Role',
    classLevel: 'Class',
    medium: 'Medium',
    institution: 'Institution (optional)',
    submit: 'Submit',
    student: 'Student',
    teacher: 'Teacher',
    guardian: 'Guardian',
    contentAdmin: 'Content Admin',
    systemAdmin: 'System Admin',
    learn: 'Learn',
    simulate: 'Simulate',
    exam: 'Exam',
    notes: 'Notes',
    formula: 'Formula',
    startExam: 'Start Exam',
    practiceMode: 'Practice Mode',
    examMode: 'Exam Mode',
    submitExam: 'Submit Exam',
    score: 'Score',
    timeLeft: 'Time Left',
    weakChapters: 'Weak Chapters',
    badges: 'Badges',
    streak: 'Streak',
    points: 'Points',
    admin: 'Admin',
    loading: 'Loading...',
    save: 'Save',
    publish: 'Publish',
    cancel: 'Cancel',
  },
} as const;

export type TKey = keyof typeof T.en;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _lang = signal<Lang>('bn');
  lang = this._lang.asReadonly();

  t(key: TKey): string {
    const map = T[this._lang()] as Record<string, string>;
    return map[key] ?? (T.en as Record<string, string>)[key] ?? key;
  }

  get isEn(): boolean {
    return this._lang() === 'en';
  }

  toggle(): void {
    const next = this._lang() === 'en' ? 'bn' : 'en';
    this._lang.set(next);
    document.documentElement.lang = next;
    localStorage.setItem('lang', next);
  }

  constructor() {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'bn') {
      this._lang.set(saved);
      document.documentElement.lang = saved;
    }
  }
}
