import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/button";
import type { ApiError } from "../../../lib/api/apiError";
import { useAuth } from "../useAuth";

type LoginFormErrors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

function getFirstValidationError(error: ApiError): string | undefined {
  if (!error.validationErrors) {
    return undefined;
  }

  return Object.values(error.validationErrors).find((messages) => messages.length > 0)?.[0];
}

function getLoginErrorMessage(error: ApiError): string {
  if (error.statusCode === 400) {
    return getFirstValidationError(error) ?? "Check your email and password, then try again.";
  }

  if (error.statusCode === 401) {
    return "The email or password you entered is incorrect.";
  }

  if (error.statusCode === 403) {
    return "Your account does not have permission to sign in.";
  }

  if (error.statusCode === 429) {
    return "Too many sign-in attempts. Wait a moment, then try again.";
  }

  if (error.statusCode && error.statusCode >= 500) {
    return "The server had a problem signing you in. Please try again shortly.";
  }

  return "We could not reach the server. Check your connection and try again.";
}

function LoginPage() {
  const { clearAuthError, error, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthError();

    const nextErrors = validateLoginForm(email, password);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
            >
              IC
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Inchain</p>
              <p className="text-xs text-muted-foreground">Approval workflow workspace</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Sign in to Inchain</h1>
            <p className="mt-1 text-sm text-muted-foreground">Use your work account to continue.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email ? (
                <p className="text-sm text-red-600" id="email-error">
                  {formErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(formErrors.password)}
                aria-describedby={formErrors.password ? "password-error" : undefined}
              />
              {formErrors.password ? (
                <p className="text-sm text-red-600" id="password-error">
                  {formErrors.password}
                </p>
              ) : null}
            </div>

            {error ? (
              <div
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
                aria-live="polite"
              >
                <p className="font-medium">Sign-in failed</p>
                <p className="mt-1">{getLoginErrorMessage(error)}</p>
              </div>
            ) : null}

            <Button className="h-10 w-full rounded-md" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
