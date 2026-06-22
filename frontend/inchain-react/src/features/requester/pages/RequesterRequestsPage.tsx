import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircleIcon,
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  ClipboardClockIcon,
  ClipboardListIcon,
  ClipboardPlusIcon,
  EyeIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  XCircleIcon,
} from "lucide-react";
import { Link } from "react-router";
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
  cancelRequesterDocumentRequest,
  deleteRequesterDocumentRequest,
  downloadDocumentRequestAttachment,
  getAttachmentFileName,
  getDocumentRequestActivities,
  getRequestDocumentTypes,
  getRequesterDocumentRequest,
  getRequesterDocumentRequests,
  submitRequesterDocumentRequest,
  updateRequesterDocumentRequest,
  type DocumentRequestActivity,
  type DocumentRequestStatus,
  type RequestDocumentType,
  type RequesterDocumentRequestDetail,
  type RequesterDocumentRequestListItem,
} from "@/features/documentRequests/documentRequestsApi";
import RequesterRequestForm, {
  type RequesterRequestFormValues,
} from "@/features/requester/components/RequesterRequestForm";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { toast } from "sonner";

type StatusFilter = "all" | "Draft" | "PendingApproval" | "Approved" | "Rejected" | "Cancelled";

type ProcessingAction =
  | `cancel-${number}`
  | `delete-${number}`
  | `download-${number}`
  | `submit-${number}`
  | null;

const REQUESTS_PAGE_SIZE = 8;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Drafts", value: "Draft" },
  { label: "Pending", value: "PendingApproval" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Cancelled", value: "Cancelled" },
];

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

