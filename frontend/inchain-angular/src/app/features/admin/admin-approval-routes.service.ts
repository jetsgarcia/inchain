import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError } from '@/shared/services/api-error-normalizer';

export type AdminApprovalRoute = {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  approverId: string;
  approverFullName: string;
  approverEmail: string | null;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
};

export type AdminApprover = {
  id: string;
  fullName: string;
  email: string | null;
};

@Injectable({ providedIn: 'root' })
export class AdminApprovalRoutesService {
  private readonly http = inject(HttpClient);

  async getApprovalRoutes(): Promise<AdminApprovalRoute[]> {
    try {
      return await firstValueFrom(
        this.http.get<AdminApprovalRoute[]>('/api/admin/approval-routes'),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getApprovalRoute(
    approvalRouteId: number,
  ): Promise<AdminApprovalRoute> {
    try {
      return await firstValueFrom(
        this.http.get<AdminApprovalRoute>(
          `/api/admin/approval-routes/${encodeURIComponent(String(approvalRouteId))}`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getApprovers(): Promise<AdminApprover[]> {
    try {
      return await firstValueFrom(
        this.http.get<AdminApprover[]>('/api/admin/approvers'),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async assignDocumentTypeApprover(
    documentTypeId: number,
    approverId: string,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `/api/admin/document-types/${encodeURIComponent(String(documentTypeId))}/approver`,
          { approverId },
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async disableApprovalRoute(approvalRouteId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(
          `/api/admin/approval-routes/${encodeURIComponent(String(approvalRouteId))}/disable`,
          null,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
}
