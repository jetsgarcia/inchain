import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import type { ApiError } from "../../../lib/api/apiError";
import { paths } from "../../../routes/paths";
import type { UserRole } from "../authTypes";
import { useAuth } from "../useAuth";

type LoginFormErrors = {
  email?: string;
  password?: string;
};

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
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

  return Object.values(error.validationErrors).find(
    (messages) => messages.length > 0,
  )?.[0];
}

function getLoginErrorMessage(error: ApiError): string {
  if (error.statusCode === 400) {
    return (
      getFirstValidationError(error) ??
      "Check your email and password, then try again."
    );
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

function getReturnPathFromLocationState(state: unknown): string | null {
  const from = (state as LoginLocationState | null)?.from;

  if (
    !from?.pathname ||
    from.pathname === paths.login ||
    !from.pathname.startsWith("/")
  ) {
    return null;
  }

  return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
}

function getDefaultRouteForRoles(roles: UserRole[]): string {
  if (roles.includes("Admin")) {
    return paths.dashboard;
  }

  if (roles.includes("Approver")) {
    return paths.dashboard;
  }

  if (roles.includes("Requester")) {
    return paths.dashboard;
  }

  return paths.unauthorized;
}

function LoginPage() {
  const { clearAuthError, error, isAuthenticated, isLoading, login, roles } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRedirectAfterLogin, setShouldRedirectAfterLogin] =
    useState(false);

  useEffect(() => {
    if (!shouldRedirectAfterLogin || isLoading || !isAuthenticated) {
      return;
    }

    const returnPath = getReturnPathFromLocationState(location.state);
    navigate(returnPath ?? getDefaultRouteForRoles(roles), { replace: true });
  }, [
    isAuthenticated,
    isLoading,
    location.state,
    navigate,
    roles,
    shouldRedirectAfterLogin,
  ]);

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
      setShouldRedirectAfterLogin(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl">Sign in to Inchain</CardTitle>
          <CardDescription>Use your work account to continue.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 border-border bg-background"
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={Boolean(formErrors.email)}
                aria-describedby={formErrors.email ? "email-error" : undefined}
              />
              {formErrors.email ? (
                <p className="text-sm text-destructive" id="email-error">
                  {formErrors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 border-border bg-background"
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                autoComplete="current-password"
                disabled={isSubmitting}
                aria-invalid={Boolean(formErrors.password)}
                aria-describedby={
                  formErrors.password ? "password-error" : undefined
                }
              />
              {formErrors.password ? (
                <p className="text-sm text-destructive" id="password-error">
                  {formErrors.password}
                </p>
              ) : null}
            </div>

            {error ? (
              <Alert aria-live="polite" variant="destructive">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>
                  {getLoginErrorMessage(error)}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              className="h-10 w-full"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default LoginPage;
