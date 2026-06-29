import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiBaseUrl;

let refreshRequest: Promise<string> | null = null;

function isAuthEndpoint(url: string): boolean {
  try {
    const pathname = new URL(url, API_BASE_URL).pathname.replace(/\/+$/, '');
    return pathname === '/login' || pathname === '/refresh';
  } catch {
    return url.endsWith('/login') || url.endsWith('/refresh');
  }
}

async function requestNewAccessToken(
  tokenStorage: TokenStorageService,
): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('Missing refresh token.');
  }

  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Refresh token request failed.');
  }

  const data = await response.json();
  const accessToken: string | undefined = data.accessToken;

  if (!accessToken) {
    throw new Error('Refresh response did not include an access token.');
  }

  tokenStorage.setTokens(accessToken, data.refreshToken ?? refreshToken);
  return accessToken;
}

function refreshAccessToken(tokenStorage: TokenStorageService): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = requestNewAccessToken(tokenStorage).finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getAccessToken();
  const url = req.url;

  if (token) {
    req = addAuthHeader(req, token);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (isAuthEndpoint(url)) {
        return throwError(() => error);
      }

      const currentToken = tokenStorage.getAccessToken();

      if (currentToken && currentToken !== token) {
        return next(addAuthHeader(req, currentToken));
      }

      if (!tokenStorage.getRefreshToken()) {
        return throwError(() => error);
      }

      return from(refreshAccessToken(tokenStorage)).pipe(
        switchMap((newToken) => next(addAuthHeader(req, newToken))),
        catchError((refreshError: unknown) => {
          if (
            refreshError instanceof Error ||
            (refreshError && typeof refreshError === 'object')
          ) {
            tokenStorage.clearTokens();
          }
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
