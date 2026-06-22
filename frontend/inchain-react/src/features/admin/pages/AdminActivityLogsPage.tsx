import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminActivityLogs,
  type AdminActivityLog,
} from "@/features/admin/adminActivityLogsApi";
import { isApiError } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";

type TargetFilter =
  | "all"
  | "DocumentRequest"
  | "User"
  | "DocumentType"
  | "ApprovalRoute";

type DateFilter = "all" | "today" | "last7" | "last30";

const ACTIVITY_LOGS_PAGE_SIZE = 10;

const targetFilters: { label: string; value: TargetFilter }[] = [
  { label: "All", value: "all" },
  { label: "Requests", value: "DocumentRequest" },
  { label: "Users", value: "User" },
  { label: "Document types", value: "DocumentType" },
  { label: "Approval routes", value: "ApprovalRoute" },
];

const dateFilters: { label: string; value: DateFilter }[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7" },
  { label: "Last 30 days", value: "last30" },
];

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const selectClassName =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : dateTimeFormatter.format(date);
}

function formatActionLabel(actionType: string) {
  return (
    actionType
      .replaceAll(/[_-]+/g, " ")
      .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim() || "Activity recorded"
  );
}

function getActorLabel(activityLog: AdminActivityLog) {
  return activityLog.actorNameOrEmail?.trim() || "System";
}

function getTargetEntityLabel(targetEntityType: string) {
  switch (targetEntityType) {
    case "DocumentRequest":
      return "Document request";
    case "DocumentType":
      return "Document type";
    case "ApprovalRoute":
      return "Approval route";
    case "User":
      return "User";
    default:
      return targetEntityType || "System";
  }
}

function getTargetId(activityLog: AdminActivityLog) {
  if (activityLog.targetEntityId) {
    return activityLog.targetEntityId;
  }

  return activityLog.documentRequestId
    ? String(activityLog.documentRequestId)
    : null;
}

function getTargetLabel(activityLog: AdminActivityLog) {
  const targetId = getTargetId(activityLog);
  const targetEntityLabel = getTargetEntityLabel(activityLog.targetEntityType);

  return targetId ? `${targetEntityLabel} #${targetId}` : targetEntityLabel;
}

function isActivityLogInDateRange(
  activityLog: AdminActivityLog,
  dateFilter: DateFilter,
) {
  if (dateFilter === "all") {
    return true;
  }

  const createdAt = new Date(activityLog.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = new Date();

  if (dateFilter === "today") {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    return createdAt >= todayStart;
  }

  const lookbackDays = dateFilter === "last7" ? 7 : 30;
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - lookbackDays);
  return createdAt >= rangeStart;
}

function activityLogMatchesSearch(
  activityLog: AdminActivityLog,
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    activityLog.actionType,
    formatActionLabel(activityLog.actionType),
    activityLog.targetEntityType,
    getTargetEntityLabel(activityLog.targetEntityType),
    getTargetId(activityLog),
    getActorLabel(activityLog),
    activityLog.description,
    activityLog.oldStatusName,
    activityLog.newStatusName,
  ].some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(query),
  );
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

function TargetPill({ targetEntityType }: { targetEntityType: string }) {
  return (
    <StatusPill
      className={
        targetEntityType === "DocumentRequest"
          ? "border-primary/20 bg-primary/10 text-primary"
          : "border-muted-foreground/20 bg-muted text-muted-foreground"
      }
    >
      {getTargetEntityLabel(targetEntityType)}
    </StatusPill>
  );
}

function ActivityLogListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          className="grid gap-3 rounded-2xl border border-border px-4 py-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(10rem,0.65fr)_minmax(10rem,0.75fr)_minmax(9rem,0.55fr)_auto] lg:items-center"
          key={index}
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-28" />
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

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function ActivityLogDetailsSheet({
  activityLog,
  onOpenChange,
}: {
  activityLog: AdminActivityLog;
  onOpenChange: (open: boolean) => void;
}) {
  const statusChanged =
    Boolean(activityLog.oldStatusName) || Boolean(activityLog.newStatusName);

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{formatActionLabel(activityLog.actionType)}</SheetTitle>
          <SheetDescription>
            Recorded {formatDateTime(activityLog.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <dl>
            <DetailRow
              label="Actor"
              value={
                <span className="break-words">{getActorLabel(activityLog)}</span>
              }
            />
            <DetailRow label="Target" value={getTargetLabel(activityLog)} />
            <DetailRow
              label="Type"
              value={<TargetPill targetEntityType={activityLog.targetEntityType} />}
            />
            <DetailRow
              label="Action"
              value={
                <span className="break-all font-mono text-xs">
                  {activityLog.actionType}
                </span>
              }
            />
            <DetailRow
              label="Activity ID"
              value={
                <span className="font-mono text-xs">{activityLog.id}</span>
              }
            />
            <DetailRow
              label="Target ID"
              value={
                getTargetId(activityLog) ? (
                  <span className="break-all font-mono text-xs">
                    {getTargetId(activityLog)}
                  </span>
                ) : (
                  "Not provided"
                )
              }
            />
            <DetailRow
              label="Request ID"
              value={
                activityLog.documentRequestId ? (
                  <span className="font-mono text-xs">
                    {activityLog.documentRequestId}
                  </span>
                ) : (
                  "Not linked"
                )
              }
            />
            <DetailRow
              label="Status"
              value={
                statusChanged
                  ? `${activityLog.oldStatusName ?? "None"} -> ${
                      activityLog.newStatusName ?? "None"
                    }`
                  : "No status change"
              }
            />
            <DetailRow
              label="Time"
              value={formatDateTime(activityLog.createdAt)}
            />
            <DetailRow
              label="Description"
              value={
                activityLog.description ? (
                  <span className="whitespace-pre-line">
                    {activityLog.description}
                  </span>
                ) : (
                  "No description"
                )
              }
            />
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdminActivityLogsPage() {
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedActivityLog, setSelectedActivityLog] =
    useState<AdminActivityLog | null>(null);
  const [isLoadingActivityLogs, setIsLoadingActivityLogs] = useState(true);
  const [isRefreshingActivityLogs, setIsRefreshingActivityLogs] =
    useState(false);
  const [activityLogsError, setActivityLogsError] = useState<string | null>(
    null,
  );

  async function loadActivityLogs(signal?: AbortSignal) {
    const adminActivityLogs = await getAdminActivityLogs({}, signal);

    return adminActivityLogs;
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialActivityLogs() {
      setIsLoadingActivityLogs(true);
      setActivityLogsError(null);

      try {
        const adminActivityLogs = await loadActivityLogs(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setActivityLogs(adminActivityLogs);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setActivityLogsError(
          getApiErrorMessage(error, "Unable to load activity history."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingActivityLogs(false);
        }
      }
    }

    void loadInitialActivityLogs();

    return () => {
      controller.abort();
    };
  }, []);

  const targetFilterCounts = useMemo(
    () =>
      targetFilters.reduce<Record<TargetFilter, number>>(
        (counts, filter) => {
          counts[filter.value] =
            filter.value === "all"
              ? activityLogs.length
              : activityLogs.filter(
                  (activityLog) =>
                    activityLog.targetEntityType === filter.value,
                ).length;

          return counts;
        },
        {
          all: 0,
          DocumentRequest: 0,
          User: 0,
          DocumentType: 0,
          ApprovalRoute: 0,
        },
      ),
    [activityLogs],
  );

  const actionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          activityLogs
            .map((activityLog) => activityLog.actionType)
            .filter(Boolean),
        ),
      ).toSorted((firstAction, secondAction) =>
        formatActionLabel(firstAction).localeCompare(
          formatActionLabel(secondAction),
        ),
      ),
    [activityLogs],
  );

  const filteredActivityLogs = useMemo(() => {
    return activityLogs.filter((activityLog) => {
      const matchesSearch = activityLogMatchesSearch(activityLog, searchQuery);
      const matchesTarget =
        targetFilter === "all" ||
        activityLog.targetEntityType === targetFilter;
      const matchesAction =
        actionFilter === "all" || activityLog.actionType === actionFilter;
      const matchesDate = isActivityLogInDateRange(activityLog, dateFilter);

      return matchesSearch && matchesTarget && matchesAction && matchesDate;
    });
  }, [actionFilter, activityLogs, dateFilter, searchQuery, targetFilter]);

  const sortedActivityLogs = useMemo(
    () =>
      filteredActivityLogs.toSorted((firstLog, secondLog) => {
        const firstCreatedAt = new Date(firstLog.createdAt).getTime();
        const secondCreatedAt = new Date(secondLog.createdAt).getTime();
        const firstTime = Number.isNaN(firstCreatedAt) ? 0 : firstCreatedAt;
        const secondTime = Number.isNaN(secondCreatedAt) ? 0 : secondCreatedAt;

        return secondTime - firstTime || secondLog.id - firstLog.id;
      }),
    [filteredActivityLogs],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedActivityLogs.length / ACTIVITY_LOGS_PAGE_SIZE),
  );
  const currentActivityLogsPage = Math.min(currentPage, totalPages);
  const paginatedActivityLogs = useMemo(() => {
    const pageStart =
      (currentActivityLogsPage - 1) * ACTIVITY_LOGS_PAGE_SIZE;
    return sortedActivityLogs.slice(
      pageStart,
      pageStart + ACTIVITY_LOGS_PAGE_SIZE,
    );
  }, [currentActivityLogsPage, sortedActivityLogs]);
  const visibleActivityLogStart =
    sortedActivityLogs.length === 0
      ? 0
      : (currentActivityLogsPage - 1) * ACTIVITY_LOGS_PAGE_SIZE + 1;
  const visibleActivityLogEnd = Math.min(
    currentActivityLogsPage * ACTIVITY_LOGS_PAGE_SIZE,
    sortedActivityLogs.length,
  );
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    targetFilter !== "all" ||
    actionFilter !== "all" ||
    dateFilter !== "all";

  async function handleRefreshActivityLogs() {
    setIsRefreshingActivityLogs(true);
    setActivityLogsError(null);

    try {
      const adminActivityLogs = await loadActivityLogs();
      setActivityLogs(adminActivityLogs);
    } catch (error) {
      setActivityLogsError(
        getApiErrorMessage(error, "Unable to refresh activity history."),
      );
    } finally {
      setIsRefreshingActivityLogs(false);
    }
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleTargetFilterChange(value: TargetFilter) {
    setTargetFilter(value);
    setCurrentPage(1);
  }

  function handleActionFilterChange(value: string) {
    setActionFilter(value);
    setCurrentPage(1);
  }

  function handleDateFilterChange(value: DateFilter) {
    setDateFilter(value);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearchQuery("");
    setTargetFilter("all");
    setActionFilter("all");
    setDateFilter("all");
    setCurrentPage(1);
  }

  function goToActivityLogsPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  return (
    <section className="space-y-5">
      {activityLogsError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load activity history</AlertTitle>
          <AlertDescription>{activityLogsError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>System activity history</CardTitle>
          <CardDescription>
            Search, filter, and review audit events across the workspace.
          </CardDescription>
          <CardAction>
            <Button
              disabled={isLoadingActivityLogs || isRefreshingActivityLogs}
              onClick={() => void handleRefreshActivityLogs()}
              type="button"
              variant="outline"
            >
              {isRefreshingActivityLogs ? "Refreshing..." : "Refresh"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className="sr-only">Search activity history</span>
              <Input
                onChange={(event) =>
                  handleSearchQueryChange(event.target.value)
                }
                placeholder="Search by actor, action, target, or description"
                value={searchQuery}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {targetFilters.map((filter) => {
                const isSelected = targetFilter === filter.value;

                return (
                  <Button
                    key={filter.value}
                    onClick={() => handleTargetFilterChange(filter.value)}
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
                      {targetFilterCounts[filter.value]}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,16rem)_minmax(0,12rem)_auto]">
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Action
              </span>
              <select
                className={selectClassName}
                onChange={(event) =>
                  handleActionFilterChange(event.target.value)
                }
                value={actionFilter}
              >
                <option value="all">All actions</option>
                {actionOptions.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {formatActionLabel(actionType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Date
              </span>
              <select
                className={selectClassName}
                onChange={(event) =>
                  handleDateFilterChange(event.target.value as DateFilter)
                }
                value={dateFilter}
              >
                {dateFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                type="button"
                variant="ghost"
              >
                Clear filters
              </Button>
            </div>
          </div>

          {isRefreshingActivityLogs ? (
            <div className="sr-only" role="status">
              Refreshing activity history
            </div>
          ) : null}

          {isLoadingActivityLogs ? (
            <ActivityLogListSkeleton />
          ) : sortedActivityLogs.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(10rem,0.65fr)_minmax(10rem,0.75fr)_minmax(9rem,0.55fr)_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
                  <span>Activity</span>
                  <span>Actor</span>
                  <span>Target</span>
                  <span>Time</span>
                  <span className="text-right">Action</span>
                </div>
                <ul className="divide-y divide-border">
                  {paginatedActivityLogs.map((activityLog) => (
                    <li
                      className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(10rem,0.65fr)_minmax(10rem,0.75fr)_minmax(9rem,0.55fr)_auto] lg:items-center"
                      key={activityLog.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {formatActionLabel(activityLog.actionType)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {activityLog.description ?? "No description"}
                        </p>
                        {activityLog.oldStatusName ||
                        activityLog.newStatusName ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {activityLog.oldStatusName ?? "None"} {"->"}{" "}
                            {activityLog.newStatusName ?? "None"}
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {getActorLabel(activityLog)}
                        </p>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <TargetPill
                          targetEntityType={activityLog.targetEntityType}
                        />
                        <p className="truncate text-xs text-muted-foreground">
                          {getTargetLabel(activityLog)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm">
                          {formatDateTime(activityLog.createdAt)}
                        </p>
                      </div>

                      <div className="lg:justify-self-end">
                        <Button
                          onClick={() => setSelectedActivityLog(activityLog)}
                          type="button"
                          variant="outline"
                        >
                          View details
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {visibleActivityLogStart}-{visibleActivityLogEnd} of{" "}
                    {sortedActivityLogs.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={currentActivityLogsPage === 1}
                      onClick={() =>
                        goToActivityLogsPage(currentActivityLogsPage - 1)
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center">
                      Page {currentActivityLogsPage} of {totalPages}
                    </span>
                    <Button
                      disabled={currentActivityLogsPage === totalPages}
                      onClick={() =>
                        goToActivityLogsPage(currentActivityLogsPage + 1)
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
                activityLogs.length === 0
                  ? "Audit events will appear here after users interact with the system."
                  : "Try a different search term, target, action, or date filter."
              }
              title={
                activityLogs.length === 0
                  ? "No activity recorded"
                  : "No matches"
              }
            />
          )}
        </CardContent>
      </Card>

      {selectedActivityLog ? (
        <ActivityLogDetailsSheet
          activityLog={selectedActivityLog}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedActivityLog(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}

export default AdminActivityLogsPage;