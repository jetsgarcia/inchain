import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, catchError } from 'rxjs';
import { AuthService } from '@/features/auth/auth.service';
import type { AdminUser } from '@/shared/models/user.types';

export type AdminDocumentType = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type AdminApprovalRoute = {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  approverUserId: string;
  approverName: string;
  isActive: boolean;
};

export type AdminActivityLog = {
  id: number;
  actionType: string;
  targetEntityType: string;
  description: string | null;
  actorNameOrEmail: string | null;
  createdAt: string;
};

export type RequesterRequestItem = {
  id: number;
  requestNumber: string;
  title: string;
  documentTypeName: string;
  statusName: string;
  createdAt: string;
  submittedAt: string | null;
};

export type ApproverRequestItem = {
  id: number;
  requestNumber: string;
  title: string;
  requesterName: string;
  documentTypeName: string;
  statusName: string;
  submittedAt: string | null;
  createdAt: string;
};

export type DashboardData = {
  admin?: {
    users: AdminUser[];
    documentTypes: AdminDocumentType[];
    approvalRoutes: AdminApprovalRoute[];
    activityLogs: AdminActivityLog[];
  };
  requester?: {
    requests: RequesterRequestItem[];
  };
  approver?: {
    requests: ApproverRequestItem[];
  };
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  loadDashboard(): Observable<DashboardData> {
    const roles = this.authService.roles();
    const isAdmin = roles.includes('Admin');
    const isRequester = roles.includes('Requester');
    const isApprover = roles.includes('Approver');
    const data: DashboardData = {};

    const requests$: Observable<unknown>[] = [];

    if (isAdmin) {
      requests$.push(
        forkJoin({
          users: this.http.get<AdminUser[]>('/api/admin/users').pipe(catchError(() => of([]))),
          documentTypes: this.http.get<AdminDocumentType[]>('/api/admin/document-types').pipe(catchError(() => of([]))),
          approvalRoutes: this.http.get<AdminApprovalRoute[]>('/api/admin/approval-routes').pipe(catchError(() => of([]))),
          activityLogs: this.http.get<AdminActivityLog[]>('/api/admin/activity-logs').pipe(catchError(() => of([]))),
        }).pipe(
          map((adminData) => {
            data.admin = adminData;
          }),
        ),
      );
    }

    if (isRequester) {
      requests$.push(
        this.http
          .get<RequesterRequestItem[]>('/api/document-requests')
          .pipe(
            catchError(() => of([])),
            map((requests) => {
              data.requester = { requests };
            }),
          ),
      );
    }

    if (isApprover) {
      requests$.push(
        this.http
          .get<ApproverRequestItem[]>('/api/approver/document-requests')
          .pipe(
            catchError(() => of([])),
            map((requests) => {
              data.approver = { requests };
            }),
          ),
      );
    }

    if (requests$.length === 0) {
      return of(data);
    }

    return forkJoin(requests$).pipe(map(() => data));
  }
}
