import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LabSessionService } from './lab-session.service';

export interface LabCatalogItem {
  id: number; key: string; title_bn: string; title_en: string;
  supports_guided: boolean; supports_free: boolean; order_index: number;
  chapter_id: number; chapter_bn: string; chapter_en: string; chapter_order: number;
  subject_id: number; class_level: number;
  topic_bn: string | null; topic_en: string | null;
  subject_bn: string; subject_en: string;
}

export interface SafetyInfo {
  requiredKeys: string[];
  equipment: { key: string; name_bn: string; name_en: string; icon: string }[];
}

export interface SimulationAttempt {
  id: number; user_id: number; simulation_id: number; mode: string;
  started_at: string; completed_at?: string; duration_seconds?: number;
  steps: any[]; mistakes: number; hints_used: number; observation_data: any;
  result_summary?: string; status: string;
}

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private apiUrl = `${environment.apiUrl}/simulations`;
  private labSession = inject(LabSessionService);
  constructor(private http: HttpClient) {}

  getSimulation(key: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${key}`);
  }

  getCatalog(subjectId?: number, classLevel?: number): Observable<LabCatalogItem[]> {
    const q = new URLSearchParams();
    if (subjectId) q.set('subjectId', String(subjectId));
    if (classLevel) q.set('classLevel', String(classLevel));
    const qs = q.toString();
    return this.http.get<LabCatalogItem[]>(`${this.apiUrl}/catalog/list${qs ? '?' + qs : ''}`);
  }

  getSafety(key: string): Observable<SafetyInfo> {
    return this.http.get<SafetyInfo>(`${this.apiUrl}/${key}/safety`);
  }

  // Mode/safety come from the lab-launch flow (LabSessionService) so the backend
  // safety gate is satisfied and the attempt records the chosen mode (FR-2/FR-8).
  startAttempt(key: string, mode?: 'guided' | 'free'): Observable<SimulationAttempt> {
    return this.http.post<SimulationAttempt>(`${this.apiUrl}/${key}/attempts`, {
      mode: mode || this.labSession.getMode(key),
      safetySelection: this.labSession.getSelection(key),
    });
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
