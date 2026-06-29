import type { UserRole } from './auth.types';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole | string;
  isDisabled: boolean;
};

export type AdminUserRole = 'Admin' | 'Approver' | 'Requester';
