import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
  lucidePlus,
  lucidePencil,
  lucideAlertTriangle,
  lucideX,
  lucideRoute,
} from '@ng-icons/lucide';
import { StatusBadgeComponent } from '@/shared/components/status-badge.component';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  AdminApprovalRoutesService,
  type AdminApprovalRoute,
  type AdminApprover,
} from '@/features/admin/admin-approval-routes.service';
import {
  AdminDocumentTypesService,
  type AdminDocumentType,
} from '@/features/admin/admin-document-types.service';
import type { ApiError } from '@/shared/models/api-error.types';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const PAGE_SIZE = 5;

type FormMode = 'assign' | 'edit';

@Component({
  selector: 'app-admin-approval-routes',
  imports: [FormsModule, NgIcon, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
      lucidePlus,
      lucidePencil,
      lucideAlertTriangle,
      lucideX,
      lucideRoute,
    }),
  ],
  templateUrl: './approval-routes.component.html',
})
export class AdminApprovalRoutesComponent {
  private readonly routesService = inject(AdminApprovalRoutesService);
  private readonly docTypesService = inject(AdminDocumentTypesService);

  readonly routes = signal<AdminApprovalRoute[]>([]);
  readonly approvers = signal<AdminApprover[]>([]);
  readonly documentTypes = signal<AdminDocumentType[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusUpdateError = signal<string | null>(null);

  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  // Form state
  readonly activeForm = signal<FormMode | null>(null);
  readonly editingRoute = signal<AdminApprovalRoute | null>(null);
  readonly formDocumentTypeId = signal<number | null>(null);
  readonly formApproverId = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly isSubmittingForm = signal(false);

  // Disable confirm
  readonly pendingDisableRoute = signal<AdminApprovalRoute | null>(null);

  readonly statusFilters = STATUS_FILTERS;

  readonly activeDocumentTypes = computed(() =>
    this.documentTypes().filter((dt) => dt.isActive),
  );

  readonly canAssignRoute = computed(
    () => this.activeDocumentTypes().length > 0 && this.approvers().length > 0,
  );

  readonly statusCounts = computed(() => ({
    all: this.routes().length,
    active: this.routes().filter((r) => r.isActive).length,
    inactive: this.routes().filter((r) => !r.isActive).length,
  }));

  readonly filteredRoutes = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();

    return this.routes()
      .filter((route) => {
        const matchesStatus =
          filter === 'all' ||
          (filter === 'active' && route.isActive) ||
          (filter === 'inactive' && !route.isActive);
        const matchesSearch =
          query.length === 0 ||
          [
            route.documentTypeName,
            route.approverFullName,
            route.approverEmail,
          ].some((value) =>
            String(value ?? '').toLowerCase().includes(query),
          );
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) =>
        a.documentTypeName.localeCompare(b.documentTypeName),
      );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRoutes().length / PAGE_SIZE)),
  );

  readonly paginatedRoutes = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredRoutes().slice(start, start + PAGE_SIZE);
  });

  readonly visibleRange = computed(() => {
    const total = this.filteredRoutes().length;
    if (total === 0) return { start: 0, end: 0 };
    const page = Math.min(this.currentPage(), this.totalPages());
    return {
      start: (page - 1) * PAGE_SIZE + 1,
      end: Math.min(page * PAGE_SIZE, total),
    };
  });

  constructor() {
    this.loadData();
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

  protected async refresh(): Promise<void> {
    this.isRefreshing.set(true);
    this.error.set(null);
    try {
      await this.loadRoutes();
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to refresh.');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected openAssign(): void {
    this.activeForm.set('assign');
    this.editingRoute.set(null);
    this.formDocumentTypeId.set(this.activeDocumentTypes()[0]?.id ?? null);
    this.formApproverId.set(this.approvers()[0]?.id ?? null);
    this.formError.set(null);
    this.isSubmittingForm.set(false);
  }

  protected openEdit(route: AdminApprovalRoute): void {
    this.activeForm.set('edit');
    this.editingRoute.set(route);
    this.formDocumentTypeId.set(route.documentTypeId);
    this.formApproverId.set(route.approverId);
    this.formError.set(null);
    this.isSubmittingForm.set(false);
  }

  protected closeForm(): void {
    if (this.isSubmittingForm()) return;
    this.activeForm.set(null);
  }

  protected async submitForm(): Promise<void> {
    const docTypeId = this.formDocumentTypeId();
    const approverId = this.formApproverId();
    if (!docTypeId || !approverId) return;

    this.isSubmittingForm.set(true);
    this.formError.set(null);

    try {
      await this.routesService.assignDocumentTypeApprover(
        docTypeId,
        approverId,
      );

      this.activeForm.set(null);
      await this.loadRoutes();
    } catch (err) {
      const apiError = err as ApiError;
      this.formError.set(
        apiError.message ?? 'Unable to save approval route.',
      );
    } finally {
      this.isSubmittingForm.set(false);
    }
  }

  protected confirmDisable(route: AdminApprovalRoute): void {
    this.pendingDisableRoute.set(route);
    this.statusUpdateError.set(null);
  }

  protected cancelDisable(): void {
    this.pendingDisableRoute.set(null);
  }

  protected async disableRoute(): Promise<void> {
    const route = this.pendingDisableRoute();
    if (!route) return;

    this.isSubmittingForm.set(true);
    this.statusUpdateError.set(null);

    try {
      await this.routesService.disableApprovalRoute(route.id);
      this.routes.update((current) =>
        current.map((r) =>
          r.id === route.id ? { ...r, isActive: false } : r,
        ),
      );
      this.pendingDisableRoute.set(null);
    } catch (err) {
      const apiError = err as ApiError;
      this.statusUpdateError.set(
        apiError.message ?? 'Unable to disable approval route.',
      );
    } finally {
      this.isSubmittingForm.set(false);
    }
  }

  protected getApproverDisplayName(route: AdminApprovalRoute): string {
    return route.approverFullName.trim() || route.approverEmail || 'Unnamed approver';
  }

  protected getApproverInitials(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return label.slice(0, 2).toUpperCase();
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  protected getRouteActivityLabel(route: AdminApprovalRoute): string {
    if (route.updatedAt) return `Updated ${this.formatDate(route.updatedAt)}`;
    return `Created ${this.formatDate(route.createdAt)}`;
  }

  private async loadRoutes(): Promise<void> {
    this.error.set(null);
    try {
      const data = await this.routesService.getApprovalRoutes();
      this.routes.set(data);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load approval routes.');
    }
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [routes, approvers, docTypes] = await Promise.all([
        this.routesService.getApprovalRoutes(),
        this.routesService.getApprovers(),
        this.docTypesService.getDocumentTypes(),
      ]);
      this.routes.set(routes);
      this.approvers.set(approvers);
      this.documentTypes.set(docTypes);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load data.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
