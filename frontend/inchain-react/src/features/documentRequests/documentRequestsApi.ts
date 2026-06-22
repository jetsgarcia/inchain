import apiClient from "@/lib/api/apiClient";

export type DocumentRequestStatus =
  | "Draft"
  | "PendingApproval"
  | "Approved"
  | "Rejected"
  | "Cancelled"
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

export type RequesterDocumentRequestDetail = RequesterDocumentRequestListItem & {
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

export type ApproverDocumentRequestDetail = ApproverDocumentRequestListItem & {
  description: string;
  attachment: AttachmentMetadata | null;
};

export type RequesterDocumentRequestFormData = {
  title: string;
  description: string;
  documentTypeId: number;
  attachment?: File | null;
};

export type DownloadedAttachment = {
  blob: Blob;
  fileName: string;
};

function getDocumentRequestPath(documentRequestId: number) {
  return `/api/document-requests/${encodeURIComponent(String(documentRequestId))}`;
}

function getApproverDocumentRequestPath(documentRequestId: number) {
  return `/api/approver/document-requests/${encodeURIComponent(String(documentRequestId))}`;
}

function buildDocumentRequestFormData(data: RequesterDocumentRequestFormData) {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("documentTypeId", String(data.documentTypeId));

  if (data.attachment) {
    formData.append("attachment", data.attachment);
  }

  return formData;
}

function getFileNameFromContentDisposition(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(value);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ""));
  }

  const fileNameMatch = /filename="?([^";]+)"?/i.exec(value);
  return fileNameMatch?.[1]?.trim() ?? null;
}

export function getAttachmentFileName(attachment: AttachmentMetadata) {
  return attachment.originalFileName ?? attachment.fileName ?? "Attachment";
}

export async function getRequestDocumentTypes(
  signal?: AbortSignal,
): Promise<RequestDocumentType[]> {
  const response = await apiClient.get<RequestDocumentType[]>(
    "/api/document-types",
    { signal },
  );
  return response.data;
}

export async function getRequesterDocumentRequests(
  signal?: AbortSignal,
): Promise<RequesterDocumentRequestListItem[]> {
  const response = await apiClient.get<RequesterDocumentRequestListItem[]>(
    "/api/document-requests",
    { signal },
  );
  return response.data;
}

export async function getRequesterDocumentRequest(
  documentRequestId: number,
  signal?: AbortSignal,
): Promise<RequesterDocumentRequestDetail> {
  const response = await apiClient.get<RequesterDocumentRequestDetail>(
    getDocumentRequestPath(documentRequestId),
    { signal },
  );
  return response.data;
}

export async function createRequesterDocumentRequest(
  data: RequesterDocumentRequestFormData,
): Promise<RequesterDocumentRequestDetail> {
  const response = await apiClient.post<RequesterDocumentRequestDetail>(
    "/api/document-requests",
    buildDocumentRequestFormData(data),
  );
  return response.data;
}

export async function updateRequesterDocumentRequest(
  documentRequestId: number,
  data: RequesterDocumentRequestFormData,
): Promise<RequesterDocumentRequestDetail> {
  const response = await apiClient.put<RequesterDocumentRequestDetail>(
    getDocumentRequestPath(documentRequestId),
    buildDocumentRequestFormData(data),
  );
  return response.data;
}

export async function submitRequesterDocumentRequest(
  documentRequestId: number,
): Promise<RequesterDocumentRequestDetail> {
  const response = await apiClient.post<RequesterDocumentRequestDetail>(
    `${getDocumentRequestPath(documentRequestId)}/submit`,
  );
  return response.data;
}

export async function cancelRequesterDocumentRequest(
  documentRequestId: number,
): Promise<RequesterDocumentRequestDetail> {
  const response = await apiClient.post<RequesterDocumentRequestDetail>(
    `${getDocumentRequestPath(documentRequestId)}/cancel`,
  );
  return response.data;
}

export async function deleteRequesterDocumentRequest(
  documentRequestId: number,
): Promise<void> {
  await apiClient.delete(getDocumentRequestPath(documentRequestId));
}

export async function getDocumentRequestActivities(
  documentRequestId: number,
  signal?: AbortSignal,
): Promise<DocumentRequestActivity[]> {
  const response = await apiClient.get<DocumentRequestActivity[]>(
    `${getDocumentRequestPath(documentRequestId)}/activities`,
    { signal },
  );
  return response.data;
}

export async function downloadDocumentRequestAttachment(
  documentRequestId: number,
): Promise<DownloadedAttachment> {
  const response = await apiClient.get<Blob>(
    `${getDocumentRequestPath(documentRequestId)}/attachment`,
    { responseType: "blob" },
  );
  const fileName =
    getFileNameFromContentDisposition(response.headers["content-disposition"]) ??
    `document-request-${documentRequestId}-attachment`;

  return {
    blob: response.data,
    fileName,
  };
}

export async function getApproverDocumentRequests(
  signal?: AbortSignal,
): Promise<ApproverDocumentRequestListItem[]> {
  const response = await apiClient.get<ApproverDocumentRequestListItem[]>(
    "/api/approver/document-requests",
    { signal },
  );
  return response.data;
}

export async function getApproverDocumentRequest(
  documentRequestId: number,
  signal?: AbortSignal,
): Promise<ApproverDocumentRequestDetail> {
  const response = await apiClient.get<ApproverDocumentRequestDetail>(
    getApproverDocumentRequestPath(documentRequestId),
    { signal },
  );
  return response.data;
}

export async function approveApproverDocumentRequest(
  documentRequestId: number,
  remarks?: string,
): Promise<ApproverDocumentRequestDetail> {
  const response = await apiClient.post<ApproverDocumentRequestDetail>(
    `${getApproverDocumentRequestPath(documentRequestId)}/approve`,
    { remarks: remarks?.trim() || null },
  );
  return response.data;
}

export async function rejectApproverDocumentRequest(
  documentRequestId: number,
  remarks: string,
): Promise<ApproverDocumentRequestDetail> {
  const response = await apiClient.post<ApproverDocumentRequestDetail>(
    `${getApproverDocumentRequestPath(documentRequestId)}/reject`,
    { remarks: remarks.trim() },
  );
  return response.data;
}
