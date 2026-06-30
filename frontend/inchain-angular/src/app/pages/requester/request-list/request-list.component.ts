import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
  lucideClipboardPlus,
  lucideEye,
} from '@ng-icons/lucide';
import { StatusBadgeComponent } from '@/shared/components/status-badge.component';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  DocumentRequestsService,
  type RequesterDocumentRequestListItem,
  type DocumentRequestStatus,
} from '@/features/document-requests/document-requests.service';
import type { ApiError } from '@/shared/models/api-error.types';

type StatusFilter = 'all' | DocumentRequestStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'Draft' },
  { label: 'Pending', value: 'PendingApproval' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const PAGE_SIZE = 8;

@Component({
  selector: 'app-request-list',
  imports: [
    RouterLink,
    NgIcon,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
      lucideClipboardPlus,
      lucideEye,
    }),
  ],
  templateUrl: './request-list.component.html',
})
export class RequestListComponent {
  private readonly documentRequestsService = inject(DocumentRequestsService);

  readonly requests = signal<RequesterDocumentRequestListItem[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly statusFilters = STATUS_FILTERS;

  readonly filteredRequests = computed(() => {
    const raw = this.requests();
    const filter = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return raw.filter((request) => {
      const matchesStatus =
        filter === 'all' || request.statusName === filter;
      const matchesSearch =
        query.length === 0 ||
        [request.title, request.requestNumber, request.documentTypeName].some(
          (value) => value.toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRequests().length / PAGE_SIZE)),
  );

  readonly paginatedRequests = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredRequests().slice(start, start + PAGE_SIZE);
  });

  readonly visibleRange = computed(() => {
    const total = this.filteredRequests().length;
    if (total === 0) return { start: 0, end: 0 };
    const page = Math.min(this.currentPage(), this.totalPages());
    return {
      start: (page - 1) * PAGE_SIZE + 1,
      end: Math.min(page * PAGE_SIZE, total),
    };
  });

  readonly requestStats = computed(() => {
    const raw = this.requests();
    return {
      all: raw.length,
      Draft: raw.filter((r) => r.statusName === 'Draft').length,
      PendingApproval: raw.filter((r) => r.statusName === 'PendingApproval')
        .length,
      Approved: raw.filter((r) => r.statusName === 'Approved').length,
      Rejected: raw.filter((r) => r.statusName === 'Rejected').length,
      Cancelled: raw.filter((r) => r.statusName === 'Cancelled').length,
    };
  });

  constructor() {
    this.loadRequests();
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

  protected async refreshRequests(): Promise<void> {
    this.isRefreshing.set(true);
    await this.loadRequests();
    this.isRefreshing.set(false);
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
  }

  protected statusCount(filter: StatusFilter): number {
    const stats = this.requestStats();
    if (filter === 'all') return stats.all;
    return stats[filter as keyof typeof stats] ?? 0;
  }

  private async loadRequests(): Promise<void> {
    this.error.set(null);
    try {
      const data =
        await this.documentRequestsService.getRequesterDocumentRequests();
      this.requests.set(data);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load requests.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
