import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucideFileText,
  lucideRoute,
  lucideActivity,
  lucideCheckCircle2,
  lucideAlertCircle,
  lucideArrowRight,
  lucideClipboardPlus,
  lucideClipboardList,
  lucideClipboardClock,
  lucideClipboardCheck,
  lucideHistory,
} from '@ng-icons/lucide';
import { AuthService } from '@/features/auth/auth.service';
import {
  DashboardService,
  type DashboardData,
  type RequesterRequestItem,
  type ApproverRequestItem,
  type AdminActivityLog,
} from './dashboard.service';
import { paths } from '@/app.paths';

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
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

function formatActionLabel(actionType: string): string {
  return (
    actionType
      .replaceAll(/[_-]+/g, ' ')
      .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
      .trim() || 'Activity recorded'
  );
}

function statusPillClass(status: string): string {
  switch (status) {
    case 'Approved':
      return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    case 'Rejected':
      return 'border-destructive/25 bg-destructive/10 text-destructive';
    case 'PendingApproval':
      return 'border-primary/20 bg-primary/10 text-primary';
    case 'Draft':
      return 'border-muted-foreground/20 bg-muted text-muted-foreground';
    default:
      return 'border-muted-foreground/20 bg-muted text-muted-foreground';
  }
}

function statusLabel(status: string): string {
  return status === 'PendingApproval' ? 'Pending approval' : status;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, NgIcon],
  providers: [
    provideIcons({
      lucideUsers,
      lucideFileText,
      lucideRoute,
      lucideActivity,
      lucideCheckCircle2,
      lucideAlertCircle,
      lucideArrowRight,
      lucideClipboardPlus,
      lucideClipboardList,
      lucideClipboardClock,
      lucideClipboardCheck,
      lucideHistory,
    }),
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  protected readonly authService = inject(AuthService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly formatDate = formatDate;
  protected readonly formatDateTime = formatDateTime;
  protected readonly isToday = isToday;
  protected readonly formatActionLabel = formatActionLabel;
  protected readonly statusPillClass = statusPillClass;
  protected readonly statusLabel = statusLabel;
  protected readonly paths = paths;

  get isAdmin(): boolean {
    return this.authService.roles().includes('Admin');
  }

  get isRequester(): boolean {
    return this.authService.roles().includes('Requester');
  }

  get isApprover(): boolean {
    return this.authService.roles().includes('Approver');
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.dashboardService.loadDashboard().subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to load dashboard.');
        this.loading.set(false);
      },
    });
  }
}
