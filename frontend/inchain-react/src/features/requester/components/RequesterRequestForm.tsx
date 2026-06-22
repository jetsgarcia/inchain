import { useMemo, useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAttachmentFileName,
  type RequestDocumentType,
  type RequesterDocumentRequestDetail,
  type RequesterDocumentRequestFormData,
} from "@/features/documentRequests/documentRequestsApi";
import { cn } from "@/lib/utils";

export type RequesterRequestFormValues = RequesterDocumentRequestFormData;

type RequesterRequestFormProps = {
  cancelLabel?: string;
  documentTypes: RequestDocumentType[];
  formError?: string | null;
  initialRequest?: RequesterDocumentRequestDetail;
  isSubmitting: boolean;
  onCancel?: () => void;
  onSubmit: (values: RequesterRequestFormValues) => void;
  submitLabel: string;
  submittingLabel: string;
};

type FormErrors = Partial<Record<"attachment" | "description" | "documentTypeId" | "title", string>>;

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function findInitialDocumentTypeId(
  documentTypes: RequestDocumentType[],
  initialRequest?: RequesterDocumentRequestDetail,
) {
  if (initialRequest?.documentTypeId) {
    return String(initialRequest.documentTypeId);
  }

  const matchingDocumentType = documentTypes.find(
    (documentType) => documentType.name === initialRequest?.documentTypeName,
  );

  return matchingDocumentType ? String(matchingDocumentType.id) : "";
}

function validateForm({
  attachment,
  description,
  documentTypeId,
  hasExistingAttachment,
  title,
}: {
  attachment: File | null;
  description: string;
  documentTypeId: number;
  hasExistingAttachment: boolean;
  title: string;
}) {
  const errors: FormErrors = {};

  if (!title.trim()) {
    errors.title = "Title is required.";
  }

  if (!description.trim()) {
    errors.description = "Description is required.";
  }

  if (!documentTypeId) {
    errors.documentTypeId = "Select a document type.";
  }

  if (!attachment && !hasExistingAttachment) {
    errors.attachment = "Attachment is required.";
  } else if (attachment) {
    if (attachment.size === 0) {
      errors.attachment = "Attachment cannot be empty.";
    } else if (attachment.size > MAX_ATTACHMENT_BYTES) {
      errors.attachment = "Attachment must be 20 MB or smaller.";
    }
  }

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function RequesterRequestForm({
  cancelLabel = "Cancel",
  documentTypes,
  formError,
  initialRequest,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel,
}: RequesterRequestFormProps) {
  const activeDocumentTypes = useMemo(
    () =>
      documentTypes
        .filter((documentType) => documentType.isActive)
        .toSorted((first, second) => first.name.localeCompare(second.name)),
    [documentTypes],
  );
  const [title, setTitle] = useState(() => initialRequest?.title ?? "");
  const [description, setDescription] = useState(
    () => initialRequest?.description ?? "",
  );
  const [documentTypeId, setDocumentTypeId] = useState(() =>
    findInitialDocumentTypeId(activeDocumentTypes, initialRequest),
  );
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const existingAttachment = initialRequest?.attachment ?? null;
  const selectedDocumentTypeId = Number(documentTypeId);
  const hasExistingAttachment = Boolean(existingAttachment);
  const hasDocumentTypes = activeDocumentTypes.length > 0;

  function clearFieldError(fieldName: keyof FormErrors) {
    setErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateForm({
      attachment,
      description,
      documentTypeId: selectedDocumentTypeId,
      hasExistingAttachment,
      title,
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      documentTypeId: selectedDocumentTypeId,
      attachment,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to save request</AlertTitle>
          <AlertDescription className="whitespace-pre-line">
            {formError}
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasDocumentTypes ? (
        <Alert>
          <AlertTitle>No active document types</AlertTitle>
          <AlertDescription>
            Ask an admin to enable a document type before creating requests.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="request-title">Title</Label>
        <Input
          aria-invalid={Boolean(errors.title)}
          disabled={isSubmitting}
          id="request-title"
          onChange={(event) => {
            setTitle(event.target.value);
            clearFieldError("title");
          }}
          placeholder="Purchase Order ABC"
          value={title}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-description">Description</Label>
        <textarea
          aria-invalid={Boolean(errors.description)}
          className={cn(
            "min-h-28 w-full resize-none rounded-2xl border border-transparent bg-input/50 px-2.5 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          )}
          disabled={isSubmitting}
          id="request-description"
          onChange={(event) => {
            setDescription(event.target.value);
            clearFieldError("description");
          }}
          placeholder="Explain what needs approval."
          value={description}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-document-type">Document type</Label>
        <select
          aria-invalid={Boolean(errors.documentTypeId)}
          className={cn(
            "h-10 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          )}
          disabled={isSubmitting || !hasDocumentTypes}
          id="request-document-type"
          onChange={(event) => {
            setDocumentTypeId(event.target.value);
            clearFieldError("documentTypeId");
          }}
          value={documentTypeId}
        >
          <option value="">
            {hasDocumentTypes ? "Select document type" : "No active document types"}
          </option>
          {activeDocumentTypes.map((documentType) => (
            <option key={documentType.id} value={documentType.id}>
              {documentType.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.documentTypeId} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-attachment">
          {hasExistingAttachment ? "Replace attachment" : "Attachment"}
        </Label>
        {existingAttachment ? (
          <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">Current attachment</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {getAttachmentFileName(existingAttachment)} - {formatFileSize(existingAttachment.fileSize)}
            </p>
          </div>
        ) : null}
        <Input
          aria-invalid={Boolean(errors.attachment)}
          disabled={isSubmitting}
          id="request-attachment"
          onChange={(event) => {
            setAttachment(event.target.files?.[0] ?? null);
            clearFieldError("attachment");
          }}
          type="file"
        />
        <p className="text-xs text-muted-foreground">
          Maximum upload size is 20 MB.
          {hasExistingAttachment ? " Leave empty to keep the current attachment." : ""}
        </p>
        {attachment ? (
          <p className="text-xs text-muted-foreground">
            Selected: {attachment.name} - {formatFileSize(attachment.size)}
          </p>
        ) : null}
        <FieldError message={errors.attachment} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button disabled={isSubmitting || !hasDocumentTypes} type="submit">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default RequesterRequestForm;
