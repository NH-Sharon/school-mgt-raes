import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SimulationAttempt {
  id: number; user_id: number; simulation_id: number; mode: string;
  started_at: string; completed_at?: string; duration_seconds?: number;
  steps: any[]; mistakes: number; hints_used: number; observation_data: any;
  result_summary?: string; status: string;
}

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private apiUrl = `${environment.apiUrl}/simulations`;
  constructor(private http: HttpClient) {}

  getSimulation(key: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${key}`);
  }

  startAttempt(key: string, mode: 'guided' | 'free'): Observable<SimulationAttempt> {
    return this.http.post<SimulationAttempt>(`${this.apiUrl}/${key}/attempts`, { mode });
  }

  updateAttempt(attemptId: number, patch: { steps?: any[]; mistakes?: number; hintsUsed?: number; observationData?: any }): Observable<SimulationAttempt> {
    return this.http.put<SimulationAttempt>(`${this.apiUrl}/attempts/${attemptId}`, patch);
  }

  completeAttempt(attemptId: number, resultSummary: string, observationData?: any): Observable<SimulationAttempt> {
    return this.http.put<SimulationAttempt>(`${this.apiUrl}/attempts/${attemptId}/complete`, { resultSummary, observationData });
  }

  history(): Observable<SimulationAttempt[]> {
    return this.http.get<SimulationAttempt[]>(`${this.apiUrl}/attempts/history`);
  }
}
