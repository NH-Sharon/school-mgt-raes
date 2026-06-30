import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'bn';

export const T = {
  en: {
    schoolName: 'Rowshon Amir Elementary School',
    schoolBn: 'রওশন আমির প্রাথমিক বিদ্যালয়',
    est: 'Est. 1985',
    tagline: 'Nurturing Young Minds, Building Tomorrow\'s Leaders',
    address: 'Mirpur, Dhaka, Bangladesh',
    phone: '+880 1711-000001',
    email: 'info@rowshonamir.edu.bd',
    // nav
    home: 'Home', about: 'About', programs: 'Programs',
    notices: 'Notices', contact: 'Contact',
    loginPortal: 'Enter Portal', viewAll: 'View All',
    // stats
    students: 'Students', teachers: 'Teachers', classes: 'Classes', years: 'Years',
    enrolled: 'Enrolled', dedicated: 'Dedicated Faculty', active: 'Active', excellence: 'of Excellence',
    // about
    aboutTitle: 'Building Futures Since 1985',
    aboutText: 'Rowshon Amir Elementary School has been the cornerstone of primary education in our community for four decades. We believe every child carries a unique potential — our role is to nurture it with care, discipline, and joy.',
    aboutText2: 'Rooted in our local heritage and open to the world, we combine proven pedagogy with a warm, family-centred environment where children feel seen, supported, and inspired to grow.',
    ourMission: 'Mission', ourVision: 'Vision',
    missionText: 'To provide quality primary education that empowers every student with knowledge, values, and the confidence to contribute to society.',
    visionText: 'A community where every child has access to excellent education and the tools to shape their own future with integrity.',
    // programs
    programsTitle: 'Academic Programs',
    programsSub: 'Class One through Class Five — a complete primary journey',
    // notices
    noticeTitle: 'Notice Board',
    noticeSub: 'Stay informed with the latest school announcements',
    // features
    featuresTitle: 'Why Rowshon Amir',
    featuresSub: 'A school shaped by community, carried by four decades of trust',
    feat1Title: 'Experienced Faculty',
    feat1Text: 'Our teachers bring an average of 12 years of classroom experience and a genuine commitment to each student\'s growth.',
    feat2Title: 'Holistic Development',
    feat2Text: 'Beyond academics — sports, arts, and character formation are woven into daily school life from Class One.',
    feat3Title: 'Safe Environment',
    feat3Text: 'A clean, secure campus with CCTV, a dedicated health room, and a zero-tolerance policy on bullying.',
    // portal selection
    portalTitle: 'Select Your Portal',
    portalSub: 'Choose the portal that matches your role to continue',
    adminPortalDesc: 'Full school management — students, teachers, finances, and reports.',
    teacherPortalDesc: 'Manage your classes, homework, attendance, and exam results.',
    studentPortalDesc: 'View your grades, homework, attendance record, and fee status.',
    // login
    welcomeBack: 'Welcome back',
    loginSubtitle: 'Sign in to your school portal',
    username: 'Username', password: 'Password',
    signingIn: 'Signing in…', signIn: 'Sign In',
    demoHint: 'Demo login: admin / password',
    wrongCreds: 'Incorrect username or password. Please try again.',
    backToSite: '← Back to school website',
    // portals
    adminPortal: 'Admin Portal', teacherPortal: 'Teacher Portal', studentPortal: 'Student Portal',
    dashboard: 'Dashboard', myStudents: 'Students', myClasses: 'My Classes',
    attendance: 'Attendance', exams: 'Exams', payments: 'Payments',
    homework: 'Homework', transport: 'Transport', logout: 'Sign Out',
    myGrades: 'My Results', myAttendance: 'Attendance', myHomework: 'Homework', myPayments: 'Fee Status', myProfile: 'Profile',
    totalStudents: 'Total Students', totalTeachers: 'Total Teachers',
    totalClasses: 'Total Classes', totalExams: 'Total Exams',
    // role
    roleAdmin: 'Administrator', roleTeacher: 'Teacher', roleStudent: 'Student', roleParent: 'Parent',
    // footer
    quickLinks: 'Quick Links', contactUs: 'Contact', followUs: 'Office Hours',
    rights: '© Rowshon Amir Elementary School. All rights reserved.',
    officeHours: 'Sat – Thu: 8:00 AM – 4:00 PM',
  },
  bn: {
    schoolName: 'রওশন আমির প্রাথমিক বিদ্যালয়',
    schoolBn: 'রওশন আমির প্রাথমিক বিদ্যালয়',
    est: 'প্রতিষ্ঠা ১৯৮৫',
    tagline: 'তরুণ মেধার বিকাশ, আগামীর নেতৃত্ব গঠন',
    address: 'মিরপুর, ঢাকা, বাংলাদেশ',
    phone: '+৮৮০ ১৭১১-০০০০০১',
    email: 'info@rowshonamir.edu.bd',
    home: 'হোম', about: 'আমাদের সম্পর্কে', programs: 'কার্যক্রম',
    notices: 'নোটিশ', contact: 'যোগাযোগ',
    loginPortal: 'পোর্টালে প্রবেশ', viewAll: 'সব দেখুন',
    students: 'শিক্ষার্থী', teachers: 'শিক্ষক', classes: 'শ্রেণী', years: 'বছর',
    enrolled: 'ভর্তিকৃত', dedicated: 'অভিজ্ঞ শিক্ষক', active: 'সক্রিয়', excellence: 'শ্রেষ্ঠত্বের',
    aboutTitle: '১৯৮৫ থেকে ভবিষ্যৎ গড়ছি',
    aboutText: 'রওশন আমির প্রাথমিক বিদ্যালয় চার দশক ধরে আমাদের সমাজের প্রাথমিক শিক্ষার মূল ভিত্তি। আমরা বিশ্বাস করি প্রতিটি শিশুর মধ্যে অনন্য প্রতিভা আছে — আমাদের দায়িত্ব যত্ন, শৃঙ্খলা ও আনন্দের মাধ্যমে তা বিকশিত করা।',
    aboutText2: 'আমাদের স্থানীয় ঐতিহ্যে প্রোথিত এবং বিশ্বের দিকে উন্মুক্ত, আমরা প্রমাণিত শিক্ষাপদ্ধতি এবং পারিবারিক পরিবেশের সমন্বয় করি যেখানে শিশুরা নিজেদের মূল্যায়িত ও অনুপ্রাণিত বোধ করে।',
    ourMission: 'লক্ষ্য', ourVision: 'দৃষ্টিভঙ্গি',
    missionText: 'মানসম্মত প্রাথমিক শিক্ষা প্রদান করা যা প্রতিটি শিক্ষার্থীকে জ্ঞান, মূল্যবোধ ও আত্মবিশ্বাসে সক্ষম করে সমাজে অবদান রাখতে।',
    visionText: 'এমন একটি সমাজ যেখানে প্রতিটি শিশু উন্নত শিক্ষা এবং নিজের ভবিষ্যৎ সততার সাথে গড়ার সুযোগ পাবে।',
    programsTitle: 'শিক্ষা কার্যক্রম',
    programsSub: 'প্রথম থেকে পঞ্চম শ্রেণী — সম্পূর্ণ প্রাথমিক শিক্ষার যাত্রা',
    noticeTitle: 'নোটিশ বোর্ড',
    noticeSub: 'বিদ্যালয়ের সর্বশেষ ঘোষণা সম্পর্কে আপডেট থাকুন',
    featuresTitle: 'কেন রওশন আমির',
    featuresSub: 'সমাজের বিশ্বাসে গড়া, চার দশকের ঐতিহ্যে পরিচালিত একটি বিদ্যালয়',
    feat1Title: 'অভিজ্ঞ শিক্ষকমণ্ডলী',
    feat1Text: 'আমাদের শিক্ষকদের গড় ১২ বছরের শ্রেণীকক্ষ অভিজ্ঞতা এবং প্রতিটি শিক্ষার্থীর বিকাশে প্রকৃত অঙ্গীকার রয়েছে।',
    feat2Title: 'সামগ্রিক বিকাশ',
    feat2Text: 'শুধু পড়াশোনা নয় — প্রথম শ্রেণী থেকেই খেলাধুলা, শিল্পকলা এবং চরিত্র গঠন দৈনন্দিন বিদ্যালয় জীবনের অংশ।',
    feat3Title: 'নিরাপদ পরিবেশ',
    feat3Text: 'সিসিটিভি সহ পরিষ্কার ও সুরক্ষিত ক্যাম্পাস, একটি স্বাস্থ্য কক্ষ এবং বুলিং বিরোধী শূন্য-সহনশীলতা নীতি।',
    portalTitle: 'আপনার পোর্টাল নির্বাচন করুন',
    portalSub: 'আপনার ভূমিকা অনুযায়ী পোর্টাল বেছে নিন',
    adminPortalDesc: 'সম্পূর্ণ বিদ্যালয় ব্যবস্থাপনা — শিক্ষার্থী, শিক্ষক, অর্থ ও প্রতিবেদন।',
    teacherPortalDesc: 'আপনার ক্লাস, হোমওয়ার্ক, উপস্থিতি ও পরীক্ষার ফলাফল পরিচালনা করুন।',
    studentPortalDesc: 'আপনার ফলাফল, হোমওয়ার্ক, উপস্থিতি ও ফি স্ট্যাটাস দেখুন।',
    welcomeBack: 'স্বাগতম',
    loginSubtitle: 'আপনার স্কুল পোর্টালে প্রবেশ করুন',
    username: 'ইউজারনেম', password: 'পাসওয়ার্ড',
    signingIn: 'প্রবেশ হচ্ছে…', signIn: 'প্রবেশ করুন',
    demoHint: 'ডেমো: admin / password',
    wrongCreds: 'ভুল ইউজারনেম বা পাসওয়ার্ড। আবার চেষ্টা করুন।',
    backToSite: '← বিদ্যালয়ের ওয়েবসাইটে ফিরুন',
    adminPortal: 'অ্যাডমিন পোর্টাল', teacherPortal: 'শিক্ষক পোর্টাল', studentPortal: 'শিক্ষার্থী পোর্টাল',
    dashboard: 'ড্যাশবোর্ড', myStudents: 'শিক্ষার্থী', myClasses: 'আমার ক্লাস',
    attendance: 'উপস্থিতি', exams: 'পরীক্ষা', payments: 'পেমেন্ট',
    homework: 'হোমওয়ার্ক', transport: 'পরিবহন', logout: 'লগআউট',
    myGrades: 'আমার ফলাফল', myAttendance: 'উপস্থিতি', myHomework: 'হোমওয়ার্ক', myPayments: 'ফি স্ট্যাটাস', myProfile: 'প্রোফাইল',
    totalStudents: 'মোট শিক্ষার্থী', totalTeachers: 'মোট শিক্ষক',
    totalClasses: 'মোট ক্লাস', totalExams: 'মোট পরীক্ষা',
    roleAdmin: 'প্রশাসক', roleTeacher: 'শিক্ষক', roleStudent: 'শিক্ষার্থী', roleParent: 'অভিভাবক',
    quickLinks: 'দ্রুত লিংক', contactUs: 'যোগাযোগ', followUs: 'অফিস সময়',
    rights: '© রওশন আমির প্রাথমিক বিদ্যালয়। সর্বস্বত্ব সংরক্ষিত।',
    officeHours: 'শনি – বৃহস্পতি: সকাল ৮টা – বিকাল ৪টা',
  }
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

  get isEn(): boolean { return this._lang() === 'en'; }
  toggle(): void { this._lang.set(this._lang() === 'en' ? 'bn' : 'en'); }
}
