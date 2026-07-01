import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '@/features/auth/auth.service';
import type { ApiError } from '@/shared/models/api-error.types';

type LoginFormErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

const GENERIC_FALLBACKS = new Set([
  'You are not authorized to perform this action.',
  'You do not have permission to access this resource.',
  'The requested resource was not found.',
  'An unexpected server error occurred. Please try again later.',
  'Something went wrong. Please try again.',
]);

function isGenericFallback(message: string, _statusCode: number): boolean {
  return GENERIC_FALLBACKS.has(message);
}

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  protected email = '';
  protected password = '';
  protected rememberMe = false;
  protected formErrors = signal<LoginFormErrors>({});
  protected isSubmitting = signal(false);

  get error(): ApiError | null {
    return this.authService.error();
  }

  protected getLoginErrorMessage(error: ApiError): string {
    // Always prioritize backend error messages about locked/disabled accounts
    const msg = error.message?.toLowerCase() ?? '';
    if (msg.includes('locked') || msg.includes('disabled')) {
      return 'Your account has been disabled. Contact an administrator.';
    }

    if (error.statusCode === 400) {
      if (error.validationErrors) {
        const first = Object.values(error.validationErrors).find(
          (messages) => messages.length > 0,
        )?.[0];
        if (first) return first;
      }
      if (error.message && !isGenericFallback(error.message, 400)) {
        return error.message;
      }
      return 'Check your email and password, then try again.';
    }

    if (error.statusCode === 401) {
      if (error.message && !isGenericFallback(error.message, 401)) {
        return error.message;
      }
      return 'The email or password you entered is incorrect.';
    }

    if (error.statusCode === 403) {
      if (error.message && !isGenericFallback(error.message, 403)) {
        return error.message;
      }
      return 'Your account does not have permission to sign in.';
    }

    if (error.statusCode === 423) {
      if (error.message && !isGenericFallback(error.message, 423)) {
        return error.message;
      }
      return 'Your account has been disabled. Contact an administrator.';
    }

    if (error.statusCode === 429) {
      return 'Too many sign-in attempts. Wait a moment, then try again.';
    }

    if (error.statusCode && error.statusCode >= 500) {
      return 'The server had a problem signing you in. Please try again shortly.';
    }

    return 'We could not reach the server. Check your connection and try again.';
  }

  async handleSubmit(): Promise<void> {
    this.authService.clearError();

    const nextErrors = validateLoginForm(this.email, this.password);
    this.formErrors.set(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      await this.authService.login(this.email.trim(), this.password, this.rememberMe);
    } catch {
      // Error is already set on the auth service
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
