import apiClient from "@/lib/api/apiClient";

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

function getDocumentTypePath(documentTypeId: number) {
  return `/api/admin/document-types/${encodeURIComponent(String(documentTypeId))}`;
}

export async function getAdminDocumentTypes(
  signal?: AbortSignal,
): Promise<AdminDocumentType[]> {
  const response = await apiClient.get<AdminDocumentType[]>(
    "/api/admin/document-types",
    { signal },
  );
  return response.data;
}

export async function getAdminDocumentType(
  documentTypeId: number,
  signal?: AbortSignal,
): Promise<AdminDocumentType> {
  const response = await apiClient.get<AdminDocumentType>(
    getDocumentTypePath(documentTypeId),
    { signal },
  );
  return response.data;
}

export async function createAdminDocumentType(
  data: CreateAdminDocumentTypeRequest,
): Promise<AdminDocumentType> {
  const response = await apiClient.post<AdminDocumentType>(
    "/api/admin/document-types",
    data,
  );
  return response.data;
}

export async function updateAdminDocumentType(
  documentTypeId: number,
  data: UpdateAdminDocumentTypeRequest,
): Promise<void> {
  await apiClient.put<never, void, UpdateAdminDocumentTypeRequest>(
    getDocumentTypePath(documentTypeId),
    data,
  );
}

export async function setAdminDocumentTypeActive(
  documentTypeId: number,
  isActive: boolean,
): Promise<void> {
  await apiClient.patch(
    `${getDocumentTypePath(documentTypeId)}/${isActive ? "enable" : "disable"}`,
  );
}
