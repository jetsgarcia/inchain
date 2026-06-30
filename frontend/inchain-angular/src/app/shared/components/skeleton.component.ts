import { Component, input, computed } from '@angular/core';

type SkeletonVariant = 'block' | 'text' | 'card' | 'circle';

@Component({
  selector: 'app-skeleton',
  imports: [],
  template: `
    @switch (variant()) {
      @case ('circle') {
        <div class="animate-pulse rounded-full bg-muted" [style.width]="sizePx()" [style.height]="sizePx()"></div>
      }
      @case ('text') {
        <div class="animate-pulse rounded-md bg-muted" [style.width]="width() || '100%'" style="height: 1rem"></div>
      }
      @case ('card') {
        <div class="space-y-3 rounded-2xl border border-border p-4">
          <div class="flex items-center gap-3">
            <div class="animate-pulse rounded-full bg-muted" style="width: 2rem; height: 2rem"></div>
            <div class="animate-pulse rounded-md bg-muted" style="width: 60%; height: 1rem"></div>
          </div>
          <div class="animate-pulse rounded-md bg-muted" style="width: 100%; height: 0.75rem"></div>
          <div class="animate-pulse rounded-md bg-muted" style="width: 80%; height: 0.75rem"></div>
        </div>
      }
      @default {
        <div
          class="animate-pulse rounded-2xl bg-muted"
          [style.width]="width() || '100%'"
          [style.height]="height() || '4rem'"
        ></div>
      }
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('block');
  readonly width = input<string>();
  readonly height = input<string>();

  protected readonly sizePx = computed(() => {
    const w = this.width();
    if (w) return w;
    return '2.5rem';
  });
}
