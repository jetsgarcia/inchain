import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError } from '@/shared/services/api-error-normalizer';

export type AdminActivityLog = {
  id: number;
  targetEntityType: string;
  targetEntityId: string | null;
  documentRequestId: number | null;
  actionType: string;
  actorNameOrEmail: string | null;
  description: string | null;
  oldStatusName: string | null;
  newStatusName: string | null;
  createdAt: string;
};

export type AdminActivityLogQuery = {
  actionType?: string;
  targetEntityType?: string;
  searchText?: string;
};

@Injectable({ providedIn: 'root' })
export class AdminActivityLogsService {
  private readonly http = inject(HttpClient);

  async getActivityLogs(
    query: AdminActivityLogQuery = {},
  ): Promise<AdminActivityLog[]> {
    try {
      let params = new HttpParams();
      if (query.actionType?.trim()) {
        params = params.set('actionType', query.actionType.trim());
      }
      if (query.targetEntityType?.trim()) {
        params = params.set('targetEntityType', query.targetEntityType.trim());
      }
      if (query.searchText?.trim()) {
        params = params.set('searchText', query.searchText.trim());
      }

      return await firstValueFrom(
        this.http.get<AdminActivityLog[]>('/api/admin/activity-logs', {
          params,
        }),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
}
