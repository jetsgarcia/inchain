export type UserRole = 'Admin' | 'Approver' | 'Requester' | (string & {});

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshToken?: string;
  [key: string]: unknown;
};

export type CurrentUser = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
  roles?: UserRole[];
  isDisabled?: boolean;
  isEmailConfirmed?: boolean;
  [key: string]: unknown;
};
