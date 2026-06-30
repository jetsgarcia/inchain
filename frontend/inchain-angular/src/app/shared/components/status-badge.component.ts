import { Component, input, computed } from '@angular/core';

type StatusColor =
  | 'default'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

const STATUS_COLOR_MAP: Record<string, StatusColor> = {
  approved: 'success',
  rejected: 'danger',
  pendingapproval: 'primary',
  draft: 'default',
  cancelled: 'default',
  active: 'success',
  disabled: 'danger',
  admin: 'primary',
  approver: 'info',
  requester: 'warning',
};

const COLOR_CLASSES: Record<StatusColor, string> = {
  default: 'border-muted-foreground/20 bg-muted text-muted-foreground',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  danger: 'border-destructive/25 bg-destructive/10 text-destructive',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  info: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
};

@Component({
  selector: 'app-status-badge',
  imports: [],
  template: `
    <span
      class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
      [class]="colorClasses() + ' ' + (customClass() || '')"
    >
      {{ displayLabel() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly customClass = input<string>();

  protected readonly displayLabel = computed(() => {
    const status = this.status();
    if (status === 'PendingApproval') return 'Pending approval';
    return status;
  });

  protected readonly colorClasses = computed(() => {
    const key = this.status().toLowerCase().replace(/\s+/g, '');
    const color = STATUS_COLOR_MAP[key] ?? 'default';
    return COLOR_CLASSES[color];
  });
}
