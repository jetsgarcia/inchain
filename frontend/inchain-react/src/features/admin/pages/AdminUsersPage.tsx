import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  adminUserRoles,
  createAdminUser,
  getAdminUser,
  getAdminUsers,
  type AdminUser,
  type AdminUserRole,
} from "@/features/admin/adminUsersApi";
import { isApiError, type ApiValidationErrors } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "disabled";

type CreateUserFormState = {
  fullName: string;
  email: string;
  password: string;
  role: AdminUserRole;
};

const initialCreateUserForm: CreateUserFormState = {
  fullName: "",
  email: "",
  password: "",
  role: "Requester",
};

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

function normalizeFieldName(field: string) {
  return field.toLowerCase().replaceAll(".", "");
}

function getFieldErrors(
  validationErrors: ApiValidationErrors,
  fieldName: keyof CreateUserFormState,
) {
  const normalizedFieldName = normalizeFieldName(fieldName);

  return Object.entries(validationErrors).flatMap(([field, messages]) => {
    const normalizedField = normalizeFieldName(field);
    return normalizedField.endsWith(normalizedFieldName) ? messages : [];
  });
}

function validateCreateUserForm(
  form: CreateUserFormState,
): ApiValidationErrors {
  const errors: ApiValidationErrors = {};

  if (!form.fullName.trim()) {
    errors.fullName = ["Full name is required."];
  }

  if (!form.email.trim()) {
    errors.email = ["Email is required."];
  }

  if (!form.password) {
    errors.password = ["Password is required."];
  }

  if (!form.role) {
    errors.role = ["Role is required."];
  }

  return errors;
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

function FieldErrors({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 text-xs text-destructive">
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
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

function CreateUserSheet({
  onUserCreated,
}: {
  onUserCreated: (user: AdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ApiValidationErrors>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fullNameErrors = getFieldErrors(validationErrors, "fullName");
  const emailErrors = getFieldErrors(validationErrors, "email");
  const passwordErrors = getFieldErrors(validationErrors, "password");
  const roleErrors = getFieldErrors(validationErrors, "role");

  function resetForm() {
    setFormResetKey((currentKey) => currentKey + 1);
    setFormError(null);
    setValidationErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen && !isSubmitting) {
      resetForm();
    }
  }

  function clearFieldError(fieldName: keyof CreateUserFormState) {
    const normalizedFieldName = normalizeFieldName(fieldName);

    setValidationErrors((currentErrors) => {
      const nextErrors = Object.entries(
        currentErrors,
      ).reduce<ApiValidationErrors>((errors, [field, messages]) => {
        if (!normalizeFieldName(field).endsWith(normalizedFieldName)) {
          errors[field] = messages;
        }

        return errors;
      }, {});

      return Object.keys(nextErrors).length ===
        Object.keys(currentErrors).length
        ? currentErrors
        : nextErrors;
    });
    setFormError(null);
  }

  function readForm(formElement: HTMLFormElement): CreateUserFormState {
    const formData = new FormData(formElement);

    return {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "Requester") as AdminUserRole,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formValues = readForm(event.currentTarget);
    const nextValidationErrors = validateCreateUserForm(formValues);

    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      setFormError(null);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors({});

    try {
      const createdUser = await createAdminUser({
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
        role: formValues.role,
      });

      onUserCreated(createdUser);
      setOpen(false);
      resetForm();
    } catch (error) {
      if (isApiError(error)) {
        setValidationErrors(error.validationErrors ?? {});
      }

      setFormError(getApiErrorMessage(error, "Unable to create user."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => handleOpenChange(true)} type="button">
        Create user
      </Button>
      <SheetContent
        className="w-full sm:max-w-md"
        showCloseButton={!isSubmitting}
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          key={formResetKey}
          onSubmit={handleSubmit}
        >
          <SheetHeader>
            <SheetTitle>Create user</SheetTitle>
            <SheetDescription>
              Add an email-confirmed user and assign exactly one app role.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to create user</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {formError}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="create-user-full-name">Full name</Label>
              <Input
                aria-invalid={fullNameErrors.length > 0}
                autoComplete="name"
                defaultValue={initialCreateUserForm.fullName}
                disabled={isSubmitting}
                id="create-user-full-name"
                name="fullName"
                onInput={() => clearFieldError("fullName")}
                placeholder="Juan Dela Cruz"
              />
              <FieldErrors messages={fullNameErrors} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                aria-invalid={emailErrors.length > 0}
                autoComplete="email"
                defaultValue={initialCreateUserForm.email}
                disabled={isSubmitting}
                id="create-user-email"
                name="email"
                onInput={() => clearFieldError("email")}
                placeholder="juan@example.com"
                type="email"
              />
              <FieldErrors messages={emailErrors} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-password">Password</Label>
              <Input
                aria-invalid={passwordErrors.length > 0}
                autoComplete="new-password"
                defaultValue={initialCreateUserForm.password}
                disabled={isSubmitting}
                id="create-user-password"
                name="password"
                onInput={() => clearFieldError("password")}
                placeholder="Temporary password"
                type="password"
              />
              <FieldErrors messages={passwordErrors} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-user-role">Role</Label>
              <select
                aria-invalid={roleErrors.length > 0}
                className={cn(
                  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                )}
                defaultValue={initialCreateUserForm.role}
                disabled={isSubmitting}
                id="create-user-role"
                name="role"
                onChange={() => clearFieldError("role")}
              >
                {adminUserRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <FieldErrors messages={roleErrors} />
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
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create user"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
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

        setUsersError(getApiErrorMessage(error, "Unable to load admin users."));
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
          String(value ?? "")
            .toLowerCase()
            .includes(query),
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

  function handleUserCreated(createdUser: AdminUser) {
    setUsers((currentUsers) => {
      const existingUserIndex = currentUsers.findIndex(
        (user) => user.id === createdUser.id,
      );

      if (existingUserIndex === -1) {
        return [createdUser, ...currentUsers];
      }

      return currentUsers.map((user, index) =>
        index === existingUserIndex ? createdUser : user,
      );
    });
    setSelectedUserId(createdUser.id);
    setSelectedUserDetails(createdUser);
    setSearchQuery("");
    setStatusFilter("all");
    setRoleFilter("all");
    setUsersError(null);
  }

  return (
    <TooltipProvider>
      <section className="space-y-5">
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
              <CardAction>
                <CreateUserSheet onUserCreated={handleUserCreated} />
              </CardAction>
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
                    <div className="sr-only" role="status">
                      Refreshing selected user details
                    </div>
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
