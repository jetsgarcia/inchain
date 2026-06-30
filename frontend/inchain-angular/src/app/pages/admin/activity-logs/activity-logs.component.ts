import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
} from '@ng-icons/lucide';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  AdminActivityLogsService,
  type AdminActivityLog,
} from '@/features/admin/admin-activity-logs.service';
import type { ApiError } from '@/shared/models/api-error.types';

const PAGE_SIZE = 10;

const ACTION_TYPE_OPTIONS = [
  'all',
  'UserCreated',
  'UserUpdated',
  'UserDisabled',
  'UserEnabled',
  'DocumentTypeCreated',
  'DocumentTypeUpdated',
  'DocumentTypeEnabled',
  'DocumentTypeDisabled',
  'ApprovalRouteCreated',
  'ApprovalRouteUpdated',
  'ApprovalRouteDisabled',
  'DocumentRequestCreated',
  'DocumentRequestUpdated',
  'DocumentRequestSubmitted',
  'DocumentRequestApproved',
  'DocumentRequestRejected',
  'DocumentRequestCancelled',
  'DocumentRequestDeleted',
];

@Component({
  selector: 'app-admin-activity-logs',
  imports: [FormsModule, NgIcon, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
    }),
  ],
  templateUrl: './activity-logs.component.html',
})
export class AdminActivityLogsComponent {
  private readonly service = inject(AdminActivityLogsService);

  readonly logs = signal<AdminActivityLog[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly actionFilter = signal('all');
  readonly entityFilter = signal('all');
  readonly currentPage = signal(1);

  readonly actionTypeOptions = ACTION_TYPE_OPTIONS;

  readonly entityTypeOptions = [
    'all',
    'User',
    'DocumentType',
    'ApprovalRoute',
    'DocumentRequest',
  ];

  readonly filteredLogs = computed(() => {
    const raw = this.logs();
    const query = this.searchQuery().trim().toLowerCase();
    const action = this.actionFilter();
    const entity = this.entityFilter();

    return raw.filter((log) => {
      const matchesAction =
        action === 'all' || log.actionType === action;
      const matchesEntity =
        entity === 'all' || log.targetEntityType === entity;
      const matchesSearch =
        query.length === 0 ||
        [
          log.actionType,
          log.targetEntityType,
          log.actorNameOrEmail,
          log.description,
        ].some((value) =>
          String(value ?? '').toLowerCase().includes(query),
        );
      return matchesAction && matchesEntity && matchesSearch;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredLogs().length / PAGE_SIZE)),
  );

  readonly paginatedLogs = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredLogs().slice(start, start + PAGE_SIZE);
  });

  readonly visibleRange = computed(() => {
    const total = this.filteredLogs().length;
    if (total === 0) return { start: 0, end: 0 };
    const page = Math.min(this.currentPage(), this.totalPages());
    return {
      start: (page - 1) * PAGE_SIZE + 1,
      end: Math.min(page * PAGE_SIZE, total),
    };
  });

  constructor() {
    this.loadLogs();
  }

  protected setSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected setActionFilter(value: string): void {
    this.actionFilter.set(value);
    this.currentPage.set(1);
  }

  protected setEntityFilter(value: string): void {
    this.entityFilter.set(value);
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected async refresh(): Promise<void> {
    this.isRefreshing.set(true);
    this.error.set(null);
    try {
      await this.loadLogs();
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to refresh logs.');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected formatDateTime(value: string | null | undefined): string {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  protected getActionLabel(actionType: string): string {
    return (
      actionType
        .replaceAll(/[_-]+/g, ' ')
        .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim() || 'Activity recorded'
    );
  }

  private async loadLogs(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.getActivityLogs();
      this.logs.set(data);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load activity logs.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
