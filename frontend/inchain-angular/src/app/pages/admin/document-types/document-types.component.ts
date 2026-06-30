import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideRefreshCw,
  lucideSearch,
  lucidePlus,
  lucidePencil,
  lucidePower,
  lucidePowerOff,
  lucideAlertTriangle,
  lucideX,
} from '@ng-icons/lucide';
import { StatusBadgeComponent } from '@/shared/components/status-badge.component';
import { EmptyStateComponent } from '@/shared/components/empty-state.component';
import { SkeletonComponent } from '@/shared/components/skeleton.component';
import {
  AdminDocumentTypesService,
  type AdminDocumentType,
} from '@/features/admin/admin-document-types.service';
import type { ApiError } from '@/shared/models/api-error.types';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const PAGE_SIZE = 5;

type FormMode = { mode: 'create' } | { mode: 'edit'; documentType: AdminDocumentType };

@Component({
  selector: 'app-admin-document-types',
  imports: [FormsModule, NgIcon, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent],
  providers: [
    provideIcons({
      lucideRefreshCw,
      lucideSearch,
      lucidePlus,
      lucidePencil,
      lucidePower,
      lucidePowerOff,
      lucideAlertTriangle,
      lucideX,
    }),
  ],
  templateUrl: './document-types.component.html',
})
export class AdminDocumentTypesComponent {
  private readonly service = inject(AdminDocumentTypesService);

  readonly documentTypes = signal<AdminDocumentType[]>([]);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);

  readonly activeForm = signal<FormMode | null>(null);
  readonly formName = signal('');
  readonly formDescription = signal('');
  readonly formError = signal<string | null>(null);
  readonly formValidationErrors = signal<string[]>([]);
  readonly isSubmittingForm = signal(false);
  readonly nameTouched = signal(false);

  readonly statusFilters = STATUS_FILTERS;

  readonly filteredDocumentTypes = computed(() => {
    const raw = this.documentTypes();
    const filter = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return raw.filter((dt) => {
      const matchesStatus =
        filter === 'all' ||
        (filter === 'active' && dt.isActive) ||
        (filter === 'inactive' && !dt.isActive);
      const matchesSearch =
        query.length === 0 ||
        dt.name.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredDocumentTypes().length / PAGE_SIZE)),
  );

  readonly paginatedDocumentTypes = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredDocumentTypes().slice(start, start + PAGE_SIZE);
  });

  readonly visibleRange = computed(() => {
    const total = this.filteredDocumentTypes().length;
    if (total === 0) return { start: 0, end: 0 };
    const page = Math.min(this.currentPage(), this.totalPages());
    return {
      start: (page - 1) * PAGE_SIZE + 1,
      end: Math.min(page * PAGE_SIZE, total),
    };
  });

  constructor() {
    this.loadDocumentTypes();
  }

  protected get nameError(): string | null {
    if (!this.nameTouched()) return null;
    const value = this.formName().trim();
    if (!value) return 'Name is required.';
    if (value.length > 100) return 'Name must be 100 characters or fewer.';
    return null;
  }

  protected setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  protected setSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected async refresh(): Promise<void> {
    this.isRefreshing.set(true);
    this.error.set(null);
    try {
      await this.loadDocumentTypes();
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to refresh.');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  protected openCreate(): void {
    this.activeForm.set({ mode: 'create' });
    this.formName.set('');
    this.formDescription.set('');
    this.formError.set(null);
    this.formValidationErrors.set([]);
    this.nameTouched.set(false);
  }

  protected openEdit(documentType: AdminDocumentType): void {
    this.activeForm.set({ mode: 'edit', documentType });
    this.formName.set(documentType.name);
    this.formDescription.set(documentType.description ?? '');
    this.formError.set(null);
    this.formValidationErrors.set([]);
    this.nameTouched.set(false);
  }

  protected closeForm(): void {
    if (this.isSubmittingForm()) return;
    this.activeForm.set(null);
  }

  protected async submitForm(): Promise<void> {
    this.nameTouched.set(true);

    const localErrors: string[] = [];
    if (this.nameError) localErrors.push(this.nameError);

    if (localErrors.length > 0) {
      this.formValidationErrors.set(localErrors);
      return;
    }

    const form = this.activeForm();
    if (!form) return;

    this.isSubmittingForm.set(true);
    this.formError.set(null);
    this.formValidationErrors.set([]);

    const data = {
      name: this.formName().trim(),
      description: this.formDescription().trim() || undefined,
    };

    try {
      if (form.mode === 'create') {
        const created = await this.service.createDocumentType(data);
        this.documentTypes.update((current) => [...current, created]);
      } else {
        await this.service.updateDocumentType(form.documentType.id, data);
        this.documentTypes.update((current) =>
          current.map((dt) =>
            dt.id === form.documentType.id
              ? { ...dt, name: data.name, description: data.description ?? dt.description }
              : dt,
          ),
        );
      }
      this.activeForm.set(null);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.validationErrors) {
        const allErrors: string[] = [];
        for (const [, messages] of Object.entries(apiError.validationErrors)) {
          allErrors.push(...messages);
        }
        this.formValidationErrors.set(allErrors);
      } else {
        this.formError.set(
          apiError.message ?? 'Something went wrong.',
        );
      }
    } finally {
      this.isSubmittingForm.set(false);
    }
  }

  protected async toggleActive(documentType: AdminDocumentType): Promise<void> {
    this.isSubmittingForm.set(true);
    this.error.set(null);
    try {
      await this.service.setDocumentTypeActive(
        documentType.id,
        !documentType.isActive,
      );
      this.documentTypes.update((current) =>
        current.map((dt) =>
          dt.id === documentType.id ? { ...dt, isActive: !dt.isActive } : dt,
        ),
      );
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(
        apiError.message ?? 'Unable to update document type.',
      );
    } finally {
      this.isSubmittingForm.set(false);
    }
  }

  private async loadDocumentTypes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.service.getDocumentTypes();
      this.documentTypes.set(data);
    } catch (err) {
      const apiError = err as ApiError;
      this.error.set(apiError.message ?? 'Unable to load document types.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
