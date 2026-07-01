import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
  lucideAlertTriangle,
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
  selector: 'app-admin-roles',
  imports: [FormsModule, NgIcon, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
      lucideAlertTriangle,
    }),
  ],
  templateUrl: './roles.component.html',
})
export class AdminRolesComponent {
  private readonly adminUsersService = inject(AdminUsersService);

  readonly users = signal<AdminUser[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly changingRoleUserId = signal<string | null>(null);
  readonly roleChangeError = signal<string | null>(null);

  readonly statusFilters = STATUS_FILTERS;
  readonly roles = adminUserRoles;

  readonly soleAdminId = computed(() => {
    const admins = this.users().filter(
      (u) => String(u.role) === 'Admin' && !u.isDisabled,
    );
    return admins.length === 1 ? admins[0].id : null;
  });

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
      this.error.set(apiError.message ?? 'Unable to refresh.');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected async changeRole(user: AdminUser, newRole: string): Promise<void> {
    if (!adminUserRoles.includes(newRole as AdminUserRole)) return;
    if (String(user.role) === newRole) return;

    this.changingRoleUserId.set(user.id);
    this.roleChangeError.set(null);

    try {
      await this.adminUsersService.updateUserRole(
        user.id,
        newRole as AdminUserRole,
      );

      this.users.update((current) =>
        current.map((u) =>
          u.id === user.id ? { ...u, role: newRole } : u,
        ),
      );
    } catch (err) {
      const apiError = err as ApiError;
      this.roleChangeError.set(
        apiError.message ?? 'Unable to update role.',
      );
    } finally {
      this.changingRoleUserId.set(null);
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

  protected getUserRole(user: AdminUser): string {
    return user.role || 'Requester';
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
