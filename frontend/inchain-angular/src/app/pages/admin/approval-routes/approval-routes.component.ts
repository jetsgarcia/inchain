import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
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
import type { ApiError } from '@/shared/models/api-error.types';

@Component({
  selector: 'app-admin-approval-routes',
  imports: [FormsModule, NgIcon, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucidePencil,
      lucideAlertTriangle,
      lucideX,
      lucideRoute,
    }),
  ],
  templateUrl: './approval-routes.component.html',
})
export class AdminApprovalRoutesComponent {
  private readonly service = inject(AdminApprovalRoutesService);

  readonly routes = signal<AdminApprovalRoute[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);

  // Edit state
  readonly editingRoute = signal<AdminApprovalRoute | null>(null);
  readonly approvers = signal<AdminApprover[]>([]);
  readonly selectedApproverId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);

  constructor() {
    this.loadRoutes();
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

  protected async openEdit(route: AdminApprovalRoute): Promise<void> {
    this.editingRoute.set(route);
    this.selectedApproverId.set(route.approverId);
    this.saveError.set(null);
    this.isSaving.set(false);

    try {
      const approvers = await this.service.getApprovers();
      this.approvers.set(approvers);
    } catch {
      this.approvers.set([]);
    }
  }

  protected closeEdit(): void {
    if (this.isSaving()) return;
    this.editingRoute.set(null);
  }

  protected async saveApprover(): Promise<void> {
    const route = this.editingRoute();
    const approverId = this.selectedApproverId();
    if (!route || !approverId) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.service.assignDocumentTypeApprover(
        route.documentTypeId,
        approverId,
      );

      const selectedApprover = this.approvers().find(
        (a) => a.id === approverId,
      );

      this.routes.update((current) =>
        current.map((r) =>
          r.id === route.id
            ? {
                ...r,
                approverId: approverId,
                approverFullName: selectedApprover?.fullName ?? r.approverFullName,
                approverEmail: selectedApprover?.email ?? r.approverEmail,
              }
            : r,
        ),
      );

      this.editingRoute.set(null);
    } catch (err) {
      const apiError = err as ApiError;
      this.saveError.set(
        apiError.message ?? 'Unable to assign approver.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async disableRoute(route: AdminApprovalRoute): Promise<void> {
    this.error.set(null);
    try {
      await this.service.disableApprovalRoute(route.id);
      this.routes.update((current) =>
        current.map((r) =>
          r.id === route.id ? { ...r, isActive: false } : r,
        ),
      );
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(
        apiError.message ?? 'Unable to disable route.',
      );
    }
  }

  private async loadRoutes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.getApprovalRoutes();
      this.routes.set(data);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load approval routes.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
