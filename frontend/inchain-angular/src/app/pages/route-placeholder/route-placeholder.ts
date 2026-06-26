import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-route-placeholder',
  imports: [RouterLink],
  template: `
    <main class="min-h-dvh bg-background text-foreground">
      <section class="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-12">
        <p class="text-sm font-medium text-muted-foreground">{{ path }}</p>
        <h1 class="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">{{ title }}</h1>

        @if (showDashboardLink) {
          <a
            routerLink="/dashboard"
            class="mt-8 w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to dashboard
          </a>
        }
      </section>
    </main>
  `,
})
export class RoutePlaceholder {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = String(this.route.snapshot.data['title'] ?? 'Page');
  protected readonly path = String(this.route.snapshot.data['path'] ?? '');
  protected readonly showDashboardLink = this.path !== '/dashboard';
}
