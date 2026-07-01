import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { TokenStorageService } from '@/shared/services/token-storage.service';
import { normalizeApiError } from '@/shared/services/api-error-normalizer';
import type { CurrentUser, LoginRequest, LoginResponse, UserRole } from '@/shared/models/auth.types';
import type { ApiError } from '@/shared/models/api-error.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<CurrentUser | null>(null);
  private readonly _isLoading = signal(true);
  private readonly _error = signal<ApiError | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenStorage.getAccessToken());
  readonly roles = computed<UserRole[]>(() => {
    const user = this._currentUser();
    if (!user) {
      return [];
    }
    return user.roles ?? (user.role ? [user.role as UserRole] : []);
  });

  constructor(
    private readonly http: HttpClient,
    private readonly tokenStorage: TokenStorageService,
    private readonly router: Router,
  ) {}

  async login(email: string, password: string, rememberMe: boolean): Promise<void> {
    this._error.set(null);

    return new Promise<void>((resolve, reject) => {
      this.http
        .post<LoginResponse>('/login', { email, password } satisfies LoginRequest)
        .pipe(
          tap((response) => {
            if (response.accessToken) {
              this.tokenStorage.setTokens(
                response.accessToken,
                response.refreshToken,
              );
            }
          }),
          catchError((error: unknown) => {
            console.log('login raw error:', error);
            const apiError = normalizeApiError(error);
            console.log('login normalized:', apiError);
            this._error.set(apiError);
            reject(apiError);
            return of(null);
          }),
        )
        .subscribe((response) => {
          if (response) {
            this.loadCurrentUser()
              .then(() => {
                const returnUrl = this.router.parseUrl(
                  this.router.url,
                ).queryParams['returnUrl'];
                const target = returnUrl || '/dashboard';
                this.router.navigateByUrl(target, { replaceUrl: true });
                resolve();
              })
              .catch(reject);
          }
        });
    });
  }

  logout(): void {
    this.tokenStorage.clearTokens();
    this._currentUser.set(null);
    this._isLoading.set(false);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async loadCurrentUser(): Promise<CurrentUser | null> {
    this._isLoading.set(true);

    if (!this.tokenStorage.getAccessToken()) {
      this._isLoading.set(false);
      this._currentUser.set(null);
      return null;
    }

    return new Promise<CurrentUser | null>((resolve) => {
      this.http
        .get<CurrentUser>('/api/auth/me')
        .pipe(
          tap((user) => {
            this._currentUser.set(user);
            this._isLoading.set(false);
            resolve(user);
          }),
          catchError(() => {
            this._currentUser.set(null);
            this._isLoading.set(false);
            resolve(null);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  clearError(): void {
    this._error.set(null);
  }

  initialize(): Promise<void> {
    return this.loadCurrentUser().then(() => undefined);
  }
}
