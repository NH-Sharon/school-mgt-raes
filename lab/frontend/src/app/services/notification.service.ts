import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  constructor(private http: HttpClient) {}

  list(): Observable<any[]> { return this.http.get<any[]>(this.apiUrl); }
  markRead(id: number): Observable<any> { return this.http.put(`${this.apiUrl}/${id}/read`, {}); }
  markAllRead(): Observable<any> { return this.http.put(`${this.apiUrl}/read-all`, {}); }

  broadcastAnnouncement(payload: { classLevel: number; subjectId?: number; messageBn: string; messageEn: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/announcements`, payload);
  }
  myClassAnnouncements(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/announcements/for-my-class`); }
}
