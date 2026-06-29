import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideUsers,
  lucideShieldUser,
  lucideFileText,
  lucideRoute,
  lucideHistory,
  lucideClipboardList,
  lucideClipboardClock,
  lucideClipboardCheck,
  lucideLogOut,
  lucideUser,
  lucideChevronLeft,
} from '@ng-icons/lucide';
import type { NavigationItem } from '@/layouts/navigation.config';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, NgIcon],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideUsers,
      lucideShieldUser,
      lucideFileText,
      lucideRoute,
      lucideHistory,
      lucideClipboardList,
      lucideClipboardClock,
      lucideClipboardCheck,
      lucideLogOut,
      lucideUser,
      lucideChevronLeft,
    }),
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly navigationItems = input.required<NavigationItem[]>();
  readonly activePath = input.required<string>();
  readonly userName = input('User');
  readonly collapsed = input(false);

  readonly logOut = output<void>();
  readonly toggleCollapse = output<void>();

  iconName(icon: string): string {
    return `lucide${icon}`;
  }

  isActive(item: NavigationItem): boolean {
    const path = this.activePath();
    return path === item.to || path.startsWith(item.to + '/');
  }
}
