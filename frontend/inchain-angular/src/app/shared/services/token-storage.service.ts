import { Injectable, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'inchain_access_token';
const REFRESH_TOKEN_KEY = 'inchain_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly _accessToken = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );

  readonly accessToken = this._accessToken.asReadonly();

  getAccessToken(): string | null {
    return this._accessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    this._accessToken.set(accessToken);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._accessToken.set(null);
  }
}
