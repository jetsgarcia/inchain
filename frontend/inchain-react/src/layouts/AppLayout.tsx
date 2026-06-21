import { NavLink, Outlet, useLocation } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/auth/useAuth";
import { getNavigationItems, type NavigationItem } from "@/layouts/navigation";

function getUserInitials(nameOrEmail?: string | null) {
  if (!nameOrEmail) {
    return "IC";
  }

  const nameParts = nameOrEmail.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
  }

  return nameOrEmail.slice(0, 2).toUpperCase();
}

function isNavigationItemActive(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function getCurrentNavigationItem(pathname: string, items: NavigationItem[]) {
  return items
    .toSorted((first, second) => second.to.length - first.to.length)
    .find((item) => isNavigationItemActive(pathname, item.to));
}

function AppSidebar({
  navigationItems,
  pathname,
  roles,
  userLabel,
}: {
  navigationItems: NavigationItem[];
  pathname: string;
  roles: string[];
  userLabel: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const roleLabel = roles.join(", ") || "No role assigned";

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-default" size="lg">
              <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                IC
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Inchain</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Approval workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.length > 0 ? (
                navigationItems.map((item) => {
                  const isActive = isNavigationItemActive(pathname, item.to);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <NavLink
                          to={item.to}
                          onClick={() => {
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                        >
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              ) : (
                <li className="px-3 py-2 text-sm text-sidebar-foreground/70">
                  No navigation available
                </li>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-default" size="lg">
              <Avatar className="size-8 rounded-xl">
                <AvatarFallback className="rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
                  {getUserInitials(userLabel)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userLabel}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {roleLabel}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function UserMenu({
  onLogout,
  roles,
  userLabel,
}: {
  onLogout: () => void;
  roles: string[];
  userLabel: string;
}) {
  const roleLabel = roles.join(", ") || "No role assigned";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-auto gap-2 px-2 py-1.5"
          type="button"
          variant="ghost"
        >
          <Avatar className="size-8">
            <AvatarFallback>{getUserInitials(userLabel)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 text-left sm:grid">
            <span className="truncate text-sm font-medium">{userLabel}</span>
            <span className="truncate text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-medium">
            {userLabel}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {roleLabel}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} variant="destructive">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  const { logout, roles, user } = useAuth();
  const location = useLocation();
  const navigationItems = getNavigationItems(roles);
  const currentNavigationItem = getCurrentNavigationItem(
    location.pathname,
    navigationItems,
  );
  const userLabel = user?.fullName ?? user?.email ?? "User";

  return (
    <SidebarProvider>
      <AppSidebar
        navigationItems={navigationItems}
        pathname={location.pathname}
        roles={roles}
        userLabel={userLabel}
      />
      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          <Separator className="h-4" orientation="vertical" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {currentNavigationItem?.label ?? "Workspace"}
            </p>
            <p className="truncate text-xs text-muted-foreground">Inchain</p>
          </div>
          <UserMenu
            onLogout={() => void logout()}
            roles={roles}
            userLabel={userLabel}
          />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppLayout;
