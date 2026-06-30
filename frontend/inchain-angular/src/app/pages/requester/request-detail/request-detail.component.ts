import { Component, inject, signal, computed, effect, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideSend,
  lucideXCircle,
  lucideTrash2,
  lucideArrowDownToLine,
  lucidePencil,
  lucideDownload,
  lucideAlertTriangle,
} from '@ng-icons/lucide';
import { StatusBadgeComponent } from '@/shared/components/status-badge.component';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  DocumentRequestsService,
  type RequesterDocumentRequestDetail,
  type DocumentRequestActivity,
} from '@/features/document-requests/document-requests.service';
import type { ApiError } from '@/shared/models/api-error.types';

@Component({
  selector: 'app-request-detail',
  imports: [
    RouterLink,
    NgIcon,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideSend,
      lucideXCircle,
      lucideTrash2,
      lucideArrowDownToLine,
      lucidePencil,
      lucideDownload,
      lucideAlertTriangle,
    }),
  ],
  templateUrl: './request-detail.component.html',
})
export class RequestDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentRequestsService = inject(DocumentRequestsService);

  readonly request = signal<RequesterDocumentRequestDetail | null>(null);
  readonly activities = signal<DocumentRequestActivity[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly processingAction = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly showCancelConfirm = signal(false);

  readonly isDraft = computed(() => this.request()?.statusName === 'Draft');
  readonly isPendingApproval = computed(
    () => this.request()?.statusName === 'PendingApproval',
  );
  readonly canEdit = this.isDraft;
  readonly canSubmit = this.isDraft;
  readonly canCancel = this.isPendingApproval;
  readonly canDelete = this.isDraft;
  readonly hasAttachment = computed(
    () => this.request()?.attachment != null,
  );

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || Number.isNaN(Number(idParam))) {
      this.error.set('Invalid request ID.');
      this.isLoading.set(false);
      return;
    }

    this.loadRequest(Number(idParam));
  }

  protected async submitRequest(): Promise<void> {
    const req = this.request();
    if (!req) return;

    this.processingAction.set('submit');
    this.actionError.set(null);
    try {
      const updated =
        await this.documentRequestsService.submitRequesterDocumentRequest(
          req.id,
        );
      this.request.set(updated);
    } catch (err) {
      const apiError = err as ApiError;
      this.actionError.set(
        apiError.message ?? 'Unable to submit request.',
      );
    } finally {
      this.processingAction.set(null);
    }
  }

  protected async cancelRequest(): Promise<void> {
    const req = this.request();
    if (!req) return;

    this.showCancelConfirm.set(false);
    this.processingAction.set('cancel');
    this.actionError.set(null);
    try {
      const updated =
        await this.documentRequestsService.cancelRequesterDocumentRequest(
          req.id,
        );
      this.request.set(updated);
    } catch (err) {
      const apiError = err as ApiError;
      this.actionError.set(
        apiError.message ?? 'Unable to cancel request.',
      );
    } finally {
      this.processingAction.set(null);
    }
  }

  protected async deleteRequest(): Promise<void> {
    const req = this.request();
    if (!req) return;

    this.showDeleteConfirm.set(false);
    this.processingAction.set('delete');
    this.actionError.set(null);
    try {
      await this.documentRequestsService.deleteRequesterDocumentRequest(
        req.id,
      );
      void this.router.navigate(['/requests']);
    } catch (err) {
      const apiError = err as ApiError;
      this.actionError.set(
        apiError.message ?? 'Unable to delete draft.',
      );
    } finally {
      this.processingAction.set(null);
    }
  }

  protected async downloadAttachment(): Promise<void> {
    const req = this.request();
    if (!req) return;

    this.processingAction.set('download');
    this.actionError.set(null);
    try {
      const { blob, fileName } =
        await this.documentRequestsService.downloadDocumentRequestAttachment(
          req.id,
        );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      const apiError = err as ApiError;
      this.actionError.set(
        apiError.message ?? 'Unable to download attachment.',
      );
    } finally {
      this.processingAction.set(null);
    }
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString(undefined, { dateStyle: 'medium' });
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

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected getAttachmentFileName(): string {
    const attachment = this.request()?.attachment;
    if (!attachment) return 'Attachment';
    return (
      attachment.originalFileName ?? attachment.fileName ?? 'Attachment'
    );
  }

  protected getActionLabel(actionType: string): string {
    return (
      actionType
        .replaceAll(/[_-]+/g, ' ')
        .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
        .trim() || 'Activity recorded'
    );
  }

  private async loadRequest(id: number): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [detail, acts] = await Promise.all([
        this.documentRequestsService.getRequesterDocumentRequest(id),
        this.documentRequestsService.getDocumentRequestActivities(id),
      ]);
      this.request.set(detail);
      this.activities.set(acts);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(
        apiError.message ?? 'Unable to load request details.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
