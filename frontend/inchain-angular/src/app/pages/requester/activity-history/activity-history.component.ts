import { Component, inject, signal, computed } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
  lucideClock,
} from '@ng-icons/lucide';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  DocumentRequestsService,
  type DocumentRequestActivity,
  type RequesterDocumentRequestListItem,
} from '@/features/document-requests/document-requests.service';
import type { ApiError } from '@/shared/models/api-error.types';

type ActivityEntry = DocumentRequestActivity & {
  requestId: number;
  requestNumber: string;
  requestTitle: string;
};

const PAGE_SIZE = 10;

@Component({
  selector: 'app-activity-history',
  imports: [NgIcon, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
      lucideClock,
    }),
  ],
  templateUrl: './activity-history.component.html',
})
export class ActivityHistoryComponent {
  private readonly documentRequestsService = inject(DocumentRequestsService);

  readonly activities = signal<ActivityEntry[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly filteredActivities = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const raw = this.activities();

    if (query.length === 0) return raw;

    return raw.filter((activity) =>
      [
        activity.requestNumber,
        activity.requestTitle,
        activity.actionType,
        activity.actorNameOrEmail,
        activity.description,
        activity.remarks,
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      ),
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredActivities().length / PAGE_SIZE)),
  );

  readonly paginatedActivities = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredActivities().slice(start, start + PAGE_SIZE);
  });

  readonly visibleRange = computed(() => {
    const total = this.filteredActivities().length;
    if (total === 0) return { start: 0, end: 0 };
    const page = Math.min(this.currentPage(), this.totalPages());
    return {
      start: (page - 1) * PAGE_SIZE + 1,
      end: Math.min(page * PAGE_SIZE, total),
    };
  });

  constructor() {
    this.loadActivities();
  }

  protected setSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected async refreshActivities(): Promise<void> {
    this.isRefreshing.set(true);
    this.error.set(null);
    try {
      await this.loadActivities();
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(
        apiError.message ?? 'Unable to refresh activity history.',
      );
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected formatDateTime(value: string | null | undefined): string {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
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

  protected getStatusLabel(status: string | null): string {
    if (!status) return 'None';
    return status === 'PendingApproval' ? 'Pending approval' : status;
  }

  private async loadActivities(): Promise<void> {
    const requests =
      await this.documentRequestsService.getRequesterDocumentRequests();

    const activityResults = await Promise.allSettled(
      requests.map((request) =>
        this.documentRequestsService.getDocumentRequestActivities(request.id),
      ),
    );

    const entries = activityResults
      .flatMap((result, index) => {
        if (result.status !== 'fulfilled') return [];
        const request = requests[index];
        return result.value.map((activity) => ({
          ...activity,
          requestId: request.id,
          requestNumber: request.requestNumber,
          requestTitle: request.title,
        }));
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return (
          (Number.isNaN(bTime) ? 0 : bTime) -
          (Number.isNaN(aTime) ? 0 : aTime)
        );
      });

    this.activities.set(entries);
  }
}
