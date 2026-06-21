import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAdminUser,
  getAdminUsers,
  type AdminUser,
} from "@/features/admin/adminUsersApi";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "disabled";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Disabled", value: "disabled" },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function getUserDisplayName(user: AdminUser) {
  return user.fullName.trim() || user.email || "Unnamed user";
}

function getUserInitials(user: AdminUser) {
  const label = getUserDisplayName(user);
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

function StatusPill({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function PlannedActionButton({
  children,
  tooltip,
  variant = "outline",
}: {
  children: ReactNode;
  tooltip: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          <Button disabled type="button" variant={variant}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function UserListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="flex items-center gap-3" key={index}>
          <Skeleton className="size-9 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

function UserDetailsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="grid grid-cols-[7rem_1fr] gap-3" key={index}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] =
    useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingSelectedUser, setIsLoadingSelectedUser] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserError, setSelectedUserError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setIsLoadingUsers(true);
      setUsersError(null);

      try {
        const adminUsers = await getAdminUsers(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setUsers(adminUsers);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setUsersError(
          getApiErrorMessage(error, "Unable to load admin users."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      controller.abort();
    };
  }, []);

  const currentSelectedUserId = useMemo(() => {
    if (selectedUserId && users.some((user) => user.id === selectedUserId)) {
      return selectedUserId;
    }

    return users[0]?.id ?? null;
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!currentSelectedUserId) {
      return;
    }

    const controller = new AbortController();
    const userId = currentSelectedUserId;

    async function loadSelectedUser() {
      setIsLoadingSelectedUser(true);
      setSelectedUserDetails(null);
      setSelectedUserError(null);

      try {
        const adminUser = await getAdminUser(userId, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setSelectedUserDetails(adminUser);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setSelectedUserError(
          getApiErrorMessage(error, "Unable to load the selected user."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSelectedUser(false);
        }
      }
    }

    void loadSelectedUser();

    return () => {
      controller.abort();
    };
  }, [currentSelectedUserId]);

  const userStats = useMemo(
    () =>
      users.reduce(
        (stats, user) => {
          if (user.isDisabled) {
            stats.disabled += 1;
          } else {
            stats.active += 1;
          }

          return stats;
        },
        { active: 0, disabled: 0 },
      ),
    [users],
  );

  const statusFilterCounts = useMemo(
    () => ({
      all: users.length,
      active: userStats.active,
      disabled: userStats.disabled,
    }),
    [userStats.active, userStats.disabled, users.length],
  );

  const roleOptions = useMemo(
    () =>
      Array.from(new Set(users.map((user) => user.role).filter(Boolean)))
        .map(String)
        .toSorted((first, second) => first.localeCompare(second)),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        query.length === 0 ||
        [user.fullName, user.email, user.role].some((value) =>
          String(value ?? "").toLowerCase().includes(query),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.isDisabled) ||
        (statusFilter === "disabled" && user.isDisabled);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [roleFilter, searchQuery, statusFilter, users]);

  const selectedListUser = useMemo(
    () => users.find((user) => user.id === currentSelectedUserId) ?? null,
    [currentSelectedUserId, users],
  );
  const selectedUser =
    selectedUserDetails?.id === currentSelectedUserId
      ? selectedUserDetails
      : selectedListUser;

  return (
    <TooltipProvider>
      <section className="space-y-5">
        <div className="flex justify-end">
          <PlannedActionButton tooltip="User creation is planned, but the POST /api/admin/users flow is not implemented in this screen yet.">
            Create user
          </PlannedActionButton>
        </div>

        {usersError ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load users</AlertTitle>
            <AlertDescription>{usersError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader>
              <CardTitle>All users</CardTitle>
              <CardDescription>
                Search, filter, and select a user to view their details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <label className="min-w-0">
                  <span className="sr-only">Search users</span>
                  <Input
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, email, or role"
                    value={searchQuery}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((filter) => {
                    const isSelected = statusFilter === filter.value;

                    return (
                      <Button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                      >
                        <span>{filter.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-xs leading-none",
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {statusFilterCounts[filter.value]}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {roleOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setRoleFilter("all")}
                    type="button"
                    variant={roleFilter === "all" ? "secondary" : "ghost"}
                  >
                    All roles
                  </Button>
                  {roleOptions.map((role) => (
                    <Button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      type="button"
                      variant={roleFilter === role ? "secondary" : "ghost"}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              ) : null}

              {isLoadingUsers ? (
                <UserListSkeleton />
              ) : filteredUsers.length > 0 ? (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  {filteredUsers.map((user) => {
                    const isSelected = user.id === currentSelectedUserId;
                    const displayName = getUserDisplayName(user);

                    return (
                      <li key={user.id}>
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                            isSelected && "bg-muted",
                          )}
                          onClick={() => setSelectedUserId(user.id)}
                          type="button"
                        >
                          <Avatar>
                            <AvatarFallback>
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {displayName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {user.email ?? "No email"}
                            </span>
                          </span>
                          <span className="hidden shrink-0 items-center gap-2 sm:flex">
                            <StatusPill>{user.role}</StatusPill>
                            <StatusPill
                              className={
                                user.isDisabled
                                  ? "border-destructive/25 bg-destructive/10 text-destructive"
                                  : "border-primary/20 bg-primary/10 text-primary"
                              }
                            >
                              {user.isDisabled ? "Disabled" : "Active"}
                            </StatusPill>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  description="Try a different search term, status, or role filter."
                  title={users.length === 0 ? "No users found" : "No matches"}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User details</CardTitle>
              <CardDescription>
                Individual user data from GET /api/admin/users/:userId.
              </CardDescription>
              <CardAction>
                <PlannedActionButton
                  tooltip="The PUT /api/admin/users/{userId}/disabled action is intentionally not wired yet."
                  variant="destructive"
                >
                  {selectedUser?.isDisabled ? "Enable user" : "Disable user"}
                </PlannedActionButton>
              </CardAction>
            </CardHeader>
            <CardContent>
              {selectedUserError ? (
                <Alert className="mb-4" variant="destructive">
                  <AlertTitle>Unable to load user</AlertTitle>
                  <AlertDescription>{selectedUserError}</AlertDescription>
                </Alert>
              ) : null}

              {isLoadingSelectedUser && !selectedUser ? (
                <UserDetailsSkeleton />
              ) : selectedUser ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback>
                        {getUserInitials(selectedUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium">
                        {getUserDisplayName(selectedUser)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {selectedUser.email ?? "No email"}
                      </p>
                    </div>
                  </div>

                  <dl>
                    <DetailRow
                      label="Status"
                      value={
                        <StatusPill
                          className={
                            selectedUser.isDisabled
                              ? "border-destructive/25 bg-destructive/10 text-destructive"
                              : "border-primary/20 bg-primary/10 text-primary"
                          }
                        >
                          {selectedUser.isDisabled ? "Disabled" : "Active"}
                        </StatusPill>
                      }
                    />
                    <DetailRow label="Role" value={selectedUser.role} />
                    <DetailRow
                      label="Full name"
                      value={selectedUser.fullName || "Not provided"}
                    />
                    <DetailRow
                      label="Email"
                      value={selectedUser.email ?? "Not provided"}
                    />
                    <DetailRow
                      label="User ID"
                      value={
                        <span className="break-all font-mono text-xs">
                          {selectedUser.id}
                        </span>
                      }
                    />
                  </dl>

                  {isLoadingSelectedUser ? (
                    <p className="text-xs text-muted-foreground">
                      Refreshing selected user details...
                    </p>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  description="Select a user from the list to inspect their profile."
                  title="No user selected"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </TooltipProvider>
  );
}

export default AdminUsersPage;
