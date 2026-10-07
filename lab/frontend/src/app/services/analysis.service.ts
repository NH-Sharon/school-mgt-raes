import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnalysisJob {
  id: number;
  book_id: number;
  book_title?: string;
  status: 'pending' | 'extracting' | 'generating' | 'ready' | 'failed';
  progress: any;
  error: string | null;
  created_at: string;
}

export interface ReviewChapter {
  id: number; title_bn: string; title_en: string; status: string; order_index: number;
  topics: { id: number; title_bn: string; title_en: string; status: string }[];
  mcqCount: number; cqCount: number;
  mcqs: any[]; cqs: any[];
}

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/analysis`;

  start(bookId: number, startPage: number, endPage: number): Observable<AnalysisJob> {
    return this.http.post<AnalysisJob>(`${this.apiUrl}/admin/${bookId}`, { startPage, endPage });
  }
  jobs(): Observable<AnalysisJob[]> {
    return this.http.get<AnalysisJob[]>(`${this.apiUrl}/admin/jobs`);
  }
  job(id: number): Observable<AnalysisJob> {
    return this.http.get<AnalysisJob>(`${this.apiUrl}/admin/jobs/${id}`);
  }
  review(bookId: number): Observable<ReviewChapter[]> {
    return this.http.get<ReviewChapter[]>(`${this.apiUrl}/admin/review/${bookId}`);
  }
  publishChapter(chapterId: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.apiUrl}/admin/publish-chapter/${chapterId}`, {});
  }
  discardChapter(chapterId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.apiUrl}/admin/chapter/${chapterId}`);
  }
}
