import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClipboardClockIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  FileTextIcon,
  HistoryIcon,
  RefreshCwIcon,
  RouteIcon,
  ShieldUserIcon,
  UsersIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminActivityLogs } from "@/features/admin/adminActivityLogsApi";
import {
  getAdminApprovalRoutes,
  type AdminApprovalRoute,
} from "@/features/admin/adminApprovalRoutesApi";
import {
  getAdminDocumentTypes,
  type AdminDocumentType,
} from "@/features/admin/adminDocumentTypesApi";
import { getAdminUsers, type AdminUser } from "@/features/admin/adminUsersApi";
import { useAuth } from "@/features/auth/useAuth";
import {
  getApproverDocumentRequests,
  getRequesterDocumentRequests,
  type ApproverDocumentRequestListItem,
  type DocumentRequestStatus,
  type RequesterDocumentRequestListItem,
} from "@/features/documentRequests/documentRequestsApi";
import { appRoles } from "@/layouts/navigation";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

type DashboardAdminData = {
  activityLogs: Awaited<ReturnType<typeof getAdminActivityLogs>>;
  approvalRoutes: AdminApprovalRoute[];
  documentTypes: AdminDocumentType[];
  users: AdminUser[];
};

type DashboardData = {
  admin?: DashboardAdminData;
  approver?: {
    requests: ApproverDocumentRequestListItem[];
  };
  requester?: {
    requests: RequesterDocumentRequestListItem[];
  };
};

type QuickAction = {
  description: string;
  icon: ReactNode;
  label: string;
  to: string;
};

type MetricCardProps = {
  description: string;
  icon: ReactNode;
  label: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  value: ReactNode;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateFormatter.format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : dateTimeFormatter.format(date);
}

