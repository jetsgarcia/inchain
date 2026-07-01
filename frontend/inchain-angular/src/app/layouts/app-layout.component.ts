import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@/features/auth/auth.service';
import { SidebarComponent } from '@/layouts/sidebar.component';
import { getNavigationItems } from '@/layouts/navigation.config';

@Component({
  selector: 'app-layout',
  imports: [RouterModule, SidebarComponent],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sidebarCollapsed = signal(false);
  protected readonly showLogoutConfirm = signal(false);
  protected readonly navigationItems = getNavigationItems(this.authService.roles());
  protected readonly userName = this.authService.currentUser()?.fullName || 'User';
  protected readonly currentPath = signal(this.router.url);

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.currentPath.set(this.router.url);
    });
  }

  protected promptLogout(): void {
    this.showLogoutConfirm.set(true);
  }

  protected cancelLogout(): void {
    this.showLogoutConfirm.set(false);
  }

  protected confirmLogout(): void {
    this.authService.logout();
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
