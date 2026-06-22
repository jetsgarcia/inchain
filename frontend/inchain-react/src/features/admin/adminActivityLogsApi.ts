import apiClient from "@/lib/api/apiClient";

export type AdminActivityLog = {
  id: number;
  targetEntityType: string;
  targetEntityId: string | null;
  documentRequestId: number | null;
  actionType: string;
  actorNameOrEmail: string | null;
  description: string | null;
  oldStatusName: string | null;
  newStatusName: string | null;
  createdAt: string;
};

export type AdminActivityLogQuery = {
  actionType?: string;
  targetEntityType?: string;
  searchText?: string;
};

function cleanQueryValue(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export async function getAdminActivityLogs(
  query: AdminActivityLogQuery = {},
  signal?: AbortSignal,
): Promise<AdminActivityLog[]> {
  const response = await apiClient.get<AdminActivityLog[]>(
    "/api/admin/activity-logs",
    {
      params: {
        actionType: cleanQueryValue(query.actionType),
        targetEntityType: cleanQueryValue(query.targetEntityType),
        searchText: cleanQueryValue(query.searchText),
      },
      signal,
    },
  );
  return response.data;
}