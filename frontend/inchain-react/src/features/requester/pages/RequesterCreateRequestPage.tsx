import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
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
import {
  createRequesterDocumentRequest,
  getRequestDocumentTypes,
  type RequestDocumentType,
} from "@/features/documentRequests/documentRequestsApi";
import RequesterRequestForm, {
  type RequesterRequestFormValues,
} from "@/features/requester/components/RequesterRequestForm";
import { isApiError } from "@/lib/api/apiError";
import { paths } from "@/routes/paths";
import { toast } from "sonner";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function RequestFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function RequesterCreateRequestPage() {
  const navigate = useNavigate();
  const [documentTypes, setDocumentTypes] = useState<RequestDocumentType[]>([]);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(true);
  const [documentTypesError, setDocumentTypesError] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocumentTypes() {
      setIsLoadingDocumentTypes(true);
      setDocumentTypesError(null);

      try {
        const nextDocumentTypes = await getRequestDocumentTypes(
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        setDocumentTypes(nextDocumentTypes);
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

  const activeDocumentTypeCount = useMemo(
    () => documentTypes.filter((documentType) => documentType.isActive).length,
    [documentTypes],
  );

  async function handleSubmit(values: RequesterRequestFormValues) {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await createRequesterDocumentRequest(values);
      toast.success("Draft request was saved.");
      navigate(paths.requests);
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, "Unable to save draft request."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Create request</CardTitle>
          <CardDescription>
            Save a draft with a title, description, document type, and attachment.
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link to={paths.requests}>
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                My requests
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {documentTypesError ? (
            <Alert className="mb-4" variant="destructive">
              <AlertTitle>Unable to load document types</AlertTitle>
              <AlertDescription>{documentTypesError}</AlertDescription>
            </Alert>
          ) : null}

          {!isLoadingDocumentTypes && !documentTypesError && activeDocumentTypeCount === 0 ? (
            <Alert className="mb-4">
              <AlertTitle>No document types available</AlertTitle>
              <AlertDescription>
                Ask an admin to enable a document type before creating a request.
              </AlertDescription>
            </Alert>
          ) : null}

          {isLoadingDocumentTypes ? (
            <RequestFormSkeleton />
          ) : (
            <RequesterRequestForm
              documentTypes={documentTypes}
              formError={formError}
              isSubmitting={isSubmitting}
              onCancel={() => navigate(paths.requests)}
              onSubmit={(values) => void handleSubmit(values)}
              submitLabel="Save as draft"
              submittingLabel="Saving..."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default RequesterCreateRequestPage;
