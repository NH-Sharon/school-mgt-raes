import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExamQuestion {
  id: number; chapterId: number; questionBn: string; questionEn: string;
  options: { id: string; bn: string; en: string }[]; questionType: string; difficulty: string;
}

export interface ExamStartResponse {
  attempt: any;
  questions: ExamQuestion[];
}

@Injectable({ providedIn: 'root' })
export class ExamService {
  private apiUrl = `${environment.apiUrl}/exams`;
  constructor(private http: HttpClient) {}

  start(payload: {
    chapterIds: number[]; examMode: 'practice' | 'exam'; numQuestions?: number;
    timeLimitSec?: number; negativeMarking?: boolean; assignmentId?: number;
    topicIds?: number[]; difficulty?: 'basic' | 'medium' | 'advanced'; difficultyMix?: Record<string, number>;
  }): Observable<ExamStartResponse> {
    return this.http.post<ExamStartResponse>(`${this.apiUrl}/start`, payload);
  }

  getAttempt(attemptId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${attemptId}`);
  }

  saveAnswer(attemptId: number, questionId: number, chosenOptionIds: string[], timeSpentSec: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${attemptId}/answer`, { questionId, chosenOptionIds, timeSpentSec });
  }

  submit(attemptId: number, answers?: Record<number, string[]>, timedOut = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/${attemptId}/submit`, { answers, timedOut });
  }

  history(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/mine`);
  }

  weakChapters(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/weak-chapters/mine`);
  }

  createAssignment(payload: { titleBn: string; titleEn: string; classLevel: number; chapterIds: number[]; config?: any; dueAt?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignments`, payload);
  }

  myClassAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assignments/for-my-class`);
  }
}
