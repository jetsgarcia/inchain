import {
  Component,
  inject,
  signal,
  computed,
  type OnInit,
  type ElementRef,
  viewChild,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideSave,
  lucideSend,
  lucideUpload,
  lucideX,
  lucideAlertTriangle,
} from '@ng-icons/lucide';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  DocumentRequestsService,
  type RequestDocumentType,
  type RequesterDocumentRequestFormData,
  type RequesterDocumentRequestDetail,
} from '@/features/document-requests/document-requests.service';
import type { ApiError } from '@/shared/models/api-error.types';

const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Component({
  selector: 'app-request-form',
  imports: [RouterLink, FormsModule, NgIcon, SkeletonComponent],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideSave,
      lucideSend,
      lucideUpload,
      lucideX,
      lucideAlertTriangle,
    }),
  ],
  templateUrl: './request-form.component.html',
})
export class RequestFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentRequestsService = inject(DocumentRequestsService);

  protected readonly fileInputRef =
    viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly isEdit = computed(() => this.requestId() !== null);
  readonly pageTitle = computed(() =>
    this.isEdit() ? 'Edit request' : 'New request',
  );

  // Form state
  readonly requestId = signal<number | null>(null);
  readonly title = signal('');
  readonly description = signal('');
  readonly documentTypeId = signal<number | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly currentFileName = signal<string | null>(null);

  // UI state
  readonly isLoading = signal(false);
  readonly isInitialLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly validationErrors = signal<string[]>([]);
  readonly documentTypes = signal<RequestDocumentType[]>([]);
  readonly titleTouched = signal(false);
  readonly descriptionTouched = signal(false);
  readonly documentTypeTouched = signal(false);

  readonly isProcessing = signal(false);

  private readonly existingAttachment = signal(false);

  readonly allowedExtensions = ALLOWED_FILE_EXTENSIONS.join(', ');
  readonly maxFileSizeMb = MAX_FILE_SIZE / (1024 * 1024);
  readonly needsFile = computed(
    () => !this.isEdit() || !this.existingAttachment(),
  );

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    const requestId = idParam && !Number.isNaN(Number(idParam))
      ? Number(idParam)
      : null;
    this.requestId.set(requestId);

    await this.loadDocumentTypes();
    if (requestId !== null) {
      await this.loadExistingRequest(requestId);
    }
  }

  protected get titleError(): string | null {
    if (!this.titleTouched()) return null;
    const value = this.title().trim();
    if (!value) return 'Title is required.';
    if (value.length < 3) return 'Title must be at least 3 characters.';
    return null;
  }

  protected get descriptionError(): string | null {
    if (!this.descriptionTouched()) return null;
    if (!this.description().trim()) return 'Description is required.';
    return null;
  }

  protected get documentTypeError(): string | null {
    if (!this.documentTypeTouched()) return null;
    if (this.documentTypeId() === null) return 'Document type is required.';
    return null;
  }

  protected get fileError(): string | null {
    const file = this.selectedFile();
    if (!file) return null;
    const name = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) =>
      name.endsWith(ext),
    );
    if (!hasValidExtension)
      return 'File type is not allowed.';
    if (file.size > MAX_FILE_SIZE)
      return `File size exceeds ${this.maxFileSizeMb} MB limit.`;
    return null;
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
  }

  protected clearFile(): void {
    this.selectedFile.set(null);
    this.currentFileName.set(null);
    const input = this.fileInputRef();
    if (input?.nativeElement) {
      input.nativeElement.value = '';
    }
  }

  protected async onSubmit(submitAfter: boolean): Promise<void> {
    this.titleTouched.set(true);
    this.descriptionTouched.set(true);
    this.documentTypeTouched.set(true);

    // Validate
    const errors: string[] = [];
    if (this.titleError) errors.push(this.titleError);
    if (this.descriptionError) errors.push(this.descriptionError);
    if (this.documentTypeError) errors.push(this.documentTypeError);
    if (
      this.needsFile() &&
      !this.selectedFile() &&
      !this.currentFileName()
    ) {
      errors.push('A file attachment is required.');
    }
    if (this.fileError) errors.push(this.fileError);

    if (errors.length > 0) {
      this.validationErrors.set(errors);
      return;
    }

    const formData: RequesterDocumentRequestFormData = {
      title: this.title().trim(),
      description: this.description().trim(),
      documentTypeId: this.documentTypeId()!,
      attachment: this.selectedFile(),
    };

    this.isProcessing.set(true);
    this.error.set(null);
    this.validationErrors.set([]);

    try {
      const requestId = this.requestId();
      let result: RequesterDocumentRequestDetail;

      if (requestId !== null) {
        result =
          await this.documentRequestsService.updateRequesterDocumentRequest(
            requestId,
            formData,
          );

        if (submitAfter) {
          result =
            await this.documentRequestsService.submitRequesterDocumentRequest(
              result.id,
            );
        }
      } else {
        result =
          await this.documentRequestsService.createRequesterDocumentRequest(
            formData,
          );

        if (submitAfter) {
          result =
            await this.documentRequestsService.submitRequesterDocumentRequest(
              result.id,
            );
        }
      }

      void this.router.navigate(['/requests', result.id]);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.validationErrors) {
        const allErrors: string[] = [];
        for (const [, messages] of Object.entries(
          apiError.validationErrors,
        )) {
          allErrors.push(...messages);
        }
        this.validationErrors.set(allErrors);
      } else {
        this.error.set(
          apiError.message ?? 'Something went wrong. Please try again.',
        );
      }
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async loadDocumentTypes(): Promise<void> {
    try {
      const types =
        await this.documentRequestsService.getRequestDocumentTypes();
      this.documentTypes.set(types.filter((t) => t.isActive));
    } catch {
      // Non-critical — the dropdown will just be empty.
    }
  }

  private async loadExistingRequest(id: number): Promise<void> {
    this.isInitialLoading.set(true);
    try {
      const request =
        await this.documentRequestsService.getRequesterDocumentRequest(id);
      this.title.set(request.title);
      this.description.set(request.description ?? '');

      const types = this.documentTypes();
      const matchedType = types.find(
        (t) => t.name === request.documentTypeName,
      );
      this.documentTypeId.set(matchedType?.id ?? null);

      this.currentFileName.set(
        request.attachment
          ? (request.attachment.originalFileName ??
              request.attachment.fileName ??
              null)
          : null,
      );
      this.existingAttachment.set(request.attachment != null);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(
        apiError.message ?? 'Unable to load request for editing.',
      );
    } finally {
      this.isInitialLoading.set(false);
    }
  }
}