function isToday(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getUserDisplayName(user: { email?: string | null; fullName?: string | null }) {
  return user.fullName?.trim() || user.email || "Workspace user";
}

function formatActionLabel(actionType: string) {
  return (
    actionType
      .replaceAll(/[_-]+/g, " ")
      .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim() || "Activity recorded"
  );
}

function sortByNewestDate<T>(items: T[], getValue: (item: T) => string | null | undefined) {
  return items.toSorted((firstItem, secondItem) => {
    const firstDate = new Date(getValue(firstItem) ?? "").getTime();
    const secondDate = new Date(getValue(secondItem) ?? "").getTime();
    const firstTime = Number.isNaN(firstDate) ? 0 : firstDate;
    const secondTime = Number.isNaN(secondDate) ? 0 : secondDate;

    return secondTime - firstTime;
  });
}

function getStatusCount<T extends { statusName: string }>(items: T[], status: DocumentRequestStatus) {
  return items.filter((item) => item.statusName === status).length;
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

function RequestStatusPill({ status }: { status: string }) {
  const className =
    status === "Approved"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "Rejected"
        ? "border-destructive/25 bg-destructive/10 text-destructive"
        : status === "PendingApproval"
          ? "border-primary/20 bg-primary/10 text-primary"
          : status === "Draft"
            ? "border-muted-foreground/20 bg-muted text-muted-foreground"
            : "border-muted-foreground/20 bg-muted text-muted-foreground";

  const label = status === "PendingApproval" ? "Pending approval" : status;

  return <StatusPill className={className}>{label}</StatusPill>;
}

function MetricCard({ description, icon, label, tone = "default", value }: MetricCardProps) {
  const iconClassName =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "success"
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : tone === "warning"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className={cn("rounded-2xl p-2", iconClassName)}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-2xl font-semibold leading-none">{value}</span>
          <span className="mt-2 block text-sm font-medium">{label}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border p-5">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-32 rounded-2xl" key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump to common workspace tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {actions.map((action) => (
            <Link
              className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 text-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              key={action.to}
              to={action.to}
            >
              <span className="rounded-xl bg-muted p-2 text-muted-foreground">
                {action.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{action.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {action.description}
                </span>
              </span>
              <ArrowRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SetupChecklist({ adminData }: { adminData: DashboardAdminData }) {
  const activeApprovers = adminData.users.filter(
    (user) => user.role === appRoles.approver && !user.isDisabled,
  ).length;
  const activeDocumentTypes = adminData.documentTypes.filter(
    (documentType) => documentType.isActive,
  ).length;
  const activeRoutes = adminData.approvalRoutes.filter(
    (approvalRoute) => approvalRoute.isActive,
  ).length;
  const checks = [
    {
      done: activeDocumentTypes > 0,
      label: "Active document type",
      value: `${activeDocumentTypes} available`,
    },
    {
      done: activeApprovers > 0,
      label: "Active approver",
      value: `${activeApprovers} available`,
    },
    {
      done: activeRoutes > 0,
      label: "Active approval route",
      value: `${activeRoutes} configured`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace readiness</CardTitle>
        <CardDescription>Required setup before requesters can submit documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check) => (
            <div className="flex items-center gap-3" key={check.label}>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  check.done
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                )}
              >
                {check.done ? (
                  <CheckCircle2Icon aria-hidden="true" className="size-4" />
                ) : (
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{check.label}</span>
                <span className="block text-xs text-muted-foreground">{check.value}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard({ adminData }: { adminData: DashboardAdminData }) {
  const activeUsers = adminData.users.filter((user) => !user.isDisabled).length;
  const activeDocumentTypes = adminData.documentTypes.filter(
    (documentType) => documentType.isActive,
  ).length;
  const activeRoutes = adminData.approvalRoutes.filter(
    (approvalRoute) => approvalRoute.isActive,
  ).length;
  const todayActivity = adminData.activityLogs.filter((activityLog) =>
    isToday(activityLog.createdAt),
  ).length;
  const recentActivity = adminData.activityLogs.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`${adminData.users.length - activeUsers} disabled`}
          icon={<UsersIcon aria-hidden="true" className="size-5" />}
          label="Active users"
          tone="primary"
          value={activeUsers}
        />
        <MetricCard
          description={`${adminData.documentTypes.length} total document types`}
          icon={<FileTextIcon aria-hidden="true" className="size-5" />}
          label="Active document types"
          tone="success"
          value={activeDocumentTypes}
        />
        <MetricCard
          description={`${adminData.approvalRoutes.length} total approval routes`}
          icon={<RouteIcon aria-hidden="true" className="size-5" />}
          label="Active routes"
          tone={activeRoutes > 0 ? "success" : "warning"}
          value={activeRoutes}
        />
        <MetricCard
          description="Audit events recorded today"
          icon={<ActivityIcon aria-hidden="true" className="size-5" />}
          label="Today activity"
          tone="default"
          value={todayActivity}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Recent system activity</CardTitle>
            <CardDescription>Latest audit events across users, routes, and requests.</CardDescription>
            <CardAction>
              <Button asChild variant="outline">
                <Link to={paths.systemActivityHistory}>View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {recentActivity.map((activityLog) => (
                  <li className="px-4 py-3" key={activityLog.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {formatActionLabel(activityLog.actionType)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {activityLog.description ?? "No description"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(activityLog.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                description="Audit events will appear after users interact with the system."
                title="No activity yet"
              />
            )}
          </CardContent>
        </Card>

        <SetupChecklist adminData={adminData} />
      </div>
    </div>
  );
}

function RequestList({
  emptyDescription,
  emptyTitle,
  items,
}: {
  emptyDescription: string;
  emptyTitle: string;
  items: RequesterDocumentRequestListItem[];
}) {
  if (items.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {items.map((request) => (
        <li className="px-4 py-3" key={request.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{request.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {request.requestNumber} · {request.documentTypeName}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <RequestStatusPill status={request.statusName} />
              <span className="text-xs text-muted-foreground">
                {formatDate(request.submittedAt ?? request.createdAt)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RequesterDashboard({
  requests,
}: {
  requests: RequesterDocumentRequestListItem[];
}) {
  const draftCount = getStatusCount(requests, "Draft");
  const pendingCount = getStatusCount(requests, "PendingApproval");
  const approvedCount = getStatusCount(requests, "Approved");
  const rejectedCount = getStatusCount(requests, "Rejected");
  const recentRequests = sortByNewestDate(
    requests,
    (request) => request.submittedAt ?? request.createdAt,
  ).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Saved but not submitted"
          icon={<ClipboardListIcon aria-hidden="true" className="size-5" />}
          label="Drafts"
          value={draftCount}
        />
        <MetricCard
          description="Waiting for approver review"
          icon={<ClipboardClockIcon aria-hidden="true" className="size-5" />}
          label="Pending approval"
          tone="primary"
          value={pendingCount}
        />
        <MetricCard
          description="Completed successfully"
          icon={<CheckCircle2Icon aria-hidden="true" className="size-5" />}
          label="Approved"
          tone="success"
          value={approvedCount}
        />
        <MetricCard
          description="Returned by approvers"
          icon={<AlertCircleIcon aria-hidden="true" className="size-5" />}
          label="Rejected"
          tone={rejectedCount > 0 ? "danger" : "default"}
          value={rejectedCount}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
          <CardDescription>Your latest document requests and their current status.</CardDescription>
          <CardAction>
            <Button asChild>
              <Link to={paths.createRequest}>Create request</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <RequestList
            emptyDescription="Create a document request when you are ready to send a file for approval."
            emptyTitle="No requests yet"
            items={recentRequests}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ApproverRequestList({
  requests,
}: {
  requests: ApproverDocumentRequestListItem[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        description="New assignments will appear here when requesters submit documents for your review."
        title="No pending approvals"
      />
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {requests.map((request) => (
        <li className="px-4 py-3" key={request.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{request.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {request.requestNumber} · {request.documentTypeName}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                Requested by {request.requesterName || request.requesterEmail || "Unknown requester"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <RequestStatusPill status={request.statusName} />
              <span className="text-xs text-muted-foreground">
                Submitted {formatDate(request.submittedAt ?? request.createdAt)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ApproverDashboard({
  requests,
}: {
  requests: ApproverDocumentRequestListItem[];
}) {
  const pendingTodayCount = requests.filter((request) =>
    isToday(request.submittedAt ?? request.createdAt),
  ).length;
  const nextRequests = requests.slice(0, 5);
  const oldestRequest = requests[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          description="Assigned to you for review"
          icon={<ClipboardClockIcon aria-hidden="true" className="size-5" />}
          label="Pending approvals"
          tone={requests.length > 0 ? "primary" : "success"}
          value={requests.length}
        />
        <MetricCard
          description="Submitted today"
          icon={<ActivityIcon aria-hidden="true" className="size-5" />}
          label="New today"
          value={pendingTodayCount}
        />
        <MetricCard
          description="Oldest item waiting in your queue"
          icon={<HistoryIcon aria-hidden="true" className="size-5" />}
          label="Oldest pending"
          tone={oldestRequest ? "warning" : "success"}
          value={oldestRequest ? formatDate(oldestRequest.submittedAt ?? oldestRequest.createdAt) : "Clear"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>Review the oldest pending assignments first.</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link to={paths.pendingRequests}>Open queue</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ApproverRequestList requests={nextRequests} />
        </CardContent>
      </Card>
    </div>
  );
}

function buildQuickActions({
  isAdmin,
  isApprover,
  isRequester,
}: {
  isAdmin: boolean;
  isApprover: boolean;
  isRequester: boolean;
}) {
  const actions: QuickAction[] = [];

  if (isAdmin) {
    actions.push(
      {
        description: "Create, disable, and inspect users.",
        icon: <UsersIcon aria-hidden="true" className="size-4" />,
        label: "Manage users",
        to: paths.users,
      },
      {
        description: "Assign approvers to document types.",
        icon: <RouteIcon aria-hidden="true" className="size-4" />,
        label: "Approval routes",
        to: paths.approvalRoutes,
      },
      {
        description: "Review audit events across the system.",
        icon: <HistoryIcon aria-hidden="true" className="size-4" />,
        label: "Activity history",
        to: paths.systemActivityHistory,
      },
    );
  }

  if (isRequester) {
    actions.push(
      {
        description: "Upload and prepare a document for approval.",
        icon: <ClipboardPlusIcon aria-hidden="true" className="size-4" />,
        label: "Create request",
        to: paths.createRequest,
      },
      {
        description: "Track drafts and submitted requests.",
        icon: <ClipboardListIcon aria-hidden="true" className="size-4" />,
        label: "My requests",
        to: paths.requests,
      },
    );
  }

  if (isApprover) {
    actions.push(
      {
        description: "Review requests assigned to you.",
        icon: <ClipboardCheckIcon aria-hidden="true" className="size-4" />,
        label: "Pending requests",
        to: paths.pendingRequests,
      },
      {
        description: "See requests you have already reviewed.",
        icon: <HistoryIcon aria-hidden="true" className="size-4" />,
        label: "Reviewed requests",
        to: paths.reviewedRequests,
      },
    );
  }

  return actions;
}

function DashboardPage() {
  const { roles, user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const isAdmin = roles.includes(appRoles.admin);
  const isRequester = roles.includes(appRoles.requester);
  const isApprover = roles.includes(appRoles.approver);
  const hasKnownRole = isAdmin || isRequester || isApprover;
  const userLabel = getUserDisplayName(user ?? {});
  const roleLabel = roles.join(", ") || "No role assigned";
  const quickActions = useMemo(
    () => buildQuickActions({ isAdmin, isApprover, isRequester }),
    [isAdmin, isApprover, isRequester],
  );

  const loadDashboardData = useCallback(async (signal?: AbortSignal) => {
    if (!hasKnownRole) {
      return {} satisfies DashboardData;
    }

    const adminDataPromise = isAdmin
      ? Promise.all([
          getAdminUsers(signal),
          getAdminDocumentTypes(signal),
          getAdminApprovalRoutes(signal),
          getAdminActivityLogs({}, signal),
        ])
      : Promise.resolve(null);
    const requesterRequestsPromise = isRequester
      ? getRequesterDocumentRequests(signal)
      : Promise.resolve(null);
    const approverRequestsPromise = isApprover
      ? getApproverDocumentRequests(signal)
      : Promise.resolve(null);

    const [adminDataResult, requesterRequests, approverRequests] =
      await Promise.all([
        adminDataPromise,
        requesterRequestsPromise,
        approverRequestsPromise,
      ]);

    return {
      admin: adminDataResult
        ? {
            users: adminDataResult[0],
            documentTypes: adminDataResult[1],
            approvalRoutes: adminDataResult[2],
            activityLogs: adminDataResult[3],
          }
        : undefined,
      requester: requesterRequests ? { requests: requesterRequests } : undefined,
      approver: approverRequests ? { requests: approverRequests } : undefined,
    } satisfies DashboardData;
  }, [hasKnownRole, isAdmin, isApprover, isRequester]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialDashboardData() {
      setIsLoadingDashboard(true);
      setDashboardError(null);

      try {
        const nextDashboardData = await loadDashboardData(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setDashboardData(nextDashboardData);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDashboardError(
          getApiErrorMessage(error, "Unable to load dashboard."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDashboard(false);
        }
      }
    }

    void loadInitialDashboardData();

    return () => {
      controller.abort();
    };
  }, [loadDashboardData]);

  async function handleRefreshDashboard() {
    setIsRefreshingDashboard(true);
    setDashboardError(null);

    try {
      const nextDashboardData = await loadDashboardData();
      setDashboardData(nextDashboardData);
    } catch (error) {
      setDashboardError(getApiErrorMessage(error, "Unable to refresh dashboard."));
    } finally {
      setIsRefreshingDashboard(false);
    }
  }

  if (isLoadingDashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="space-y-5">
      {dashboardError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load dashboard</AlertTitle>
          <AlertDescription>{dashboardError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{formatDate(new Date().toISOString())}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Welcome back, {userLabel}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Here is the current approval workspace snapshot for your assigned role{roles.length === 1 ? "" : "s"}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.length > 0 ? (
                roles.map((role) => <StatusPill key={role}>{role}</StatusPill>)
              ) : (
                <StatusPill>{roleLabel}</StatusPill>
              )}
            </div>
          </div>
          <Button
            disabled={isRefreshingDashboard}
            onClick={() => void handleRefreshDashboard()}
            type="button"
            variant="outline"
          >
            <RefreshCwIcon aria-hidden="true" className="size-4" />
            {isRefreshingDashboard ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {!hasKnownRole ? (
        <Card>
          <CardHeader>
            <CardTitle>No workspace role assigned</CardTitle>
            <CardDescription>
              Ask an admin to assign an app role before using Inchain workflows.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {dashboardData.admin ? <AdminDashboard adminData={dashboardData.admin} /> : null}

      {dashboardData.requester ? (
        <RequesterDashboard requests={dashboardData.requester.requests} />
      ) : null}

      {dashboardData.approver ? (
        <ApproverDashboard requests={dashboardData.approver.requests} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.35fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace focus</CardTitle>
            <CardDescription>Use this dashboard to spot work that needs attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border px-4 py-3">
                <ShieldUserIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Role-aware view</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dashboard data is scoped to your current app roles.
                </p>
              </div>
              <div className="rounded-2xl border border-border px-4 py-3">
                <ClipboardClockIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Approval status</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Requests and approvals surface the latest status first.
                </p>
              </div>
              <div className="rounded-2xl border border-border px-4 py-3">
                <ActivityIcon aria-hidden="true" className="size-5 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Audit visibility</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Admins can quickly inspect recent system activity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <QuickActions actions={quickActions} />
      </div>
    </section>
  );
}

export default DashboardPage;
