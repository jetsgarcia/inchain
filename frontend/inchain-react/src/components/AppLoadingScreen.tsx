import { LoaderCircleIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function AppLoadingScreen() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="grid min-h-svh md:grid-cols-[18rem_1fr]">
        <aside className="hidden border-r border-border bg-sidebar px-5 py-6 md:block">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              IC
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-sidebar-foreground">
                Inchain
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                Approval workspace
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Skeleton className="h-4 w-24 bg-sidebar-accent" />
            {Array.from({ length: 5 }, (_, index) => (
              <div className="flex items-center gap-3" key={index}>
                <Skeleton className="size-8 rounded-lg bg-sidebar-accent" />
                <Skeleton className="h-4 w-32 bg-sidebar-accent" />
              </div>
            ))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
            <Skeleton className="size-8 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="size-9 rounded-full" />
          </header>

          <section className="grid flex-1 place-items-center px-4 py-10">
            <div
              aria-live="polite"
              className="flex w-full max-w-sm flex-col items-center text-center"
              role="status"
            >
              <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
                <LoaderCircleIcon
                  aria-hidden="true"
                  className="relative size-7 animate-spin"
                />
              </div>
              <h1 className="text-base font-semibold">Loading workspace</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Preparing your workspace.
              </p>
              <div className="mt-6 w-full space-y-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AppLoadingScreen;