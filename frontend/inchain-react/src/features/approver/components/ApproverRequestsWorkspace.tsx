import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircleIcon,
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClipboardClockIcon,
  EyeIcon,
  FileTextIcon,
  RefreshCwIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
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
  approveApproverDocumentRequest,
  downloadDocumentRequestAttachment,
  getApproverDocumentRequest,
  getApproverDocumentRequests,
  getAttachmentFileName,
  getDocumentRequestActivities,
  rejectApproverDocumentRequest,
  type ApproverDocumentRequestDetail,
  type ApproverDocumentRequestListItem,
  type DocumentRequestActivity,
  type DocumentRequestStatus,
} from "@/features/documentRequests/documentRequestsApi";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ApproverRequestsMode = "pending" | "reviewed";
type ProcessingAction = `approve-${number}` | `download-${number}` | `reject-${number}` | null;
type StatusFilter = "all" | "Approved" | "Rejected";

const REQUESTS_PAGE_SIZE = 8;
const reviewedStatusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const reviewedRequestDetailCache = new Map<number, ApproverDocumentRequestDetail>();

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateFormatter.format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateTimeFormatter.format(date);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status: DocumentRequestStatus) {
  return status === "PendingApproval" ? "Pending approval" : status;
}

function getActionLabel(actionType: string) {
  return (
    actionType
      .replaceAll(/[_-]+/g, " ")
      .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim() || "Activity recorded"
  );
}

function isToday(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getCachedReviewedRequestListItems() {
  return Array.from(reviewedRequestDetailCache.values()).map(toListItem);
}

function cacheReviewedRequestDetail(request: ApproverDocumentRequestDetail) {
  if (request.statusName === "Approved" || request.statusName === "Rejected") {
    reviewedRequestDetailCache.set(request.id, request);
  }
}

function toListItem(request: ApproverDocumentRequestDetail): ApproverDocumentRequestListItem {
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    title: request.title,
    requesterName: request.requesterName,
    requesterEmail: request.requesterEmail,
    documentTypeName: request.documentTypeName,
    statusName: request.statusName,
    submittedAt: request.submittedAt,
    createdAt: request.createdAt,
  };
}

function triggerAttachmentDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function StatusPill({ className, children }: { className?: string; children: ReactNode }) {
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

function RequestStatusPill({ status }: { status: DocumentRequestStatus }) {
  const className =
    status === "Approved"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "Rejected"
        ? "border-destructive/25 bg-destructive/10 text-destructive"
        : status === "PendingApproval"
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-muted-foreground/20 bg-muted text-muted-foreground";

  return <StatusPill className={className}>{getStatusLabel(status)}</StatusPill>;
}
function MetricCard({
  description,
  icon,
  label,
  tone = "default",
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  value: ReactNode;
}) {
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-border px-3 py-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm">{value}</dd>
    </div>
  );
}

function RequestsListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          className="grid gap-3 rounded-2xl border border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_10rem_9rem_auto] md:items-center"
          key={index}
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

function RequestDetailSkeleton() {
  return (
    <div className="space-y-4 px-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: DocumentRequestActivity[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        description="Activity will appear as this request moves through the workflow."
        title="No activity yet"
      />
    );
  }

  return (
    <ol className="space-y-3">
      {activities.map((activity) => (
        <li className="rounded-2xl border border-border px-3 py-3" key={activity.id}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">{getActionLabel(activity.actionType)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activity.actorNameOrEmail ?? "System"}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
          </div>
          {activity.description ? <p className="mt-2 text-sm text-muted-foreground">{activity.description}</p> : null}
          {activity.oldStatusName || activity.newStatusName ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {activity.oldStatusName ? getStatusLabel(activity.oldStatusName) : "None"} to {activity.newStatusName ? getStatusLabel(activity.newStatusName) : "None"}
            </p>
          ) : null}
          {activity.remarks ? <div className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm">{activity.remarks}</div> : null}
        </li>
      ))}
    </ol>
  );
}

