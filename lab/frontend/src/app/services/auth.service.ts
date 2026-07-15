import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type Role = 'student' | 'teacher' | 'guardian' | 'content_admin' | 'system_admin';

export interface User {
  id: number;
  username: string;
  email?: string;
  role: Role;
  fullName: string;
  medium: 'bn' | 'en';
  classLevel?: number | null;
  institution?: string | null;
  points?: number;
  streakDays?: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      this.currentUserSubject.next(user);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(payload: {
    username: string; password: string; fullName: string; role: Role;
    medium?: 'bn' | 'en'; classLevel?: number; institution?: string; mobile?: string; email?: string;
  }): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/register`, payload);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  refreshMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  myLinkedStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/guardian-links/my-students`);
  }

  requestGuardianLink(studentUsername: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardian-links`, { studentUsername });
  }

  updateProfile(payload: Partial<{ classLevel: number; medium: string; fullName: string; institution: string; leaderboardOptIn: boolean }>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, payload).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}
