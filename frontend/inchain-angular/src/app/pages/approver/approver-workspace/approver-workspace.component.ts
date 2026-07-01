import { Component, inject, signal, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideArrowDownToLine,
  lucideCheckCircle2,
  lucideClipboardCheck,
  lucideClipboardClock,
  lucideEye,
  lucideFileText,
  lucideRefreshCw,
  lucideSearch,
  lucideX,
  lucideXCircle,
} from '@ng-icons/lucide';
import { StatusBadgeComponent } from '@/shared/components/status-badge.component';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  DocumentRequestsService,
  getAttachmentFileName,
  type ApproverDocumentRequestListItem,
  type ApproverDocumentRequestDetail,
  type AttachmentMetadata,
  type DocumentRequestActivity,
} from '@/features/document-requests/document-requests.service';
import type { ApiError } from '@/shared/models/api-error.types';

type StatusFilter = 'all' | 'Approved' | 'Rejected';

const REVIEWED_STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

const PAGE_SIZE = 8;

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

@Component({
  selector: 'app-approver-workspace',
  imports: [
    FormsModule,
    NgIcon,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideArrowDownToLine,
      lucideCheckCircle2,
      lucideClipboardCheck,
      lucideClipboardClock,
      lucideEye,
      lucideFileText,
      lucideRefreshCw,
      lucideSearch,
      lucideX,
      lucideXCircle,
    }),
  ],
  templateUrl: './approver-workspace.component.html',
})
export class ApproverWorkspaceComponent {
  private readonly docService = inject(DocumentRequestsService);

  readonly mode = input.required<'pending' | 'reviewed'>();

