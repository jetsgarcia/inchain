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
  createAdminDocumentType,
  getAdminDocumentTypes,
  setAdminDocumentTypeActive,
  updateAdminDocumentType,
  type AdminDocumentType,
} from "@/features/admin/adminDocumentTypesApi";
import { isApiError, type ApiValidationErrors } from "@/lib/api/apiError";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive";

type DocumentTypeFormMode = "create" | "edit";

type DocumentTypeFormState = {
  name: string;
  description: string;
};

type ActiveDocumentTypeForm =
  | { mode: "create" }
  | { mode: "edit"; documentType: AdminDocumentType };

const DOCUMENT_TYPES_PAGE_SIZE = 5;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function normalizeFieldName(field: string) {
  return field.toLowerCase().replaceAll(".", "");
}

function getFieldErrors(
  validationErrors: ApiValidationErrors,
  fieldName: keyof DocumentTypeFormState,
) {
  const normalizedFieldName = normalizeFieldName(fieldName);

  return Object.entries(validationErrors).flatMap(([field, messages]) => {
    const normalizedField = normalizeFieldName(field);
    return normalizedField.endsWith(normalizedFieldName) ? messages : [];
  });
}

function validateDocumentTypeForm(
  form: DocumentTypeFormState,
): ApiValidationErrors {
  const errors: ApiValidationErrors = {};
  const name = form.name.trim();
  const description = form.description.trim();

  if (!name) {
    errors.name = ["Name is required."];
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = [`Name must be ${MAX_NAME_LENGTH} characters or fewer.`];
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = [
      `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
    ];
  }

  return errors;
}

function getDocumentTypeDescription(documentType: AdminDocumentType) {
  return documentType.description?.trim() || "No description";
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

function DocumentTypeStatusPill({ isActive }: { isActive: boolean }) {
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

function DocumentTypeListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          className="grid gap-3 rounded-2xl border border-border px-4 py-3 md:grid-cols-[minmax(0,1fr)_8rem_auto] md:items-center"
          key={index}
        >
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-36" />
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

function DocumentTypeFormSheet({
  documentType,
  mode,
  onDocumentTypeSaved,
  onOpenChange,
}: {
  documentType?: AdminDocumentType;
  mode: DocumentTypeFormMode;
  onDocumentTypeSaved: (documentType: AdminDocumentType) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(() => documentType?.name ?? "");
  const [description, setDescription] = useState(
    () => documentType?.description ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ApiValidationErrors>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameErrors = getFieldErrors(validationErrors, "name");
  const descriptionErrors = getFieldErrors(validationErrors, "description");
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const isEditMode = mode === "edit";
  const hasChanges = documentType
    ? trimmedName !== documentType.name ||
      trimmedDescription !== (documentType.description?.trim() ?? "")
    : trimmedName.length > 0 || trimmedDescription.length > 0;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  }

  function clearFieldError(fieldName: keyof DocumentTypeFormState) {
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

      return Object.keys(nextErrors).length === Object.keys(currentErrors).length
        ? currentErrors
        : nextErrors;
    });
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formValues = { name, description };
    const nextValidationErrors = validateDocumentTypeForm(formValues);

    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      setFormError(null);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors({});

    try {
      if (isEditMode && documentType) {
        await updateAdminDocumentType(documentType.id, {
          name: trimmedName,
          description: trimmedDescription,
        });
        onOpenChange(false);
        onDocumentTypeSaved({
          ...documentType,
          name: trimmedName,
          description: trimmedDescription || null,
        });
      } else {
        const createdDocumentType = await createAdminDocumentType({
          name: trimmedName,
          description: trimmedDescription || undefined,
        });
        onOpenChange(false);
        onDocumentTypeSaved(createdDocumentType);
      }
    } catch (error) {
      if (isApiError(error)) {
        setValidationErrors(error.validationErrors ?? {});
      }

      setFormError(
        getApiErrorMessage(
          error,
          isEditMode
            ? "Unable to update document type."
            : "Unable to create document type.",
        ),
      );
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
              {isEditMode ? "Edit document type" : "Create document type"}
            </SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Update the document type name or description."
                : "Add a new active document type for request classification."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {isEditMode
                    ? "Unable to update document type"
                    : "Unable to create document type"}
                </AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {formError}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="document-type-name">Name</Label>
              <Input
                aria-invalid={nameErrors.length > 0}
                disabled={isSubmitting}
                id="document-type-name"
                maxLength={MAX_NAME_LENGTH}
                onChange={(event) => {
                  setName(event.target.value);
                  clearFieldError("name");
                }}
                placeholder="Purchase Order"
                value={name}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldErrors messages={nameErrors} />
                <p className="ml-auto text-xs text-muted-foreground">
                  {trimmedName.length}/{MAX_NAME_LENGTH}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-type-description">Description</Label>
              <textarea
                aria-invalid={descriptionErrors.length > 0}
                className={cn(
                  "min-h-24 w-full resize-none rounded-2xl border border-transparent bg-input/50 px-2.5 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                )}
                disabled={isSubmitting}
                id="document-type-description"
                maxLength={MAX_DESCRIPTION_LENGTH}
                onChange={(event) => {
                  setDescription(event.target.value);
                  clearFieldError("description");
                }}
                placeholder="Documents for purchase orders"
                value={description}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldErrors messages={descriptionErrors} />
                <p className="ml-auto text-xs text-muted-foreground">
                  {trimmedDescription.length}/{MAX_DESCRIPTION_LENGTH}
                </p>
              </div>
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
            <Button
              disabled={isSubmitting || !trimmedName || !hasChanges}
              type="submit"
            >
              {isSubmitting
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create document type"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AdminDocumentTypesPage() {
  const [documentTypes, setDocumentTypes] = useState<AdminDocumentType[]>([]);
  const [activeForm, setActiveForm] = useState<ActiveDocumentTypeForm | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(true);
  const [documentTypesError, setDocumentTypesError] = useState<string | null>(
    null,
  );
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(
    null,
  );
  const [updatingDocumentTypeId, setUpdatingDocumentTypeId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocumentTypes() {
      setIsLoadingDocumentTypes(true);
      setDocumentTypesError(null);

      try {
        const adminDocumentTypes = await getAdminDocumentTypes(
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setDocumentTypes(adminDocumentTypes);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDocumentTypesError(
          getApiErrorMessage(error, "Unable to load document types."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDocumentTypes(false);
        }
      }
    }

    void loadDocumentTypes();

    return () => {
      controller.abort();
    };
  }, []);

  const documentTypeStats = useMemo(
    () =>
      documentTypes.reduce(
        (stats, documentType) => {
          if (documentType.isActive) {
            stats.active += 1;
          } else {
            stats.inactive += 1;
          }

          return stats;
        },
        { active: 0, inactive: 0 },
      ),
    [documentTypes],
  );

  const statusFilterCounts = useMemo(
    () => ({
      all: documentTypes.length,
      active: documentTypeStats.active,
      inactive: documentTypeStats.inactive,
    }),
    [documentTypeStats.active, documentTypeStats.inactive, documentTypes.length],
  );

  const filteredDocumentTypes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return documentTypes.filter((documentType) => {
      const matchesSearch =
        query.length === 0 ||
        [documentType.name, documentType.description].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && documentType.isActive) ||
        (statusFilter === "inactive" && !documentType.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [documentTypes, searchQuery, statusFilter]);

  const sortedDocumentTypes = useMemo(
    () =>
      filteredDocumentTypes.toSorted((first, second) =>
        first.name.localeCompare(second.name),
      ),
    [filteredDocumentTypes],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedDocumentTypes.length / DOCUMENT_TYPES_PAGE_SIZE),
  );
  const currentDocumentTypesPage = Math.min(currentPage, totalPages);
  const paginatedDocumentTypes = useMemo(() => {
    const pageStart = (currentDocumentTypesPage - 1) * DOCUMENT_TYPES_PAGE_SIZE;
    return sortedDocumentTypes.slice(
      pageStart,
      pageStart + DOCUMENT_TYPES_PAGE_SIZE,
    );
  }, [currentDocumentTypesPage, sortedDocumentTypes]);
  const visibleDocumentTypeStart =
    sortedDocumentTypes.length === 0
      ? 0
      : (currentDocumentTypesPage - 1) * DOCUMENT_TYPES_PAGE_SIZE + 1;
  const visibleDocumentTypeEnd = Math.min(
    currentDocumentTypesPage * DOCUMENT_TYPES_PAGE_SIZE,
    sortedDocumentTypes.length,
  );

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function handleDocumentTypeSaved(savedDocumentType: AdminDocumentType) {
    const didUpdate = documentTypes.some(
      (documentType) => documentType.id === savedDocumentType.id,
    );

    setDocumentTypes((currentDocumentTypes) => {
      const existingDocumentType = currentDocumentTypes.some(
        (documentType) => documentType.id === savedDocumentType.id,
      );

      if (!existingDocumentType) {
        return [savedDocumentType, ...currentDocumentTypes];
      }

      return currentDocumentTypes.map((documentType) =>
        documentType.id === savedDocumentType.id
          ? savedDocumentType
          : documentType,
      );
    });
    setStatusUpdateError(null);
    toast.success(
      `${savedDocumentType.name} was ${didUpdate ? "updated" : "created"}.`,
    );
  }

  async function handleDocumentTypeStatusToggle(
    documentType: AdminDocumentType,
  ) {
    const nextIsActive = !documentType.isActive;

    setUpdatingDocumentTypeId(documentType.id);
    setStatusUpdateError(null);

    try {
      await setAdminDocumentTypeActive(documentType.id, nextIsActive);

      setDocumentTypes((currentDocumentTypes) =>
        currentDocumentTypes.map((currentDocumentType) =>
          currentDocumentType.id === documentType.id
            ? { ...currentDocumentType, isActive: nextIsActive }
            : currentDocumentType,
        ),
      );
      toast.success(
        `${documentType.name} was ${nextIsActive ? "enabled" : "disabled"}.`,
      );
    } catch (error) {
      setStatusUpdateError(
        getApiErrorMessage(
          error,
          `Unable to ${nextIsActive ? "enable" : "disable"} document type.`,
        ),
      );
    } finally {
      setUpdatingDocumentTypeId(null);
    }
  }

  function goToDocumentTypesPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  return (
    <section className="space-y-5">
      {documentTypesError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load document types</AlertTitle>
          <AlertDescription>{documentTypesError}</AlertDescription>
        </Alert>
      ) : null}

      {statusUpdateError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to update document type</AlertTitle>
          <AlertDescription>{statusUpdateError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Document types</CardTitle>
          <CardDescription>
            Search, create, edit, and manage active document types.
          </CardDescription>
          <CardAction>
            <Button
              onClick={() => setActiveForm({ mode: "create" })}
              type="button"
            >
              Create document type
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="min-w-0">
              <span className="sr-only">Search document types</span>
              <Input
                onChange={(event) =>
                  handleSearchQueryChange(event.target.value)
                }
                placeholder="Search by name or description"
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

          {isLoadingDocumentTypes ? (
            <DocumentTypeListSkeleton />
          ) : sortedDocumentTypes.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="hidden grid-cols-[minmax(0,1fr)_8rem_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                  <span>Document type</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <ul className="divide-y divide-border">
                  {paginatedDocumentTypes.map((documentType) => {
                    const nextIsActive = !documentType.isActive;
                    const isUpdating = updatingDocumentTypeId === documentType.id;

                    return (
                      <li
                        className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_8rem_auto] md:items-center"
                        key={documentType.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {documentType.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {getDocumentTypeDescription(documentType)}
                          </p>
                        </div>

                        <div>
                          <DocumentTypeStatusPill
                            isActive={documentType.isActive}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 md:justify-end">
                          <Button
                            disabled={isUpdating}
                            onClick={() =>
                              setActiveForm({ mode: "edit", documentType })
                            }
                            type="button"
                            variant="outline"
                          >
                            Edit
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                disabled={isUpdating}
                                type="button"
                                variant={
                                  documentType.isActive
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {documentType.isActive ? "Disable" : "Enable"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {documentType.isActive
                                    ? "Disable this document type?"
                                    : "Enable this document type?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {documentType.isActive
                                    ? "This document type will no longer be available for new requests. Existing records remain unchanged."
                                    : "This document type will be available for new requests again."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="rounded-2xl bg-muted px-3 py-2 text-sm">
                                <p className="font-medium">{documentType.name}</p>
                                <p className="text-muted-foreground">
                                  {getDocumentTypeDescription(documentType)}
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
                                      void handleDocumentTypeStatusToggle(
                                        documentType,
                                      )
                                    }
                                    type="button"
                                    variant={
                                      nextIsActive ? "default" : "destructive"
                                    }
                                  >
                                    {nextIsActive ? "Enable" : "Disable"}
                                  </Button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {visibleDocumentTypeStart}-{visibleDocumentTypeEnd} of{" "}
                    {sortedDocumentTypes.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={currentDocumentTypesPage === 1}
                      onClick={() =>
                        goToDocumentTypesPage(currentDocumentTypesPage - 1)
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <span className="min-w-20 text-center">
                      Page {currentDocumentTypesPage} of {totalPages}
                    </span>
                    <Button
                      disabled={currentDocumentTypesPage === totalPages}
                      onClick={() =>
                        goToDocumentTypesPage(currentDocumentTypesPage + 1)
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
                documentTypes.length === 0
                  ? "Create a document type to start classifying requests."
                  : "Try a different search term or status filter."
              }
              title={
                documentTypes.length === 0
                  ? "No document types found"
                  : "No matches"
              }
            />
          )}
        </CardContent>
      </Card>

      {activeForm ? (
        <DocumentTypeFormSheet
          documentType={
            activeForm.mode === "edit" ? activeForm.documentType : undefined
          }
          key={
            activeForm.mode === "edit"
              ? `edit-${activeForm.documentType.id}`
              : "create"
          }
          mode={activeForm.mode}
          onDocumentTypeSaved={handleDocumentTypeSaved}
          onOpenChange={(open) => {
            if (!open) {
              setActiveForm(null);
            }
          }}
        />
      ) : null}
    </section>
  );
}

export default AdminDocumentTypesPage;