function toListItem(request: RequesterDocumentRequestDetail): RequesterDocumentRequestListItem {
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    title: request.title,
    documentTypeName: request.documentTypeName,
    statusName: request.statusName,
    createdAt: request.createdAt,
    submittedAt: request.submittedAt,
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
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="rounded-2xl bg-muted p-2 text-muted-foreground">{icon}</span>
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
          className="grid gap-3 rounded-2xl border border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_9rem_9rem_auto] md:items-center"
          key={index}
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
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

function EmptyState({ action, description, title }: { action?: ReactNode; description: string; title: string }) {
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
function RequesterRequestsPage() {
  const [requests, setRequests] = useState<RequesterDocumentRequestListItem[]>([]);
  const [documentTypes, setDocumentTypes] = useState<RequestDocumentType[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [documentTypesError, setDocumentTypesError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [activeRequest, setActiveRequest] = useState<RequesterDocumentRequestDetail | null>(null);
  const [activeActivities, setActiveActivities] = useState<DocumentRequestActivity[]>([]);
  const [isLoadingActiveRequest, setIsLoadingActiveRequest] = useState(false);
  const [activeRequestError, setActiveRequestError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<ProcessingAction>(null);
  const [editingRequest, setEditingRequest] = useState<RequesterDocumentRequestDetail | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  async function loadRequests(signal?: AbortSignal) {
    const [requestsResult, documentTypesResult] = await Promise.allSettled([
      getRequesterDocumentRequests(signal),
      getRequestDocumentTypes(signal),
    ]);

    if (signal?.aborted) return;

    if (requestsResult.status === "fulfilled") {
      setRequests(requestsResult.value);
      setRequestsError(null);
    } else {
      setRequestsError(getApiErrorMessage(requestsResult.reason, "Unable to load requests."));
    }

    if (documentTypesResult.status === "fulfilled") {
      setDocumentTypes(documentTypesResult.value);
      setDocumentTypesError(null);
    } else {
      setDocumentTypesError(getApiErrorMessage(documentTypesResult.reason, "Unable to load document types."));
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
    if (activeRequestId === null) {
      return;
    }

    const documentRequestId = activeRequestId;
    const controller = new AbortController();

    async function loadActiveRequest() {
      setIsLoadingActiveRequest(true);
      setActiveRequestError(null);
      setActionError(null);

      try {
        const [requestDetail, requestActivities] = await Promise.all([
          getRequesterDocumentRequest(documentRequestId, controller.signal),
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

  const requestStats = useMemo(
    () => ({
      all: requests.length,
      Draft: requests.filter((request) => request.statusName === "Draft").length,
      PendingApproval: requests.filter((request) => request.statusName === "PendingApproval").length,
      Approved: requests.filter((request) => request.statusName === "Approved").length,
      Rejected: requests.filter((request) => request.statusName === "Rejected").length,
      Cancelled: requests.filter((request) => request.statusName === "Cancelled").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.statusName === statusFilter;
      const matchesSearch =
        query.length === 0 ||
        [request.title, request.requestNumber, request.documentTypeName].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PAGE_SIZE));
  const currentRequestsPage = Math.min(currentPage, totalPages);
  const paginatedRequests = useMemo(() => {
    const pageStart = (currentRequestsPage - 1) * REQUESTS_PAGE_SIZE;
    return filteredRequests.slice(pageStart, pageStart + REQUESTS_PAGE_SIZE);
  }, [currentRequestsPage, filteredRequests]);
  const visibleRequestStart = filteredRequests.length === 0 ? 0 : (currentRequestsPage - 1) * REQUESTS_PAGE_SIZE + 1;
  const visibleRequestEnd = Math.min(currentRequestsPage * REQUESTS_PAGE_SIZE, filteredRequests.length);

  function mergeRequest(request: RequesterDocumentRequestDetail) {
    const listItem = toListItem(request);

    setRequests((currentRequests) =>
      currentRequests.some((currentRequest) => currentRequest.id === request.id)
        ? currentRequests.map((currentRequest) => (currentRequest.id === request.id ? listItem : currentRequest))
        : [listItem, ...currentRequests],
    );
    setActiveRequest((currentRequest) => (currentRequest?.id === request.id ? request : currentRequest));
  }

  async function refreshRequests() {
    setIsRefreshingRequests(true);
    await loadRequests();
    setIsRefreshingRequests(false);
  }

  async function refreshActiveActivities(documentRequestId: number) {
    try {
      setActiveActivities(await getDocumentRequestActivities(documentRequestId));
    } catch {
      // Keep the existing timeline if only timeline refresh fails after a successful action.
    }
  }

  async function handleSubmitRequest(request: RequesterDocumentRequestDetail) {
    setProcessingAction(`submit-${request.id}`);
    setActionError(null);
    try {
      const submittedRequest = await submitRequesterDocumentRequest(request.id);
      mergeRequest(submittedRequest);
      await refreshActiveActivities(request.id);
      toast.success(`${submittedRequest.requestNumber} was submitted for approval.`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to submit request."));
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleCancelRequest(request: RequesterDocumentRequestDetail) {
    setProcessingAction(`cancel-${request.id}`);
    setActionError(null);
    try {
      const cancelledRequest = await cancelRequesterDocumentRequest(request.id);
      mergeRequest(cancelledRequest);
      await refreshActiveActivities(request.id);
      toast.success(`${cancelledRequest.requestNumber} was cancelled.`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to cancel request."));
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleDeleteRequest(request: RequesterDocumentRequestDetail) {
    setProcessingAction(`delete-${request.id}`);
    setActionError(null);
    try {
      await deleteRequesterDocumentRequest(request.id);
      setRequests((currentRequests) => currentRequests.filter((currentRequest) => currentRequest.id !== request.id));
      setActiveRequestId(null);
      toast.success(`${request.requestNumber} draft was deleted.`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to delete draft."));
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleDownloadAttachment(request: RequesterDocumentRequestDetail) {
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

  async function handleEditSubmit(values: RequesterRequestFormValues) {
    if (!editingRequest) return;
    setIsSubmittingEdit(true);
    setEditFormError(null);
    try {
      const updatedRequest = await updateRequesterDocumentRequest(editingRequest.id, values);
      mergeRequest(updatedRequest);
      await refreshActiveActivities(updatedRequest.id);
      setEditingRequest(null);
      toast.success(`${updatedRequest.requestNumber} draft was updated.`);
    } catch (error) {
      setEditFormError(getApiErrorMessage(error, "Unable to update draft."));
    } finally {
      setIsSubmittingEdit(false);
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

  function closeDetailSheet() {
    setActiveRequestId(null);
    setActiveRequest(null);
    setActiveActivities([]);
    setActionError(null);
  }

  const isDetailOpen = activeRequestId !== null;
  const isDraft = activeRequest?.statusName === "Draft";
  const isPendingApproval = activeRequest?.statusName === "PendingApproval";

  return (
    <section className="space-y-5">
      {requestsError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load requests</AlertTitle>
          <AlertDescription>{requestsError}</AlertDescription>
        </Alert>
      ) : null}

      {documentTypesError ? (
        <Alert>
          <AlertTitle>Document types unavailable</AlertTitle>
          <AlertDescription>
            Draft editing and new request document-type selection may be unavailable. {documentTypesError}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Saved but not submitted"
          icon={<ClipboardListIcon aria-hidden="true" className="size-5" />}
          label="Drafts"
          value={requestStats.Draft}
        />
        <MetricCard
          description="Waiting for approver review"
          icon={<ClipboardClockIcon aria-hidden="true" className="size-5" />}
          label="Pending approval"
          value={requestStats.PendingApproval}
        />
        <MetricCard
          description="Completed successfully"
          icon={<CheckCircle2Icon aria-hidden="true" className="size-5" />}
          label="Approved"
          value={requestStats.Approved}
        />
        <MetricCard
          description="Returned or cancelled"
          icon={<AlertCircleIcon aria-hidden="true" className="size-5" />}
          label="Closed"
          value={requestStats.Rejected + requestStats.Cancelled}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My requests</CardTitle>
          <CardDescription>Track drafts, submitted requests, and final approval results.</CardDescription>
          <CardAction>
            <div className="flex flex-wrap gap-2">
              <Button disabled={isRefreshingRequests} onClick={() => void refreshRequests()} type="button" variant="outline">
                <RefreshCwIcon aria-hidden="true" className="size-4" />
                {isRefreshingRequests ? "Refreshing..." : "Refresh"}
              </Button>
              <Button asChild>
                <Link to={paths.createRequest}>
                  <ClipboardPlusIcon aria-hidden="true" className="size-4" />
                  Create request
                </Link>
              </Button>
            </div>
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
                placeholder="Search by title, request number, or document type"
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
                        isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {requestStats[filter.value]}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {isRefreshingRequests ? <div className="sr-only" role="status">Refreshing requests</div> : null}

          {isLoadingRequests ? (
            <RequestsListSkeleton />
          ) : paginatedRequests.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1fr)_9rem_9rem_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Request</span>
                  <span>Status</span>
                  <span>Submitted</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="divide-y divide-border">
                  {paginatedRequests.map((request) => (
                    <li className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_9rem_9rem_auto] md:items-center" key={request.id}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{request.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{request.requestNumber} - {request.documentTypeName}</p>
                      </div>
                      <div><RequestStatusPill status={request.statusName} /></div>
                      <p className="text-sm text-muted-foreground">{formatDate(request.submittedAt ?? request.createdAt)}</p>
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
                  <p>Showing {visibleRequestStart}-{visibleRequestEnd} of {filteredRequests.length}</p>
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
              action={requests.length === 0 ? <Button asChild><Link to={paths.createRequest}>Create request</Link></Button> : undefined}
              description={requests.length === 0 ? "Create a document request when you are ready to send a file for approval." : "Try a different search term or status filter."}
              title={requests.length === 0 ? "No requests yet" : "No matches"}
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
                  {isDraft ? <StatusPill>Editable draft</StatusPill> : null}
                  {isPendingApproval ? <StatusPill>Waiting for approver</StatusPill> : null}
                </div>

                <dl className="grid gap-2">
                  <DetailRow label="Status" value={getStatusLabel(activeRequest.statusName)} />
                  <DetailRow label="Document type" value={activeRequest.documentTypeName} />
                  <DetailRow label="Created" value={formatDateTime(activeRequest.createdAt)} />
                  <DetailRow label="Updated" value={formatDateTime(activeRequest.updatedAt)} />
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
                  {isDraft ? (
                    <Button
                      disabled={processingAction !== null}
                      onClick={() => { setEditFormError(null); setEditingRequest(activeRequest); }}
                      type="button"
                      variant="outline"
                    >
                      <PencilIcon aria-hidden="true" className="size-4" />
                      Edit
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {isDraft ? (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={processingAction !== null} type="button" variant="outline">
                            <SendIcon aria-hidden="true" className="size-4" />
                            Submit
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Submit this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The request will move to pending approval. You cannot edit or delete it after submission.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild><Button type="button" variant="outline">Cancel</Button></AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button onClick={() => void handleSubmitRequest(activeRequest)} type="button">Submit request</Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={processingAction !== null} type="button" variant="destructive">
                            <Trash2Icon aria-hidden="true" className="size-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the draft from your request list. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild><Button type="button" variant="outline">Cancel</Button></AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button onClick={() => void handleDeleteRequest(activeRequest)} type="button" variant="destructive">Delete draft</Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : null}

                  {isPendingApproval ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={processingAction !== null} type="button" variant="destructive">
                          <XCircleIcon aria-hidden="true" className="size-4" />
                          Cancel request
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this pending request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The request will move to Cancelled and cannot be edited again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild><Button type="button" variant="outline">Keep pending</Button></AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button onClick={() => void handleCancelRequest(activeRequest)} type="button" variant="destructive">Cancel request</Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
      <Sheet
        open={Boolean(editingRequest)}
        onOpenChange={(open) => {
          if (!open && !isSubmittingEdit) {
            setEditingRequest(null);
            setEditFormError(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-md" showCloseButton={!isSubmittingEdit}>
          <SheetHeader>
            <SheetTitle>Edit draft</SheetTitle>
            <SheetDescription>
              Update request fields or replace the attachment before submission.
            </SheetDescription>
          </SheetHeader>
          {editingRequest ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                <RequesterRequestForm
                  cancelLabel="Close"
                  documentTypes={documentTypes}
                  formError={editFormError}
                  initialRequest={editingRequest}
                  isSubmitting={isSubmittingEdit}
                  onCancel={() => {
                    if (!isSubmittingEdit) {
                      setEditingRequest(null);
                      setEditFormError(null);
                    }
                  }}
                  onSubmit={(values) => void handleEditSubmit(values)}
                  submitLabel="Save draft"
                  submittingLabel="Saving..."
                />
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default RequesterRequestsPage;