  readonly requests = signal<ApproverDocumentRequestListItem[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly currentPage = signal(1);

  // Detail sheet
  readonly activeRequestId = signal<number | null>(null);
  readonly activeRequest = signal<ApproverDocumentRequestDetail | null>(null);
  readonly activeActivities = signal<DocumentRequestActivity[]>([]);
  readonly isLoadingDetail = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly processingLabel = signal<string | null>(null);

  // Approval dialog
  readonly showApprovalDialog = signal(false);
  readonly approvalRemarks = signal('');

  // Rejection dialog
  readonly showRejectionDialog = signal(false);
  readonly rejectionRemarks = signal('');

  readonly reviewedStatusFilters = REVIEWED_STATUS_FILTERS;

  readonly isPendingMode = computed(() => this.mode() === 'pending');
  readonly isDetailOpen = computed(() => this.activeRequestId() !== null);
  readonly canReview = computed(
    () =>
      this.isPendingMode() &&
      this.activeRequest()?.statusName === 'PendingApproval',
  );
  readonly canSubmitRejection = computed(
    () => this.rejectionRemarks().trim().length > 0,
  );

  readonly pageCopy = computed(() =>
    this.isPendingMode()
      ? {
          title: 'Pending requests',
          description:
            'Review document requests assigned to you and approve or reject pending work.',
          emptyTitle: 'No pending approvals',
          emptyDescription:
            'New assignments will appear here when requesters submit documents for your review.',
        }
      : {
          title: 'Reviewed requests',
          description:
            'View approved and rejected requests you have already completed.',
          emptyTitle: 'No reviewed requests',
          emptyDescription:
            'Approved and rejected assignments will appear here when they are returned by the approver request API.',
        },
  );

  readonly requestStats = computed(() => {
    const all = this.requests();
    const pending = all.filter((r) => r.statusName === 'PendingApproval');
    const reviewed = all.filter(
      (r) => r.statusName === 'Approved' || r.statusName === 'Rejected',
    );
    return {
      pending: pending.length,
      newToday: pending.filter((r) => isToday(r.submittedAt ?? r.createdAt))
        .length,
      oldestPending: pending[0] ?? null,
      reviewed: reviewed.length,
      Approved: reviewed.filter((r) => r.statusName === 'Approved').length,
      Rejected: reviewed.filter((r) => r.statusName === 'Rejected').length,
    };
  });

  readonly modeRequests = computed(() => {
    const all = this.requests();
    if (this.isPendingMode()) {
      return all.filter((r) => r.statusName === 'PendingApproval');
    }
    return all.filter(
      (r) => r.statusName === 'Approved' || r.statusName === 'Rejected',
    );
  });

  readonly filteredRequests = computed(() => {
    const modeReqs = this.modeRequests();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();
    const isPending = this.isPendingMode();

    return modeReqs.filter((r) => {
      const matchesStatus =
        isPending || filter === 'all' || r.statusName === filter;
      const matchesSearch =
        query.length === 0 ||
        [
          r.title,
          r.requestNumber,
          r.documentTypeName,
          r.requesterName,
          r.requesterEmail ?? '',
        ].some((v) => v.toLowerCase().includes(query));
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

  constructor() {
    this.loadRequests();
  }

  // --- Templating helpers ---

  protected formatDate(value: string | null | undefined): string {
    if (!value) return 'Not set';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown date' : dateFormatter.format(date);
  }

  protected formatDateTime(value: string | null | undefined): string {
    if (!value) return 'Not set';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown date' : dateTimeFormatter.format(date);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected getRequesterLabel(
    request: Pick<
      ApproverDocumentRequestListItem,
      'requesterEmail' | 'requesterName'
    >,
  ): string {
    return request.requesterName.trim() || request.requesterEmail || 'Unknown requester';
  }

  protected getActionLabel(actionType: string): string {
    return (
      actionType
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim() || 'Activity recorded'
    );
  }

  protected getStatusLabel(status: string): string {
    return status === 'PendingApproval' ? 'Pending approval' : status;
  }

  // --- Actions ---

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected setSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected setStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  protected async refreshRequests(): Promise<void> {
    this.isRefreshing.set(true);
    this.error.set(null);
    try {
      await this.loadRequests();
    } catch (err) {
      this.error.set((err as ApiError).message ?? 'Unable to refresh requests.');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected openDetail(requestId: number): void {
    this.activeRequestId.set(requestId);
    this.activeRequest.set(null);
    this.activeActivities.set([]);
    this.detailError.set(null);
    this.actionError.set(null);
    void this.loadDetail(requestId);
  }

  protected closeDetail(): void {
    this.activeRequestId.set(null);
    this.activeRequest.set(null);
    this.activeActivities.set([]);
    this.detailError.set(null);
    this.actionError.set(null);
    this.approvalRemarks.set('');
    this.rejectionRemarks.set('');
    this.showApprovalDialog.set(false);
    this.showRejectionDialog.set(false);
    this.isProcessing.set(false);
    this.processingLabel.set(null);
  }

  protected openApprovalDialog(): void {
    this.approvalRemarks.set('');
    this.actionError.set(null);
    this.showApprovalDialog.set(true);
  }

  protected cancelApproval(): void {
    this.showApprovalDialog.set(false);
    this.approvalRemarks.set('');
  }

  protected async approveRequest(): Promise<void> {
    const request = this.activeRequest();
    if (!request) return;

    this.isProcessing.set(true);
    this.processingLabel.set('approving');
    this.actionError.set(null);

    try {
      const approved = await this.docService.approveApproverDocumentRequest(
        request.id,
        this.approvalRemarks(),
      );
      this.mergeReviewedRequest(approved);
      this.closeDetail();
    } catch (err) {
      this.actionError.set(
        (err as ApiError).message ?? 'Unable to approve request.',
      );
    } finally {
      this.isProcessing.set(false);
      this.processingLabel.set(null);
    }
  }

  protected openRejectionDialog(): void {
    this.rejectionRemarks.set('');
    this.actionError.set(null);
    this.showRejectionDialog.set(true);
  }

  protected cancelRejection(): void {
    this.showRejectionDialog.set(false);
    this.rejectionRemarks.set('');
  }

  protected async rejectRequest(): Promise<void> {
    if (!this.canSubmitRejection()) return;

    const request = this.activeRequest();
    if (!request) return;

    this.isProcessing.set(true);
    this.processingLabel.set('rejecting');
    this.actionError.set(null);

    try {
      const rejected = await this.docService.rejectApproverDocumentRequest(
        request.id,
        this.rejectionRemarks(),
      );
      this.mergeReviewedRequest(rejected);
      this.closeDetail();
    } catch (err) {
      this.actionError.set(
        (err as ApiError).message ?? 'Unable to reject request.',
      );
    } finally {
      this.isProcessing.set(false);
      this.processingLabel.set(null);
    }
  }

  protected async downloadAttachment(
    request: ApproverDocumentRequestDetail,
  ): Promise<void> {
    this.isProcessing.set(true);
    this.processingLabel.set('downloading');
    this.actionError.set(null);

    try {
      const { blob, fileName } =
        await this.docService.downloadDocumentRequestAttachment(request.id);
      triggerDownload(blob, fileName);
    } catch (err) {
      this.actionError.set(
        (err as ApiError).message ?? 'Unable to download attachment.',
      );
    } finally {
      this.isProcessing.set(false);
      this.processingLabel.set(null);
    }
  }

  // --- Internal ---

  private readonly reviewedDetailCache = new Map<
    number,
    ApproverDocumentRequestDetail
  >();

  private async loadRequests(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.docService.getApproverDocumentRequests();
      const cached = this.getCachedReviewedListItems();
      const merged = [...data];
      for (const cachedItem of cached) {
        if (!merged.some((r) => r.id === cachedItem.id)) {
          merged.push(cachedItem);
        }
      }
      this.requests.set(merged);
    } catch (err) {
      this.error.set(
        (err as ApiError).message ?? 'Unable to load approver requests.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadDetail(requestId: number): Promise<void> {
    this.isLoadingDetail.set(true);
    this.detailError.set(null);

    try {
      const cached = this.reviewedDetailCache.get(requestId);
      const [detail, activities] = await Promise.all([
        cached ?? this.docService.getApproverDocumentRequest(requestId),
        this.docService.getDocumentRequestActivities(requestId),
      ]);
      this.activeRequest.set(detail);
      this.activeActivities.set(activities);
    } catch (err) {
      this.detailError.set(
        (err as ApiError).message ?? 'Unable to load request details.',
      );
    } finally {
      this.isLoadingDetail.set(false);
    }
  }

  private mergeReviewedRequest(detail: ApproverDocumentRequestDetail): void {
    if (
      detail.statusName === 'Approved' ||
      detail.statusName === 'Rejected'
    ) {
      this.reviewedDetailCache.set(detail.id, detail);
    }
    const listItem = this.toListItem(detail);
    this.requests.update((current) => {
      if (current.some((r) => r.id === detail.id)) {
        return current.map((r) => (r.id === detail.id ? listItem : r));
      }
      return [listItem, ...current];
    });
    if (this.activeRequest()?.id === detail.id) {
      this.activeRequest.set(detail);
    }
  }

  private getCachedReviewedListItems(): ApproverDocumentRequestListItem[] {
    return Array.from(this.reviewedDetailCache.values()).map((d) =>
      this.toListItem(d),
    );
  }

  private toListItem(
    detail: ApproverDocumentRequestDetail,
  ): ApproverDocumentRequestListItem {
    return {
      id: detail.id,
      requestNumber: detail.requestNumber,
      title: detail.title,
      requesterName: detail.requesterName,
      requesterEmail: detail.requesterEmail,
      documentTypeName: detail.documentTypeName,
      statusName: detail.statusName,
      submittedAt: detail.submittedAt,
      createdAt: detail.createdAt,
    };
  }
}

function isToday(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
