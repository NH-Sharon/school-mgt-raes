import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  constructor(private http: HttpClient) {}

  // Chapters
  listChapters(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/chapters`); }
  createChapter(payload: any): Observable<any> { return this.http.post(`${this.apiUrl}/chapters`, payload); }
  updateChapter(id: number, payload: any): Observable<any> { return this.http.put(`${this.apiUrl}/chapters/${id}`, payload); }
  setChapterStatus(id: number, status: string): Observable<any> { return this.http.put(`${this.apiUrl}/chapters/${id}/status`, { status }); }

  // Learning content
  createContent(payload: any): Observable<any> { return this.http.post(`${this.apiUrl}/content`, payload); }
  setContentStatus(id: number, status: string): Observable<any> { return this.http.put(`${this.apiUrl}/content/${id}/status`, { status }); }

  // Simulations
  createSimulation(payload: any): Observable<any> { return this.http.post(`${this.apiUrl}/simulations`, payload); }
  setSimulationStatus(id: number, status: string): Observable<any> { return this.http.put(`${this.apiUrl}/simulations/${id}/status`, { status }); }

  // Questions
  createQuestion(payload: any): Observable<any> { return this.http.post(`${this.apiUrl}/questions`, payload); }
  questionsForChapter(chapterId: number): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/questions/chapter/${chapterId}`); }
  setQuestionStatus(id: number, status: string): Observable<any> { return this.http.put(`${this.apiUrl}/questions/${id}/status`, { status }); }
  bulkImportQuestions(chapterId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.apiUrl}/questions/bulk-import/${chapterId}`, form);
  }

  // Users (system admin)
  listUsers(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/users`); }
  setUserRole(id: number, role: string): Observable<any> { return this.http.put(`${this.apiUrl}/users/${id}/role`, { role }); }

  auditLog(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/audit-log`); }
}
