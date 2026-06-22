import { useEffect, useMemo, useState } from "react";
import { RefreshCwIcon, SearchIcon } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDocumentRequestActivities,
  getRequesterDocumentRequests,
  type DocumentRequestActivity,
  type RequesterDocumentRequestListItem,
} from "@/features/documentRequests/documentRequestsApi";
import { isApiError } from "@/lib/api/apiError";

type ActivityEntry = DocumentRequestActivity & {
  requestId: number;
  requestNumber: string;
  requestTitle: string;
};

const ACTIVITY_PAGE_SIZE = 10;

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) return error.message;
  return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateTimeFormatter.format(date);
}

function getActionLabel(actionType: string) {
  return (
    actionType
      .replaceAll(/[_-]+/g, " ")
      .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
      .trim() || "Activity recorded"
  );
}

function getStatusLabel(status: string | null) {
  return status === "PendingApproval" ? "Pending approval" : status;
}

function ActivityListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="rounded-2xl border border-border px-4 py-3" key={index}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
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

function buildActivityEntries(
  requests: RequesterDocumentRequestListItem[],
  activityResults: PromiseSettledResult<DocumentRequestActivity[]>[],
) {
  return activityResults
    .flatMap((result, index) => {
      if (result.status !== "fulfilled") return [];
      const request = requests[index];
      return result.value.map((activity) => ({
        ...activity,
        requestId: request.id,
        requestNumber: request.requestNumber,
        requestTitle: request.title,
      }));
    })
    .toSorted((first, second) => {
      const firstTime = new Date(first.createdAt).getTime();
      const secondTime = new Date(second.createdAt).getTime();
      return (Number.isNaN(secondTime) ? 0 : secondTime) - (Number.isNaN(firstTime) ? 0 : firstTime);
    });
}
function RequesterActivityHistoryPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isRefreshingActivities, setIsRefreshingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadActivities(signal?: AbortSignal) {
    const requesterRequests = await getRequesterDocumentRequests(signal);
    const activityResults = await Promise.allSettled(
      requesterRequests.map((request) => getDocumentRequestActivities(request.id, signal)),
    );

    if (signal?.aborted) return;
    setActivities(buildActivityEntries(requesterRequests, activityResults));
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialActivities() {
      setIsLoadingActivities(true);
      setActivitiesError(null);

      try {
        await loadActivities(controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) {
          setActivitiesError(getApiErrorMessage(error, "Unable to load activity history."));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingActivities(false);
      }
    }

    void loadInitialActivities();
    return () => controller.abort();
  }, []);

  const actionOptions = useMemo(
    () => Array.from(new Set(activities.map((activity) => activity.actionType))).toSorted(),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesAction = actionFilter === "all" || activity.actionType === actionFilter;
      const matchesSearch =
        query.length === 0 ||
        [
          activity.requestNumber,
          activity.requestTitle,
          activity.actionType,
          activity.actorNameOrEmail,
          activity.description,
          activity.remarks,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesAction && matchesSearch;
    });
  }, [actionFilter, activities, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ACTIVITY_PAGE_SIZE));
  const currentActivityPage = Math.min(currentPage, totalPages);
  const paginatedActivities = useMemo(() => {
    const pageStart = (currentActivityPage - 1) * ACTIVITY_PAGE_SIZE;
    return filteredActivities.slice(pageStart, pageStart + ACTIVITY_PAGE_SIZE);
  }, [currentActivityPage, filteredActivities]);
  const visibleActivityStart = filteredActivities.length === 0 ? 0 : (currentActivityPage - 1) * ACTIVITY_PAGE_SIZE + 1;
  const visibleActivityEnd = Math.min(currentActivityPage * ACTIVITY_PAGE_SIZE, filteredActivities.length);

  async function refreshActivities() {
    setIsRefreshingActivities(true);
    setActivitiesError(null);

    try {
      await loadActivities();
    } catch (error) {
      setActivitiesError(getApiErrorMessage(error, "Unable to refresh activity history."));
    } finally {
      setIsRefreshingActivities(false);
    }
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleActionFilterChange(value: string) {
    setActionFilter(value);
    setCurrentPage(1);
  }

  return (
    <section className="space-y-5">
      {activitiesError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load activity history</AlertTitle>
          <AlertDescription>{activitiesError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Activity history</CardTitle>
          <CardDescription>Review status changes and request updates across your documents.</CardDescription>
          <CardAction>
            <Button disabled={isRefreshingActivities} onClick={() => void refreshActivities()} type="button" variant="outline">
              <RefreshCwIcon aria-hidden="true" className="size-4" />
              {isRefreshingActivities ? "Refreshing..." : "Refresh"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative min-w-0">
              <span className="sr-only">Search activity history</span>
              <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(event) => handleSearchQueryChange(event.target.value)}
                placeholder="Search by request, action, actor, or notes"
                value={searchQuery}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleActionFilterChange("all")} type="button" variant={actionFilter === "all" ? "default" : "outline"}>
                All actions
              </Button>
              {actionOptions.map((actionType) => (
                <Button
                  key={actionType}
                  onClick={() => handleActionFilterChange(actionType)}
                  type="button"
                  variant={actionFilter === actionType ? "default" : "outline"}
                >
                  {getActionLabel(actionType)}
                </Button>
              ))}
            </div>
          </div>

          {isRefreshingActivities ? <div className="sr-only" role="status">Refreshing activity history</div> : null}

          {isLoadingActivities ? (
            <ActivityListSkeleton />
          ) : paginatedActivities.length > 0 ? (
            <div className="space-y-3">
              <ol className="space-y-3">
                {paginatedActivities.map((activity) => (
                  <li className="rounded-2xl border border-border px-4 py-3" key={`${activity.requestId}-${activity.id}`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {getActionLabel(activity.actionType)}
                          </span>
                          {activity.newStatusName ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {getStatusLabel(activity.newStatusName)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-medium">{activity.requestTitle}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {activity.requestNumber} - {activity.actorNameOrEmail ?? "System"}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
                    </div>
                    {activity.description ? <p className="mt-2 text-sm text-muted-foreground">{activity.description}</p> : null}
                    {activity.oldStatusName || activity.newStatusName ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {getStatusLabel(activity.oldStatusName) ?? "None"} to {getStatusLabel(activity.newStatusName) ?? "None"}
                      </p>
                    ) : null}
                    {activity.remarks ? <div className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm">{activity.remarks}</div> : null}
                  </li>
                ))}
              </ol>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>Showing {visibleActivityStart}-{visibleActivityEnd} of {filteredActivities.length}</p>
                  <div className="flex items-center gap-2">
                    <Button disabled={currentActivityPage === 1} onClick={() => setCurrentPage(currentActivityPage - 1)} size="sm" type="button" variant="outline">Previous</Button>
                    <span className="min-w-20 text-center">Page {currentActivityPage} of {totalPages}</span>
                    <Button disabled={currentActivityPage === totalPages} onClick={() => setCurrentPage(currentActivityPage + 1)} size="sm" type="button" variant="outline">Next</Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              description={activities.length === 0 ? "Request activity will appear after you create or update a request." : "Try a different search term or action filter."}
              title={activities.length === 0 ? "No activity yet" : "No matches"}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default RequesterActivityHistoryPage;
