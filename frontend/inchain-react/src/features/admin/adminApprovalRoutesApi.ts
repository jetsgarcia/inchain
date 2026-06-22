import apiClient from "@/lib/api/apiClient";

export type AdminApprovalRoute = {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  approverId: string;
  approverFullName: string;
  approverEmail: string | null;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
};

export type AdminApprover = {
  id: string;
  fullName: string;
  email: string | null;
};

export type AssignAdminApprovalRouteRequest = {
  approverId: string;
};

function getApprovalRoutePath(approvalRouteId: number) {
  return `/api/admin/approval-routes/${encodeURIComponent(
    String(approvalRouteId),
  )}`;
}

function getDocumentTypeApproverPath(documentTypeId: number) {
  return `/api/admin/document-types/${encodeURIComponent(
    String(documentTypeId),
  )}/approver`;
}

export async function getAdminApprovalRoutes(
  signal?: AbortSignal,
): Promise<AdminApprovalRoute[]> {
  const response = await apiClient.get<AdminApprovalRoute[]>(
    "/api/admin/approval-routes",
    { signal },
  );
  return response.data;
}

export async function getAdminApprovalRoute(
  approvalRouteId: number,
  signal?: AbortSignal,
): Promise<AdminApprovalRoute> {
  const response = await apiClient.get<AdminApprovalRoute>(
    getApprovalRoutePath(approvalRouteId),
    { signal },
  );
  return response.data;
}

export async function getAdminApprovers(
  signal?: AbortSignal,
): Promise<AdminApprover[]> {
  const response = await apiClient.get<AdminApprover[]>(
    "/api/admin/approvers",
    { signal },
  );
  return response.data;
}

export async function assignAdminDocumentTypeApprover(
  documentTypeId: number,
  approverId: string,
): Promise<void> {
  await apiClient.put<never, void, AssignAdminApprovalRouteRequest>(
    getDocumentTypeApproverPath(documentTypeId),
    { approverId },
  );
}

export async function disableAdminApprovalRoute(
  approvalRouteId: number,
): Promise<void> {
  await apiClient.patch(`${getApprovalRoutePath(approvalRouteId)}/disable`);
}