function getRequesterLabel(request: Pick<ApproverDocumentRequestListItem, "requesterEmail" | "requesterName">) {
  return request.requesterName.trim() || request.requesterEmail || "Unknown requester";
}
function ApproverRequestsWorkspace({ mode }: { mode: ApproverRequestsMode }) {
  const [requests, setRequests] = useState<ApproverDocumentRequestListItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [activeRequest, setActiveRequest] = useState<ApproverDocumentRequestDetail | null>(null);
  const [activeActivities, setActiveActivities] = useState<DocumentRequestActivity[]>([]);
  const [isLoadingActiveRequest, setIsLoadingActiveRequest] = useState(false);
  const [activeRequestError, setActiveRequestError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [rejectionRemarks, setRejectionRemarks] = useState("");

  const pageCopy = mode === "pending"
    ? {
        title: "Pending requests",
        description: "Review document requests assigned to you and approve or reject pending work.",
        emptyTitle: "No pending approvals",
        emptyDescription: "New assignments will appear here when requesters submit documents for your review.",
      }
    : {
        title: "Reviewed requests",
        description: "View approved and rejected requests you have already completed.",
        emptyTitle: "No reviewed requests",
        emptyDescription: "Approved and rejected assignments will appear here when they are returned by the approver request API.",
      };

  async function loadRequests(signal?: AbortSignal) {
    try {
      const approverRequests = await getApproverDocumentRequests(signal);
      if (signal?.aborted) return;
      const cachedReviewedRequests = getCachedReviewedRequestListItems();
      const mergedRequests = [...approverRequests];

      for (const cachedRequest of cachedReviewedRequests) {
        if (!mergedRequests.some((request) => request.id === cachedRequest.id)) {
          mergedRequests.push(cachedRequest);
        }
      }

      setRequests(mergedRequests);
      setRequestsError(null);
    } catch (error) {
      if (signal?.aborted) return;
      setRequestsError(getApiErrorMessage(error, "Unable to load approver requests."));
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialRequests() {
      setIsLoadingRequests(true);
      await loadRequests(controller.signal);
      if (!controller.signal.aborted) setIsLoadingRequests(false);
    }

    void loadInitialRequests();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (activeRequestId === null) return;

    const documentRequestId = activeRequestId;
    const controller = new AbortController();

    async function loadActiveRequest() {
      setIsLoadingActiveRequest(true);
      setActiveRequestError(null);
      setActionError(null);

      try {
        const cachedRequestDetail = reviewedRequestDetailCache.get(documentRequestId);
        const [requestDetail, requestActivities] = await Promise.all([
          cachedRequestDetail ?? getApproverDocumentRequest(documentRequestId, controller.signal),
          getDocumentRequestActivities(documentRequestId, controller.signal),
        ]);

        if (controller.signal.aborted) return;
        setActiveRequest(requestDetail);
        setActiveActivities(requestActivities);
      } catch (error) {
        if (controller.signal.aborted) return;
        setActiveRequestError(getApiErrorMessage(error, "Unable to load request details."));
      } finally {
        if (!controller.signal.aborted) setIsLoadingActiveRequest(false);
      }
    }

    void loadActiveRequest();
    return () => controller.abort();
  }, [activeRequestId]);

  const visibleModeRequests = useMemo(() => {
    const modeRequests = mode === "pending"
      ? requests.filter((request) => request.statusName === "PendingApproval")
      : requests.filter((request) => request.statusName === "Approved" || request.statusName === "Rejected");
    const query = searchQuery.trim().toLowerCase();

    return modeRequests.filter((request) => {
      const matchesStatus = mode === "pending" || statusFilter === "all" || request.statusName === statusFilter;
      const matchesSearch =
        query.length === 0 ||
        [
          request.title,
          request.requestNumber,
          request.documentTypeName,
          request.requesterName,
          request.requesterEmail ?? "",
        ].some((value) => value.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [mode, requests, searchQuery, statusFilter]);

  const requestStats = useMemo(() => {
    const pendingRequests = requests.filter((request) => request.statusName === "PendingApproval");
    const reviewedRequests = requests.filter((request) => request.statusName === "Approved" || request.statusName === "Rejected");

    return {
      pending: pendingRequests.length,
      newToday: pendingRequests.filter((request) => isToday(request.submittedAt ?? request.createdAt)).length,
      oldestPending: pendingRequests[0] ?? null,
      reviewed: reviewedRequests.length,
      Approved: reviewedRequests.filter((request) => request.statusName === "Approved").length,
      Rejected: reviewedRequests.filter((request) => request.statusName === "Rejected").length,
    };
  }, [requests]);

  const totalPages = Math.max(1, Math.ceil(visibleModeRequests.length / REQUESTS_PAGE_SIZE));
  const currentRequestsPage = Math.min(currentPage, totalPages);
  const paginatedRequests = useMemo(() => {
    const pageStart = (currentRequestsPage - 1) * REQUESTS_PAGE_SIZE;
    return visibleModeRequests.slice(pageStart, pageStart + REQUESTS_PAGE_SIZE);
  }, [currentRequestsPage, visibleModeRequests]);
  const visibleRequestStart = visibleModeRequests.length === 0 ? 0 : (currentRequestsPage - 1) * REQUESTS_PAGE_SIZE + 1;
  const visibleRequestEnd = Math.min(currentRequestsPage * REQUESTS_PAGE_SIZE, visibleModeRequests.length);
  const isDetailOpen = activeRequestId !== null;
  const canReviewActiveRequest = mode === "pending" && activeRequest?.statusName === "PendingApproval";
  const canSubmitRejection = rejectionRemarks.trim().length > 0;

  async function refreshRequests() {
    setIsRefreshingRequests(true);
    await loadRequests();
    setIsRefreshingRequests(false);
  }


  function mergeReviewedRequest(request: ApproverDocumentRequestDetail) {
    cacheReviewedRequestDetail(request);
    const listItem = toListItem(request);

    setRequests((currentRequests) =>
      currentRequests.some((currentRequest) => currentRequest.id === request.id)
        ? currentRequests.map((currentRequest) => (currentRequest.id === request.id ? listItem : currentRequest))
        : [listItem, ...currentRequests],
    );
    setActiveRequest((currentRequest) => (currentRequest?.id === request.id ? request : currentRequest));
  }

  async function handleApproveRequest(request: ApproverDocumentRequestDetail) {
    setProcessingAction(`approve-${request.id}`);
    setActionError(null);
    try {
      const approvedRequest = await approveApproverDocumentRequest(request.id, approvalRemarks);
      mergeReviewedRequest(approvedRequest);
      closeDetailSheet();
      toast.success(`${approvedRequest.requestNumber} was approved.`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to approve request."));
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleRejectRequest(request: ApproverDocumentRequestDetail) {
    if (!canSubmitRejection) return;

    setProcessingAction(`reject-${request.id}`);
    setActionError(null);
    try {
      const rejectedRequest = await rejectApproverDocumentRequest(request.id, rejectionRemarks);
      mergeReviewedRequest(rejectedRequest);
      closeDetailSheet();
      toast.success(`${rejectedRequest.requestNumber} was rejected.`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to reject request."));
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleDownloadAttachment(request: ApproverDocumentRequestDetail) {
    setProcessingAction(`download-${request.id}`);
    setActionError(null);
    try {
      const downloadedAttachment = await downloadDocumentRequestAttachment(request.id);
      triggerAttachmentDownload(downloadedAttachment.blob, downloadedAttachment.fileName);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to download attachment."));
    } finally {
      setProcessingAction(null);
    }
  }

  function closeDetailSheet() {
    setActiveRequestId(null);
    setActiveRequest(null);
    setActiveActivities([]);
    setActiveRequestError(null);
    setActionError(null);
    setApprovalRemarks("");
    setRejectionRemarks("");
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }
  return (
    <section className="space-y-5">
      {requestsError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load requests</AlertTitle>
          <AlertDescription>{requestsError}</AlertDescription>
        </Alert>
      ) : null}

      {mode === "pending" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            description="Assigned to you for review"
            icon={<ClipboardClockIcon aria-hidden="true" className="size-5" />}
            label="Pending approvals"
            tone={requestStats.pending > 0 ? "primary" : "success"}
            value={requestStats.pending}
          />
          <MetricCard
            description="Submitted today"
            icon={<FileTextIcon aria-hidden="true" className="size-5" />}
            label="New today"
            value={requestStats.newToday}
          />
          <MetricCard
            description="Oldest item waiting in queue"
            icon={<AlertCircleIcon aria-hidden="true" className="size-5" />}
            label="Oldest pending"
            tone={requestStats.oldestPending ? "warning" : "success"}
            value={requestStats.oldestPending ? formatDate(requestStats.oldestPending.submittedAt ?? requestStats.oldestPending.createdAt) : "Clear"}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            description="Completed approval decisions"
            icon={<ClipboardCheckIcon aria-hidden="true" className="size-5" />}
            label="Reviewed"
            value={requestStats.reviewed}
          />
          <MetricCard
            description="Requests you approved"
            icon={<CheckCircle2Icon aria-hidden="true" className="size-5" />}
            label="Approved"
            tone="success"
            value={requestStats.Approved}
          />
          <MetricCard
            description="Requests returned to requester"
            icon={<XCircleIcon aria-hidden="true" className="size-5" />}
            label="Rejected"
            tone={requestStats.Rejected > 0 ? "danger" : "default"}
            value={requestStats.Rejected}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{pageCopy.title}</CardTitle>
          <CardDescription>{pageCopy.description}</CardDescription>
          <CardAction>
            <Button disabled={isRefreshingRequests} onClick={() => void refreshRequests()} type="button" variant="outline">
              <RefreshCwIcon aria-hidden="true" className="size-4" />
              {isRefreshingRequests ? "Refreshing..." : "Refresh"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative min-w-0">
              <span className="sr-only">Search requests</span>
              <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => handleSearchQueryChange(event.target.value)}
                placeholder="Search by title, request number, requester, or document type"
                value={searchQuery}
              />
            </label>
            {mode === "reviewed" ? (
              <div className="flex flex-wrap gap-2">
                {reviewedStatusFilters.map((filter) => {
                  const isSelected = statusFilter === filter.value;
                  const count = filter.value === "all" ? requestStats.reviewed : requestStats[filter.value];
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
                          isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {isRefreshingRequests ? <div className="sr-only" role="status">Refreshing requests</div> : null}

          {isLoadingRequests ? (
            <RequestsListSkeleton />
          ) : paginatedRequests.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1fr)_10rem_9rem_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Request</span>
                  <span>Requester</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="divide-y divide-border">
                  {paginatedRequests.map((request) => (
                    <li className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_10rem_9rem_auto] md:items-center" key={request.id}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{request.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{request.requestNumber} - {request.documentTypeName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Submitted {formatDate(request.submittedAt ?? request.createdAt)}</p>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{getRequesterLabel(request)}</p>
                      <div><RequestStatusPill status={request.statusName} /></div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button onClick={() => setActiveRequestId(request.id)} type="button" variant="outline">
                          <EyeIcon aria-hidden="true" className="size-4" />
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>Showing {visibleRequestStart}-{visibleRequestEnd} of {visibleModeRequests.length}</p>
                  <div className="flex items-center gap-2">
                    <Button disabled={currentRequestsPage === 1} onClick={() => setCurrentPage(currentRequestsPage - 1)} size="sm" type="button" variant="outline">Previous</Button>
                    <span className="min-w-20 text-center">Page {currentRequestsPage} of {totalPages}</span>
                    <Button disabled={currentRequestsPage === totalPages} onClick={() => setCurrentPage(currentRequestsPage + 1)} size="sm" type="button" variant="outline">Next</Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              description={requests.length === 0 ? pageCopy.emptyDescription : "Try a different search term or status filter."}
              title={requests.length === 0 ? pageCopy.emptyTitle : "No matches"}
            />
          )}
        </CardContent>
      </Card>
      <Sheet open={isDetailOpen} onOpenChange={(open) => { if (!open) closeDetailSheet(); }}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{activeRequest?.title ?? "Request details"}</SheetTitle>
            <SheetDescription>
              {activeRequest
                ? `${activeRequest.requestNumber} - ${activeRequest.documentTypeName}`
                : "Review request details and workflow activity."}
            </SheetDescription>
          </SheetHeader>
          {isLoadingActiveRequest ? (
            <RequestDetailSkeleton />
          ) : activeRequestError ? (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertTitle>Unable to load request</AlertTitle>
                <AlertDescription>{activeRequestError}</AlertDescription>
              </Alert>
            </div>
          ) : activeRequest ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6">
                {actionError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Action failed</AlertTitle>
                    <AlertDescription className="whitespace-pre-line">{actionError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <RequestStatusPill status={activeRequest.statusName} />
                  {canReviewActiveRequest ? <StatusPill>Assigned to you</StatusPill> : <StatusPill>View only</StatusPill>}
                </div>

                <dl className="grid gap-2">
                  <DetailRow label="Status" value={getStatusLabel(activeRequest.statusName)} />
                  <DetailRow label="Document type" value={activeRequest.documentTypeName} />
                  <DetailRow label="Requester" value={`${getRequesterLabel(activeRequest)}${activeRequest.requesterEmail ? ` (${activeRequest.requesterEmail})` : ""}`} />
                  <DetailRow label="Created" value={formatDateTime(activeRequest.createdAt)} />
                  <DetailRow label="Submitted" value={formatDateTime(activeRequest.submittedAt)} />
                  <DetailRow label="Description" value={<span className="whitespace-pre-line">{activeRequest.description}</span>} />
                  <DetailRow
                    label="Attachment"
                    value={
                      activeRequest.attachment ? (
                        <span className="flex flex-col gap-1">
                          <span>{getAttachmentFileName(activeRequest.attachment)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(activeRequest.attachment.fileSize)} - {activeRequest.attachment.contentType ?? "Unknown type"}
                          </span>
                        </span>
                      ) : "No attachment"
                    }
                  />
                </dl>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity history</CardTitle>
                    <CardDescription>Status changes and updates recorded for this request.</CardDescription>
                  </CardHeader>
                  <CardContent><ActivityTimeline activities={activeActivities} /></CardContent>
                </Card>
              </div>

              <SheetFooter className="flex-col border-t sm:flex-row sm:flex-wrap sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {activeRequest.attachment ? (
                    <Button disabled={processingAction !== null} onClick={() => void handleDownloadAttachment(activeRequest)} type="button" variant="outline">
                      <ArrowDownToLineIcon aria-hidden="true" className="size-4" />
                      {processingAction === `download-${activeRequest.id}` ? "Downloading..." : "Download"}
                    </Button>
                  ) : null}
                </div>

                {canReviewActiveRequest ? (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={processingAction !== null} type="button" variant="outline">
                          <CheckCircle2Icon aria-hidden="true" className="size-4" />
                          Approve
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve this request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The request will become Approved and move out of your pending queue.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2">
                          <Label htmlFor="approval-remarks">Remarks optional</Label>
                          <textarea
                            className="min-h-24 w-full rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={processingAction !== null}
                            id="approval-remarks"
                            maxLength={1000}
                            onChange={(event) => setApprovalRemarks(event.target.value)}
                            placeholder="Add approval notes if needed"
                            value={approvalRemarks}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild><Button type="button" variant="outline">Cancel</Button></AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button onClick={() => void handleApproveRequest(activeRequest)} type="button">Approve request</Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={processingAction !== null} type="button" variant="destructive">
                          <XCircleIcon aria-hidden="true" className="size-4" />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject this request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Enter remarks for the requester. Rejected requests are final in this MVP.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2">
                          <Label htmlFor="rejection-remarks">Remarks</Label>
                          <textarea
                            aria-invalid={!canSubmitRejection}
                            className="min-h-28 w-full rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={processingAction !== null}
                            id="rejection-remarks"
                            maxLength={1000}
                            onChange={(event) => setRejectionRemarks(event.target.value)}
                            placeholder="Explain what needs to be corrected"
                            value={rejectionRemarks}
                          />
                          <p className="text-xs text-muted-foreground">Rejection remarks are required.</p>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild><Button type="button" variant="outline">Cancel</Button></AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button disabled={!canSubmitRejection} onClick={() => void handleRejectRequest(activeRequest)} type="button" variant="destructive">Reject request</Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : null}
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default ApproverRequestsWorkspace;
