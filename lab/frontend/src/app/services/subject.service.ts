import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Subject { id: number; code: string; name_bn: string; name_en: string; }
export interface Chapter {
  id: number; subject_id: number; class_level: number; title_bn: string; title_en: string;
  order_index: number; syllabus_year: number; status: string;
}
export interface ChapterDetail {
  chapter: Chapter;
  content: any[];
  simulations: any[];
  progress: { percent_complete: number; bookmarked: boolean; notes: string | null; last_position: string | null } | null;
}

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private apiUrl = `${environment.apiUrl}/subjects`;
  constructor(private http: HttpClient) {}

  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl);
  }

  getChapters(subjectId: number, classLevel?: number): Observable<Chapter[]> {
    const url = classLevel ? `${this.apiUrl}/${subjectId}/chapters?classLevel=${classLevel}` : `${this.apiUrl}/${subjectId}/chapters`;
    return this.http.get<Chapter[]>(url);
  }

  getChapterDetail(chapterId: number): Observable<ChapterDetail> {
    return this.http.get<ChapterDetail>(`${this.apiUrl}/chapters/${chapterId}`);
  }
}
