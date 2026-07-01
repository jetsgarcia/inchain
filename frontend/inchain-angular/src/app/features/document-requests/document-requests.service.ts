import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { normalizeApiError } from '@/shared/services/api-error-normalizer';

export type DocumentRequestStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | (string & {});

export type RequestDocumentType = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type AttachmentMetadata = {
  id: number;
  originalFileName?: string | null;
  fileName?: string | null;
  contentType: string | null;
  fileSize: number;
  uploadedAt: string;
};

export type RequesterDocumentRequestListItem = {
  id: number;
  requestNumber: string;
  title: string;
  documentTypeName: string;
  statusName: DocumentRequestStatus;
  createdAt: string;
  submittedAt: string | null;
};

export type RequesterDocumentRequestDetail =
  RequesterDocumentRequestListItem & {
    description: string;
    documentTypeId?: number | null;
    updatedAt: string | null;
    attachment: AttachmentMetadata | null;
  };

export type DocumentRequestActivity = {
  id: number;
  actionType: string;
  actorNameOrEmail: string | null;
  createdAt: string;
  description: string | null;
  oldStatusName: DocumentRequestStatus | null;
  newStatusName: DocumentRequestStatus | null;
  remarks: string | null;
};

export type RequesterDocumentRequestFormData = {
  title: string;
  description: string;
  documentTypeId: number;
  attachment?: File | null;
};

export type ApproverDocumentRequestListItem = {
  id: number;
  requestNumber: string;
  title: string;
  requesterName: string;
  requesterEmail: string | null;
  documentTypeName: string;
  statusName: DocumentRequestStatus;
  submittedAt: string | null;
  createdAt: string;
};

export type ApproverDocumentRequestDetail =
  ApproverDocumentRequestListItem & {
    description: string;
    attachment: AttachmentMetadata | null;
  };

export type DownloadedAttachment = {
  blob: Blob;
  fileName: string;
};

function buildFormData(data: RequesterDocumentRequestFormData): FormData {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('documentTypeId', String(data.documentTypeId));
  if (data.attachment) {
    formData.append('attachment', data.attachment);
  }
  return formData;
}

@Injectable({ providedIn: 'root' })
export class DocumentRequestsService {
  private readonly http = inject(HttpClient);

  async getRequestDocumentTypes(): Promise<RequestDocumentType[]> {
    try {
      return await firstValueFrom(
        this.http.get<RequestDocumentType[]>('/api/document-types'),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getRequesterDocumentRequests(): Promise<
    RequesterDocumentRequestListItem[]
  > {
    try {
      return await firstValueFrom(
        this.http.get<RequesterDocumentRequestListItem[]>(
          '/api/document-requests',
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getRequesterDocumentRequest(
    documentRequestId: number,
  ): Promise<RequesterDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.get<RequesterDocumentRequestDetail>(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async createRequesterDocumentRequest(
    data: RequesterDocumentRequestFormData,
  ): Promise<RequesterDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.post<RequesterDocumentRequestDetail>(
          '/api/document-requests',
          buildFormData(data),
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async updateRequesterDocumentRequest(
    documentRequestId: number,
    data: RequesterDocumentRequestFormData,
  ): Promise<RequesterDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.put<RequesterDocumentRequestDetail>(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}`,
          buildFormData(data),
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async submitRequesterDocumentRequest(
    documentRequestId: number,
  ): Promise<RequesterDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.post<RequesterDocumentRequestDetail>(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}/submit`,
          null,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async cancelRequesterDocumentRequest(
    documentRequestId: number,
  ): Promise<RequesterDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.post<RequesterDocumentRequestDetail>(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}/cancel`,
          null,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async deleteRequesterDocumentRequest(
    documentRequestId: number,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getDocumentRequestActivities(
    documentRequestId: number,
  ): Promise<DocumentRequestActivity[]> {
    try {
      return await firstValueFrom(
        this.http.get<DocumentRequestActivity[]>(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}/activities`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async downloadDocumentRequestAttachment(
    documentRequestId: number,
  ): Promise<DownloadedAttachment> {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `/api/document-requests/${encodeURIComponent(String(documentRequestId))}/attachment`,
          { responseType: 'blob', observe: 'response' },
        ),
      );

      const disposition = response.headers.get('content-disposition');
      const fileName =
        getFileNameFromContentDisposition(disposition) ??
        `document-request-${documentRequestId}-attachment`;

      return { blob: response.body as Blob, fileName };
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getApproverDocumentRequests(): Promise<
    ApproverDocumentRequestListItem[]
  > {
    try {
      return await firstValueFrom(
        this.http.get<ApproverDocumentRequestListItem[]>(
          '/api/approver/document-requests',
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async getApproverDocumentRequest(
    documentRequestId: number,
  ): Promise<ApproverDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.get<ApproverDocumentRequestDetail>(
          `/api/approver/document-requests/${encodeURIComponent(String(documentRequestId))}`,
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async approveApproverDocumentRequest(
    documentRequestId: number,
    remarks?: string,
  ): Promise<ApproverDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.post<ApproverDocumentRequestDetail>(
          `/api/approver/document-requests/${encodeURIComponent(String(documentRequestId))}/approve`,
          { remarks: remarks?.trim() || null },
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }

  async rejectApproverDocumentRequest(
    documentRequestId: number,
    remarks: string,
  ): Promise<ApproverDocumentRequestDetail> {
    try {
      return await firstValueFrom(
        this.http.post<ApproverDocumentRequestDetail>(
          `/api/approver/document-requests/${encodeURIComponent(String(documentRequestId))}/reject`,
          { remarks: remarks.trim() },
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  }
}

function getFileNameFromContentDisposition(
  value: string | null,
): string | null {
  if (!value) return null;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''));
  }

  const fileNameMatch = /filename="?([^";]+)"?/i.exec(value);
  return fileNameMatch?.[1]?.trim() ?? null;
}

export function getAttachmentFileName(
  attachment: AttachmentMetadata,
): string {
  return attachment.originalFileName ?? attachment.fileName ?? 'Attachment';
}
