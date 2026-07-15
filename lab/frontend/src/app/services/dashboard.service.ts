import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;
  constructor(private http: HttpClient) {}

  student(): Observable<any> {
    return this.http.get(`${this.apiUrl}/student`);
  }

  teacherClass(classLevel: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/teacher/class/${classLevel}`);
  }

  guardianStudent(studentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/guardian/student/${studentId}`);
  }

  leaderboard(classLevel: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leaderboard/${classLevel}`);
  }
}
