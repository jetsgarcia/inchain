import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError } from '@/shared/services/api-error-normalizer';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
  isDisabled: boolean;
};

export type CreateAdminUserRequest = {
  fullName: string;
  email: string;
  password: string;
  role: AdminUserRole;
};

export type AdminUserRole = 'Admin' | 'Approver' | 'Requester';

export const adminUserRoles: AdminUserRole[] = ['Admin', 'Approver', 'Requester'];

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  async getUsers(): Promise<AdminUser[]> {
    try {
      return await firstValueFrom(
        this.http.get<AdminUser[]>('/api/admin/users'),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getUser(userId: string): Promise<AdminUser> {
    try {
      return await firstValueFrom(
        this.http.get<AdminUser>(
          `/api/admin/users/${encodeURIComponent(userId)}`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async createUser(data: CreateAdminUserRequest): Promise<AdminUser> {
    try {
      return await firstValueFrom(
        this.http.post<AdminUser>('/api/admin/users', data),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async setUserDisabled(
    userId: string,
    isDisabled: boolean,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `/api/admin/users/${encodeURIComponent(userId)}/disabled`,
          { isDisabled },
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async updateUserRole(
    userId: string,
    role: AdminUserRole,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`/api/admin/users/${encodeURIComponent(userId)}`, {
          role,
        }),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
}
