import type { HttpErrorResponse } from '@angular/common/http';
import type { ApiError, ApiValidationErrors } from '@/shared/models/api-error.types';

function parseValidationErrors(body: unknown): ApiValidationErrors | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const obj = body as Record<string, unknown>;
  const entries = Object.entries(obj).filter((entry): entry is [string, string[]] =>
    Array.isArray(entry[1]) && entry[1].every((v) => typeof v === 'string'),
  );

  return entries.length > 0 ? Object.fromEntries(entries) as ApiValidationErrors : undefined;
}

function extractMessage(body: unknown, statusCode: number): string {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const message = obj['message'];
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    const title = obj['title'];
    if (typeof title === 'string' && title.trim().length > 0) {
      return title;
    }
  }

  if (statusCode === 401) {
    return 'You are not authorized to perform this action.';
  }

  if (statusCode === 403) {
    return 'You do not have permission to access this resource.';
  }

  if (statusCode === 423) {
    return 'Your account has been disabled.';
  }

  if (statusCode === 404) {
    return 'The requested resource was not found.';
  }

  if (statusCode >= 500) {
    return 'An unexpected server error occurred. Please try again later.';
  }

  return 'Something went wrong. Please try again.';
}

export function normalizeApiError(error: unknown): ApiError {
  const httpError = error as HttpErrorResponse;

  if (httpError?.status && typeof httpError.status === 'number') {
    const body = httpError.error ?? {};
    const validationErrors = parseValidationErrors(body);

    return {
      statusCode: httpError.status,
      message: validationErrors
        ? extractMessage(body, httpError.status)
        : extractMessage(body, httpError.status),
      validationErrors,
    };
  }

  if (error instanceof Error) {
    return { statusCode: 0, message: error.message };
  }

  return { statusCode: 0, message: 'An unknown error occurred.' };
}

export function isApiError(error: unknown): error is ApiError {
  const apiError = error as ApiError;
  return (
    typeof apiError === 'object' &&
    apiError !== null &&
    typeof apiError.statusCode === 'number' &&
    typeof apiError.message === 'string'
  );
}
