import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Book {
  id: number;
  subject_id: number;
  class_level: number;
  title_bn: string;
  title_en: string;
  page_count: number | null;
  subject_bn?: string;
  subject_en?: string;
  status?: string;
  original_name?: string;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/books`;

  list(params?: { classLevel?: number; subjectId?: number }): Observable<Book[]> {
    const q = new URLSearchParams();
    if (params?.classLevel) q.set('classLevel', String(params.classLevel));
    if (params?.subjectId) q.set('subjectId', String(params.subjectId));
    const qs = q.toString();
    return this.http.get<Book[]>(qs ? `${this.apiUrl}?${qs}` : this.apiUrl);
  }

  // Direct URL for pdf.js — token in the query string (range fetch bypasses the interceptor).
  fileUrl(bookId: number): string {
    const token = localStorage.getItem('token') || '';
    return `${this.apiUrl}/${bookId}/file?token=${encodeURIComponent(token)}`;
  }

  getProgress(bookId: number): Observable<{ lastPage: number }> {
    return this.http.get<{ lastPage: number }>(`${this.apiUrl}/${bookId}/progress/mine`);
  }

  saveProgress(bookId: number, lastPage: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.apiUrl}/${bookId}/progress`, { lastPage });
  }

  // Admin
  adminList(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/admin/all`);
  }
  upload(form: FormData): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/admin`, form);
  }
  remove(bookId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.apiUrl}/admin/${bookId}`);
  }
}
