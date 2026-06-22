import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  assignAdminDocumentTypeApprover,
  disableAdminApprovalRoute,
  getAdminApprovalRoutes,
  getAdminApprovers,
  type AdminApprovalRoute,
  type AdminApprover,
} from "@/features/admin/adminApprovalRoutesApi";
import {
  getAdminDocumentTypes,
  type AdminDocumentType,
} from "@/features/admin/adminDocumentTypesApi";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive";

type ActiveApprovalRouteForm =
  | { mode: "assign" }
  | { mode: "edit"; approvalRoute: AdminApprovalRoute };

const APPROVAL_ROUTES_PAGE_SIZE = 5;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function getApproverDisplayName(approver: AdminApprover) {
  return approver.fullName.trim() || approver.email || "Unnamed approver";
}

function getRouteApproverDisplayName(approvalRoute: AdminApprovalRoute) {
  return (
    approvalRoute.approverFullName.trim() ||
    approvalRoute.approverEmail ||
    "Unnamed approver"
  );
}

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

function formatRouteDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : dateFormatter.format(date);
}

function getRouteActivityLabel(approvalRoute: AdminApprovalRoute) {
  if (approvalRoute.updatedAt) {
    return `Updated ${formatRouteDate(approvalRoute.updatedAt)}`;
  }

  return `Created ${formatRouteDate(approvalRoute.createdAt)}`;
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

function ApprovalRouteStatusPill({ isActive }: { isActive: boolean }) {
  return (
    <StatusPill
      className={
        isActive
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-muted-foreground/20 bg-muted text-muted-foreground"
      }
    >
      {isActive ? "Active" : "Inactive"}
    </StatusPill>
  );
}

function ApprovalRouteListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          className="grid gap-3 rounded-2xl border border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)_8rem_auto] md:items-center"
          key={index}
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-32" />
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
function ApprovalRouteFormSheet({
  approvalRoute,
  approvers,
  documentTypes,
  mode,
  onOpenChange,
  onRouteAssigned,
}: {
  approvalRoute?: AdminApprovalRoute;
  approvers: AdminApprover[];
  documentTypes: AdminDocumentType[];
  mode: "assign" | "edit";
  onOpenChange: (open: boolean) => void;
  onRouteAssigned: () => void;
}) {
  const activeDocumentTypes = useMemo(
    () => documentTypes.filter((documentType) => documentType.isActive),
    [documentTypes],
  );
  const hasCurrentApprover = approvers.some(
    (approver) => approver.id === approvalRoute?.approverId,
  );
  const [documentTypeId, setDocumentTypeId] = useState(() =>
    String(approvalRoute?.documentTypeId ?? activeDocumentTypes[0]?.id ?? ""),
  );
  const [approverId, setApproverId] = useState(() =>
    approvalRoute && hasCurrentApprover
      ? approvalRoute.approverId
      : approvers[0]?.id ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDocumentTypeId = Number(documentTypeId);
  const selectedDocumentType = documentTypes.find(
    (documentType) => documentType.id === selectedDocumentTypeId,
  );
  const selectedApprover = approvers.find(
    (approver) => approver.id === approverId,
  );
  const isEditMode = mode === "edit";
  const hasChanges = approvalRoute
    ? !approvalRoute.isActive || approvalRoute.approverId !== approverId
    : Boolean(documentTypeId && approverId);
  const canSubmit =
    Boolean(selectedDocumentType?.isActive) && Boolean(selectedApprover) && hasChanges;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !canSubmit || !selectedDocumentType || !selectedApprover) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await assignAdminDocumentTypeApprover(
        selectedDocumentType.id,
        selectedApprover.id,
      );
      onRouteAssigned();
      onOpenChange(false);
      toast.success(
        `${selectedDocumentType.name} now routes to ${getApproverDisplayName(
          selectedApprover,
        )}.`,
      );
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Unable to save approval route."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md"
        showCloseButton={!isSubmitting}
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>
              {isEditMode ? "Edit approval route" : "Assign approval route"}
            </SheetTitle>
            <SheetDescription>
              Select the approver responsible for a document type.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Unable to save approval route</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {formError}
                </AlertDescription>
              </Alert>
            ) : null}

            {activeDocumentTypes.length === 0 ? (
              <Alert>
                <AlertTitle>No active document types</AlertTitle>
                <AlertDescription>
                  Enable or create a document type before assigning an approval route.
                </AlertDescription>
              </Alert>
            ) : null}

            {approvers.length === 0 ? (
              <Alert>
                <AlertTitle>No active approvers</AlertTitle>
                <AlertDescription>
                  Create or enable an Approver user before assigning a route.
                </AlertDescription>
              </Alert>
            ) : null}

            {selectedDocumentType && !selectedDocumentType.isActive ? (
              <Alert variant="destructive">
                <AlertTitle>Inactive document type</AlertTitle>
                <AlertDescription>
                  This route cannot be changed until the document type is active.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="approval-route-document-type">Document type</Label>
              <select
                className={cn(
                  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
                )}
                disabled={isSubmitting || isEditMode}
                id="approval-route-document-type"
                onChange={(event) => {
                  setDocumentTypeId(event.target.value);
                  setFormError(null);
                }}
                value={documentTypeId}
              >
                {isEditMode && selectedDocumentType ? (
                  <option value={selectedDocumentType.id}>
                    {selectedDocumentType.name}
                  </option>
                ) : null}
                {!isEditMode ? (
                  <>
                    {activeDocumentTypes.length === 0 ? (
                      <option value="">No active document types</option>
                    ) : null}
                    {activeDocumentTypes.map((documentType) => (
                      <option key={documentType.id} value={documentType.id}>
                        {documentType.name}
                      </option>
                    ))}
                  </>
                ) : null}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval-route-approver">Approver</Label>
              <select
                className={cn(
                  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
                )}
                disabled={isSubmitting || approvers.length === 0}
                id="approval-route-approver"
                onChange={(event) => {
                  setApproverId(event.target.value);
                  setFormError(null);
                }}
                value={approverId}
              >
                {approvers.length === 0 ? <option value="">No approvers</option> : null}
                {approvers.map((approver) => (
                  <option key={approver.id} value={approver.id}>
                    {getApproverDisplayName(approver)}
                    {approver.email ? ` (${approver.email})` : ""}
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
            <Button disabled={isSubmitting || !canSubmit} type="submit">
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? approvalRoute?.isActive
                    ? "Save route"
                    : "Re-enable route"
                  : "Assign route"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
function AdminApprovalRoutesPage() {
  const [approvalRoutes, setApprovalRoutes] = useState<AdminApprovalRoute[]>([]);
  const [approvers, setApprovers] = useState<AdminApprover[]>([]);
  const [documentTypes, setDocumentTypes] = useState<AdminDocumentType[]>([]);
  const [activeForm, setActiveForm] = useState<ActiveApprovalRouteForm | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingApprovalRoutes, setIsLoadingApprovalRoutes] = useState(true);
  const [isRefreshingApprovalRoutes, setIsRefreshingApprovalRoutes] =
    useState(false);
  const [approvalRoutesError, setApprovalRoutesError] = useState<string | null>(
    null,
  );
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null,
  );
  const [updatingApprovalRouteId, setUpdatingApprovalRouteId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadApprovalRouteData() {
      setIsLoadingApprovalRoutes(true);
      setApprovalRoutesError(null);

      try {
        const [adminApprovalRoutes, adminApprovers, adminDocumentTypes] =
          await Promise.all([
            getAdminApprovalRoutes(controller.signal),
            getAdminApprovers(controller.signal),
            getAdminDocumentTypes(controller.signal),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setApprovalRoutes(adminApprovalRoutes);
        setApprovers(adminApprovers);
        setDocumentTypes(adminDocumentTypes);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setApprovalRoutesError(
          getApiErrorMessage(error, "Unable to load approval routes."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingApprovalRoutes(false);
        }
      }
    }

    void loadApprovalRouteData();

    return () => {
      controller.abort();
    };
  }, []);

  const routeStats = useMemo(
    () =>
      approvalRoutes.reduce(
        (stats, approvalRoute) => {
          if (approvalRoute.isActive) {
            stats.active += 1;
          } else {
            stats.inactive += 1;
          }

          return stats;
        },
        { active: 0, inactive: 0 },
      ),
    [approvalRoutes],
  );

  const statusFilterCounts = useMemo(
    () => ({
      all: approvalRoutes.length,
      active: routeStats.active,
      inactive: routeStats.inactive,
    }),
    [approvalRoutes.length, routeStats.active, routeStats.inactive],
  );

  const activeDocumentTypes = useMemo(
    () => documentTypes.filter((documentType) => documentType.isActive),
    [documentTypes],
  );
  const canAssignRoute = activeDocumentTypes.length > 0 && approvers.length > 0;

  const filteredApprovalRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return approvalRoutes.filter((approvalRoute) => {
      const matchesSearch =
        query.length === 0 ||
        [
          approvalRoute.documentTypeName,
          getRouteApproverDisplayName(approvalRoute),
          approvalRoute.approverEmail,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && approvalRoute.isActive) ||
        (statusFilter === "inactive" && !approvalRoute.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [approvalRoutes, searchQuery, statusFilter]);

  const sortedApprovalRoutes = useMemo(
    () =>
      filteredApprovalRoutes.toSorted((first, second) =>
        first.documentTypeName.localeCompare(second.documentTypeName),
      ),
    [filteredApprovalRoutes],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedApprovalRoutes.length / APPROVAL_ROUTES_PAGE_SIZE),
  );
  const currentApprovalRoutesPage = Math.min(currentPage, totalPages);
  const paginatedApprovalRoutes = useMemo(() => {
    const pageStart =
      (currentApprovalRoutesPage - 1) * APPROVAL_ROUTES_PAGE_SIZE;
    return sortedApprovalRoutes.slice(
      pageStart,
      pageStart + APPROVAL_ROUTES_PAGE_SIZE,
    );
  }, [currentApprovalRoutesPage, sortedApprovalRoutes]);
  const visibleApprovalRouteStart =
    sortedApprovalRoutes.length === 0
      ? 0
      : (currentApprovalRoutesPage - 1) * APPROVAL_ROUTES_PAGE_SIZE + 1;
  const visibleApprovalRouteEnd = Math.min(
    currentApprovalRoutesPage * APPROVAL_ROUTES_PAGE_SIZE,
    sortedApprovalRoutes.length,
  );

  async function refreshApprovalRoutes() {
    setIsRefreshingApprovalRoutes(true);
    setApprovalRoutesError(null);

    try {
      const adminApprovalRoutes = await getAdminApprovalRoutes();
      setApprovalRoutes(adminApprovalRoutes);
    } catch (error) {
      setApprovalRoutesError(
        getApiErrorMessage(error, "Unable to refresh approval routes."),
      );
    } finally {
      setIsRefreshingApprovalRoutes(false);
    }
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  async function handleApprovalRouteDisable(approvalRoute: AdminApprovalRoute) {
    setUpdatingApprovalRouteId(approvalRoute.id);
    setStatusUpdateError(null);

    try {
      await disableAdminApprovalRoute(approvalRoute.id);
      setApprovalRoutes((currentApprovalRoutes) =>
        currentApprovalRoutes.map((currentApprovalRoute) =>
          currentApprovalRoute.id === approvalRoute.id
            ? { ...currentApprovalRoute, isActive: false }
            : currentApprovalRoute,
        ),
      );
      toast.success(`${approvalRoute.documentTypeName} route was disabled.`);
    } catch (error) {
      setStatusUpdateError(
        getApiErrorMessage(error, "Unable to disable approval route."),
      );
    } finally {
      setUpdatingApprovalRouteId(null);
    }
  }

  function handleRouteAssigned() {
    void refreshApprovalRoutes();
  }

  function goToApprovalRoutesPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }
  return (
    <section className="space-y-5">
      {approvalRoutesError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load approval routes</AlertTitle>
          <AlertDescription>{approvalRoutesError}</AlertDescription>
        </Alert>
      ) : null}

      {statusUpdateError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to update approval route</AlertTitle>
          <AlertDescription>{statusUpdateError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Approval routes</CardTitle>
          <CardDescription>
            Assign document types to approvers and manage active routes.
          </CardDescription>
          <CardAction>
            <Button
              disabled={isLoadingApprovalRoutes || !canAssignRoute}
              onClick={() => setActiveForm({ mode: "assign" })}
              type="button"
            >
              Assign route
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className="sr-only">Search approval routes</span>
              <Input
                onChange={(event) =>
                  handleSearchQueryChange(event.target.value)
                }
                placeholder="Search by document type or approver"
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

          {!isLoadingApprovalRoutes && !canAssignRoute ? (
            <Alert>
              <AlertTitle>Route setup requirements</AlertTitle>
              <AlertDescription>
                {activeDocumentTypes.length === 0 && approvers.length === 0
                  ? "Create an active document type and an active Approver user before assigning routes."
                  : activeDocumentTypes.length === 0
                    ? "Create or enable an active document type before assigning routes."
                    : "Create or enable an active Approver user before assigning routes."}
              </AlertDescription>
            </Alert>
          ) : null}

          {isRefreshingApprovalRoutes ? (
            <div className="sr-only" role="status">
              Refreshing approval routes
            </div>
          ) : null}

          {isLoadingApprovalRoutes ? (
            <ApprovalRouteListSkeleton />
          ) : sortedApprovalRoutes.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)_8rem_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Document type</span>
                  <span>Approver</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="divide-y divide-border">
                  {paginatedApprovalRoutes.map((approvalRoute) => {
                    const approverDisplayName =
                      getRouteApproverDisplayName(approvalRoute);
                    const isUpdating =
                      updatingApprovalRouteId === approvalRoute.id;

                    return (
                      <li
                        className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)_8rem_auto] md:items-center"
                        key={approvalRoute.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {approvalRoute.documentTypeName}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {getRouteActivityLabel(approvalRoute)}
                          </p>
                        </div>

                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(approverDisplayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {approverDisplayName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {approvalRoute.approverEmail ?? "No email"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <ApprovalRouteStatusPill
                            isActive={approvalRoute.isActive}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <Button
                            disabled={isUpdating || !canAssignRoute}
                            onClick={() =>
                              setActiveForm({ mode: "edit", approvalRoute })
                            }
                            type="button"
                            variant="outline"
                          >
                            {approvalRoute.isActive ? "Edit" : "Reassign"}
                          </Button>

                          {approvalRoute.isActive ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  disabled={isUpdating}
                                  type="button"
                                  variant="destructive"
                                >
                                  Disable
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Disable this approval route?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    New requests for this document type cannot be
                                    submitted until a route is assigned again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="rounded-2xl bg-muted px-3 py-2 text-sm">
                                  <p className="font-medium">
                                    {approvalRoute.documentTypeName}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {approverDisplayName}
                                  </p>
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel asChild>
                                    <Button
                                      disabled={isUpdating}
                                      type="button"
                                      variant="outline"
                                    >
                                      Cancel
                                    </Button>
                                  </AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button
                                      disabled={isUpdating}
                                      onClick={() =>
                                        void handleApprovalRouteDisable(
                                          approvalRoute,
                                        )
                                      }
                                      type="button"
                                      variant="destructive"
                                    >
                                      Disable
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {visibleApprovalRouteStart}-
                    {visibleApprovalRouteEnd} of {sortedApprovalRoutes.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={currentApprovalRoutesPage === 1}
                      onClick={() =>
                        goToApprovalRoutesPage(currentApprovalRoutesPage - 1)
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center">
                      Page {currentApprovalRoutesPage} of {totalPages}
                    </span>
                    <Button
                      disabled={currentApprovalRoutesPage === totalPages}
                      onClick={() =>
                        goToApprovalRoutesPage(currentApprovalRoutesPage + 1)
                      }
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
                approvalRoutes.length === 0
                  ? "Assign an active document type to an approver to let requesters submit it for approval."
                  : "Try a different search term or status filter."
              }
              title={
                approvalRoutes.length === 0
                  ? "No approval routes found"
                  : "No matches"
              }
            />
          )}
        </CardContent>
      </Card>

      {activeForm ? (
        <ApprovalRouteFormSheet
          approvalRoute={
            activeForm.mode === "edit" ? activeForm.approvalRoute : undefined
          }
          approvers={approvers}
          documentTypes={documentTypes}
          key={
            activeForm.mode === "edit"
              ? `edit-${activeForm.approvalRoute.id}`
              : "assign"
          }
          mode={activeForm.mode}
          onOpenChange={(open) => {
            if (!open) {
              setActiveForm(null);
            }
          }}
          onRouteAssigned={handleRouteAssigned}
        />
      ) : null}
    </section>
  );
}

export default AdminApprovalRoutesPage;
