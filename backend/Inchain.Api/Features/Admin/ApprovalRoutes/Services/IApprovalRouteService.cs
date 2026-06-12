using Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Services;

public interface IApprovalRouteService
{
    Task<IReadOnlyList<ApprovalRouteResponse>> GetApprovalRoutesAsync();

    Task<IReadOnlyList<ApproverResponse>> GetApproversAsync();

    Task<AssignApproverResult> AssignApproverAsync(
        int documentTypeId,
        string approverId,
        string? adminUserId);
}
