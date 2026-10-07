import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private apiUrl = `${environment.apiUrl}/content`;
  constructor(private http: HttpClient) {}

  updateProgress(chapterId: number, percentComplete: number, lastPosition?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/progress/${chapterId}`, { percentComplete, lastPosition });
  }

  setBookmark(chapterId: number, bookmarked: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/progress/${chapterId}/bookmark`, { bookmarked });
  }

  setNotes(chapterId: number, notes: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/progress/${chapterId}/notes`, { notes });
  }

  getBookmarks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookmarks`);
  }

  getGlossary(subjectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/glossary/${subjectId}`);
  }

  // FR-3.2 — Creative Questions for a chapter
  getCqs(chapterId: number): Observable<CqQuestion[]> {
    return this.http.get<CqQuestion[]>(`${this.apiUrl}/cq/chapter/${chapterId}`);
  }

  getTopics(chapterId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/topics/chapter/${chapterId}`);
  }
}

export interface CqPart {
  level: 'knowledge' | 'comprehension' | 'application' | 'higher';
  question_bn: string; question_en: string;
  model_answer_bn: string; model_answer_en: string;
  marks: number;
}
export interface CqQuestion {
  id: number; chapter_id: number; topic_id: number | null;
  stimulus_bn: string; stimulus_en: string;
  parts: CqPart[]; difficulty: string;
}
