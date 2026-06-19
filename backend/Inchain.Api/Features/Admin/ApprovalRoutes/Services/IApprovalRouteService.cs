using Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Services;

public interface IApprovalRouteService
{
    Task<IReadOnlyList<ApprovalRouteResponse>> GetApprovalRoutesAsync();

    Task<ApprovalRouteResponse?> GetApprovalRouteAsync(int approvalRouteId);

    Task<IReadOnlyList<ApproverResponse>> GetApproversAsync();

    Task<AssignApproverResult> AssignApproverAsync(
        int documentTypeId,
        string approverId,
        string? adminUserId);

    Task<bool> DisableApprovalRouteAsync(int approvalRouteId, string? adminUserId);
}
