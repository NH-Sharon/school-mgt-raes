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
}
