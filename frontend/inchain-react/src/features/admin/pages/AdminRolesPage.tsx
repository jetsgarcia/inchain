import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminUserRoles,
  getAdminUsers,
  updateAdminUserRole,
  type AdminUser,
  type AdminUserRole,
} from "@/features/admin/adminUsersApi";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "disabled";

const ROLE_ASSIGNMENTS_PAGE_SIZE = 5;

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

function getUserRoles(user: AdminUser) {
  return user.role ? [String(user.role)] : [];
}

function isAdminUserRole(role: string): role is AdminUserRole {
  return (adminUserRoles as readonly string[]).includes(role);
}

function getEditableRole(user: AdminUser): AdminUserRole {
  const role = String(user.role ?? "");
  return isAdminUserRole(role) ? role : "Requester";
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

function RolePill({ role }: { role: string }) {
  return (
    <StatusPill className="border-primary/20 bg-primary/10 text-primary">
      {role}
    </StatusPill>
  );
}

function RoleAssignmentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          className="grid gap-3 rounded-2xl border border-border px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1.1fr)_8rem_minmax(10rem,0.8fr)_auto]"
          key={index}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
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

function EditRolesSheet({
  onOpenChange,
  onRoleUpdated,
  user,
}: {
  onOpenChange: (open: boolean) => void;
  onRoleUpdated: (userId: string, role: AdminUserRole) => void;
  user: AdminUser;
}) {
  const [selectedRole, setSelectedRole] = useState<AdminUserRole>(() =>
    getEditableRole(user),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await updateAdminUserRole(user.id, selectedRole);
      onRoleUpdated(user.id, selectedRole);
      onOpenChange(false);
      toast.success(
        `${getUserDisplayName(user)} was assigned the ${selectedRole} role.`,
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Unable to update user role."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasRoleChanged = String(user.role) !== selectedRole;

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md"
        showCloseButton={!isSubmitting}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Edit roles</SheetTitle>
            <SheetDescription>
              Update the app role assigned to this user.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to update role</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {formError}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-3">
              <Avatar>
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {getUserDisplayName(user)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email ?? "No email"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-user-role">Assigned role</Label>
              <select
                className={cn(
                  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
                )}
                disabled={isSubmitting}
                id="edit-user-role"
                onChange={(event) => {
                  setSelectedRole(event.target.value as AdminUserRole);
                  setFormError(null);
                }}
                value={selectedRole}
              >
                {adminUserRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SheetFooter className="border-t">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting || !hasRoleChanged} type="submit">
              {isSubmitting ? "Saving..." : "Save role"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
function AdminRolesPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

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

        setUsersError(getApiErrorMessage(error, "Unable to load users."));
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
      Array.from(
        new Set([
          ...adminUserRoles,
          ...users.map((user) => user.role).filter(Boolean).map(String),
        ]),
      ).toSorted((firstRole, secondRole) =>
        firstRole.localeCompare(secondRole),
      ),
    [users],
  );

  const roleCounts = useMemo(
    () =>
      roleOptions.map((role) => ({
        role,
        count: users.filter((user) => user.role === role).length,
      })),
    [roleOptions, users],
  );

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return users.filter((user) => {
      const userRoles = getUserRoles(user);
      const matchesSearch =
        query.length === 0 ||
        [getUserDisplayName(user), user.email, ...userRoles].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.isDisabled) ||
        (statusFilter === "disabled" && user.isDisabled);
      const matchesRole = roleFilter === "all" || userRoles.includes(roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [roleFilter, searchQuery, statusFilter, users]);

  const sortedUsers = useMemo(
    () =>
      filteredUsers.toSorted((firstUser, secondUser) =>
        getUserDisplayName(firstUser).localeCompare(
          getUserDisplayName(secondUser),
        ),
      ),
    [filteredUsers],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedUsers.length / ROLE_ASSIGNMENTS_PAGE_SIZE),
  );
  const currentUsersPage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const pageStart = (currentUsersPage - 1) * ROLE_ASSIGNMENTS_PAGE_SIZE;
    return sortedUsers.slice(pageStart, pageStart + ROLE_ASSIGNMENTS_PAGE_SIZE);
  }, [currentUsersPage, sortedUsers]);
  const visibleUserStart =
    sortedUsers.length === 0
      ? 0
      : (currentUsersPage - 1) * ROLE_ASSIGNMENTS_PAGE_SIZE + 1;
  const visibleUserEnd = Math.min(
    currentUsersPage * ROLE_ASSIGNMENTS_PAGE_SIZE,
    sortedUsers.length,
  );

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(value: string) {
    setRoleFilter(value);
    setCurrentPage(1);
  }

  function handleRoleUpdated(userId: string, role: AdminUserRole) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, role } : user,
      ),
    );
    setEditingUser((currentUser) =>
      currentUser?.id === userId ? { ...currentUser, role } : currentUser,
    );
  }

  function goToUsersPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  return (
    <section className="space-y-5">
      {usersError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load users</AlertTitle>
          <AlertDescription>{usersError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Users with roles</CardTitle>
          <CardDescription>
            Search, filter, and review current role assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className="sr-only">Search users by role assignment</span>
              <Input
                onChange={(event) =>
                  handleSearchQueryChange(event.target.value)
                }
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
                    onClick={() => handleStatusFilterChange(filter.value)}
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

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleRoleFilterChange("all")}
              type="button"
              variant={roleFilter === "all" ? "secondary" : "ghost"}
            >
              All roles
            </Button>
            {roleCounts.map(({ role, count }) => (
              <Button
                key={role}
                onClick={() => handleRoleFilterChange(role)}
                type="button"
                variant={roleFilter === role ? "secondary" : "ghost"}
              >
                <span>{role}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs leading-none text-muted-foreground">
                  {count}
                </span>
              </Button>
            ))}
          </div>

          {isLoadingUsers ? (
            <RoleAssignmentSkeleton />
          ) : sortedUsers.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1.1fr)_8rem_minmax(10rem,0.8fr)_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
                  <span>User</span>
                  <span>Status</span>
                  <span>Assigned roles</span>
                  <span className="text-right">Action</span>
                </div>
                <ul className="divide-y divide-border">
                  {paginatedUsers.map((user) => {
                    const roles = getUserRoles(user);

                    return (
                      <li
                        className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(0,1.1fr)_8rem_minmax(10rem,0.8fr)_auto]"
                        key={user.id}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getUserInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {getUserDisplayName(user)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email ?? "No email"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <StatusPill
                            className={
                              user.isDisabled
                                ? "border-destructive/25 bg-destructive/10 text-destructive"
                                : "border-primary/20 bg-primary/10 text-primary"
                            }
                          >
                            {user.isDisabled ? "Disabled" : "Active"}
                          </StatusPill>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {roles.length > 0 ? (
                            roles.map((role) => (
                              <RolePill key={role} role={role} />
                            ))
                          ) : (
                            <StatusPill className="bg-muted text-muted-foreground">
                              Unassigned
                            </StatusPill>
                          )}
                        </div>

                        <div className="sm:justify-self-end">
                          <Button
                            onClick={() => setEditingUser(user)}
                            type="button"
                            variant="outline"
                          >
                            Edit roles
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {visibleUserStart}-{visibleUserEnd} of{" "}
                    {sortedUsers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={currentUsersPage === 1}
                      onClick={() => goToUsersPage(currentUsersPage - 1)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center">
                      Page {currentUsersPage} of {totalPages}
                    </span>
                    <Button
                      disabled={currentUsersPage === totalPages}
                      onClick={() => goToUsersPage(currentUsersPage + 1)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              description={
                users.length === 0
                  ? "Users created by an admin will appear here with their assigned roles."
                  : "Try a different search term, status, or role filter."
              }
              title={users.length === 0 ? "No users found" : "No matches"}
            />
          )}
        </CardContent>
      </Card>

      {editingUser ? (
        <EditRolesSheet
          key={editingUser.id}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null);
            }
          }}
          onRoleUpdated={handleRoleUpdated}
          user={editingUser}
        />
      ) : null}
    </section>
  );
}

export default AdminRolesPage;
