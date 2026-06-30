import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
  lucideUserPlus,
  lucideUserX,
  lucideUserCheck,
  lucideAlertTriangle,
  lucideX,
} from '@ng-icons/lucide';
import { StatusBadgeComponent } from '@/shared/components/status-badge.component';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  AdminUsersService,
  adminUserRoles,
  type AdminUser,
  type AdminUserRole,
} from '@/features/admin/admin-users.service';
import type { ApiError } from '@/shared/models/api-error.types';

type StatusFilter = 'all' | 'active' | 'disabled';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'disabled' },
];

const PAGE_SIZE = 5;

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, NgIcon, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
      lucideUserPlus,
      lucideUserX,
      lucideUserCheck,
      lucideAlertTriangle,
      lucideX,
    }),
  ],
  templateUrl: './users.component.html',
})
export class AdminUsersComponent {
  private readonly adminUsersService = inject(AdminUsersService);

  readonly users = signal<AdminUser[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  // Create user form
  readonly showCreateSheet = signal(false);
  readonly createFullName = signal('');
  readonly createEmail = signal('');
  readonly createPassword = signal('');
  readonly createRole = signal<AdminUserRole>('Requester');
  readonly createError = signal<string | null>(null);
  readonly createValidationErrors = signal<string[]>([]);
  readonly isCreating = signal(false);
  readonly fullNameTouched = signal(false);
  readonly emailTouched = signal(false);
  readonly passwordTouched = signal(false);

  // Disable/enable confirm
  readonly pendingDisableUserId = signal<string | null>(null);
  readonly pendingDisableAction = signal<'enable' | 'disable' | null>(null);
  readonly isTogglingStatus = signal(false);
  readonly toggleError = signal<string | null>(null);

  readonly statusFilters = STATUS_FILTERS;
  readonly adminUserRoles = adminUserRoles;

  readonly statusCounts = computed(() => {
    const raw = this.users();
    return {
      all: raw.length,
      active: raw.filter((u) => !u.isDisabled).length,
      disabled: raw.filter((u) => u.isDisabled).length,
    };
  });

  readonly filteredUsers = computed(() => {
    const raw = this.users();
    const filter = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return raw.filter((user) => {
      const matchesStatus =
        filter === 'all' ||
        (filter === 'active' && !user.isDisabled) ||
        (filter === 'disabled' && user.isDisabled);
      const matchesSearch =
        query.length === 0 ||
        [user.fullName, user.email].some((value) =>
          String(value ?? '').toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredUsers().length / PAGE_SIZE)),
  );

  readonly paginatedUsers = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredUsers().slice(start, start + PAGE_SIZE);
  });

  readonly visibleRange = computed(() => {
    const total = this.filteredUsers().length;
    if (total === 0) return { start: 0, end: 0 };
    const page = Math.min(this.currentPage(), this.totalPages());
    return {
      start: (page - 1) * PAGE_SIZE + 1,
      end: Math.min(page * PAGE_SIZE, total),
    };
  });

  constructor() {
    this.loadUsers();
  }

  protected get fullNameError(): string | null {
    if (!this.fullNameTouched()) return null;
    if (!this.createFullName().trim()) return 'Full name is required.';
    return null;
  }

  protected get emailError(): string | null {
    if (!this.emailTouched()) return null;
    const value = this.createEmail().trim();
    if (!value) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return 'Enter a valid email address.';
    return null;
  }

  protected get passwordError(): string | null {
    if (!this.passwordTouched()) return null;
    const value = this.createPassword();
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters.';
    return null;
  }

  protected statusCount(filter: StatusFilter): number {
    const counts = this.statusCounts();
    if (filter === 'all') return counts.all;
    if (filter === 'active') return counts.active;
    return counts.disabled;
  }

  protected setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  protected setSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected async refreshUsers(): Promise<void> {
    this.isRefreshing.set(true);
    this.error.set(null);
    try {
      await this.loadUsers();
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to refresh users.');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected openCreateSheet(): void {
    this.showCreateSheet.set(true);
    this.createFullName.set('');
    this.createEmail.set('');
    this.createPassword.set('');
    this.createRole.set('Requester');
    this.createError.set(null);
    this.createValidationErrors.set([]);
    this.fullNameTouched.set(false);
    this.emailTouched.set(false);
    this.passwordTouched.set(false);
  }

  protected closeCreateSheet(): void {
    if (this.isCreating()) return;
    this.showCreateSheet.set(false);
  }

  protected async createUser(): Promise<void> {
    this.fullNameTouched.set(true);
    this.emailTouched.set(true);
    this.passwordTouched.set(true);

    const localErrors: string[] = [];
    const nameErr = this.fullNameError;
    const emailErr = this.emailError;
    const passwordErr = this.passwordError;
    if (nameErr) localErrors.push(nameErr);
    if (emailErr) localErrors.push(emailErr);
    if (passwordErr) localErrors.push(passwordErr);

    if (localErrors.length > 0) {
      this.createValidationErrors.set(localErrors);
      return;
    }

    this.isCreating.set(true);
    this.createError.set(null);
    this.createValidationErrors.set([]);

    try {
      const newUser = await this.adminUsersService.createUser({
        fullName: this.createFullName().trim(),
        email: this.createEmail().trim(),
        password: this.createPassword(),
        role: this.createRole(),
      });

      this.users.update((current) => [...current, newUser]);
      this.showCreateSheet.set(false);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.validationErrors) {
        const allErrors: string[] = [];
        for (const [, messages] of Object.entries(
          apiError.validationErrors,
        )) {
          allErrors.push(...messages);
        }
        this.createValidationErrors.set(allErrors);
      } else {
        this.createError.set(
          apiError.message ?? 'Unable to create user.',
        );
      }
    } finally {
      this.isCreating.set(false);
    }
  }

  protected confirmDisableToggle(
    userId: string,
    isDisabled: boolean,
  ): void {
    this.pendingDisableUserId.set(userId);
    this.pendingDisableAction.set(isDisabled ? 'disable' : 'enable');
    this.toggleError.set(null);
  }

  protected cancelDisableToggle(): void {
    this.pendingDisableUserId.set(null);
    this.pendingDisableAction.set(null);
  }

  protected async toggleUserStatus(): Promise<void> {
    const userId = this.pendingDisableUserId();
    const action = this.pendingDisableAction();
    if (!userId || !action) return;

    this.isTogglingStatus.set(true);
    this.toggleError.set(null);

    try {
      await this.adminUsersService.setUserDisabled(
        userId,
        action === 'disable',
      );

      this.users.update((current) =>
        current.map((u) =>
          u.id === userId
            ? { ...u, isDisabled: action === 'disable' }
            : u,
        ),
      );

      this.pendingDisableUserId.set(null);
      this.pendingDisableAction.set(null);
    } catch (err) {
      const apiError = err as ApiError;
      this.toggleError.set(
        apiError.message ?? 'Unable to update user status.',
      );
    } finally {
      this.isTogglingStatus.set(false);
    }
  }

  protected getUserInitials(user: AdminUser): string {
    const label = user.fullName.trim() || user.email || 'Unnamed';
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return label.slice(0, 2).toUpperCase();
  }

  private async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.adminUsersService.getUsers();
      this.users.set(data);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load users.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
