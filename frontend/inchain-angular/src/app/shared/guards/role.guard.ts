import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@/features/auth/auth.service';
import type { UserRole } from '@/shared/models/auth.types';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRoles = authService.roles();
    const hasAllowedRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      return router.parseUrl('/unauthorized');
    }

    return true;
  };
}
