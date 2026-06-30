import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError } from '@/shared/services/api-error-normalizer';

export type AdminDocumentType = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type CreateAdminDocumentTypeRequest = {
  name: string;
  description?: string;
};

export type UpdateAdminDocumentTypeRequest = {
  name: string;
  description?: string;
};

@Injectable({ providedIn: 'root' })
export class AdminDocumentTypesService {
  private readonly http = inject(HttpClient);

  async getDocumentTypes(): Promise<AdminDocumentType[]> {
    try {
      return await firstValueFrom(
        this.http.get<AdminDocumentType[]>('/api/admin/document-types'),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getDocumentType(documentTypeId: number): Promise<AdminDocumentType> {
    try {
      return await firstValueFrom(
        this.http.get<AdminDocumentType>(
          `/api/admin/document-types/${encodeURIComponent(String(documentTypeId))}`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async createDocumentType(
    data: CreateAdminDocumentTypeRequest,
  ): Promise<AdminDocumentType> {
    try {
      return await firstValueFrom(
        this.http.post<AdminDocumentType>('/api/admin/document-types', data),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async updateDocumentType(
    documentTypeId: number,
    data: UpdateAdminDocumentTypeRequest,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(
          `/api/admin/document-types/${encodeURIComponent(String(documentTypeId))}`,
          data,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async setDocumentTypeActive(
    documentTypeId: number,
    isActive: boolean,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch(
          `/api/admin/document-types/${encodeURIComponent(String(documentTypeId))}/${isActive ? 'enable' : 'disable'}`,
          null,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
}
