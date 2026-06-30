import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  template: `
    <div class="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
      <p class="text-sm font-medium">{{ title() }}</p>
      <p class="mt-1 text-sm text-muted-foreground">{{ description() }}</p>
      @if (hasAction()) {
        <div class="mt-4">
          <ng-content select="[slot=action]" />
        </div>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly hasAction = input(false);
}
