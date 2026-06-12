using Inchain.Api.Data;
using Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Mappers;

public static class ApprovalRouteMapper
{
    public static ApprovalRouteResponse ToResponse(ApprovalRoute approvalRoute)
    {
        return new ApprovalRouteResponse
        {
            Id = approvalRoute.Id,
            DocumentTypeId = approvalRoute.DocumentTypeId,
            DocumentTypeName = approvalRoute.DocumentType.Name,
            ApproverId = approvalRoute.ApproverId,
            ApproverFullName = approvalRoute.Approver.FullName,
            ApproverEmail = approvalRoute.Approver.Email,
            CreatedAt = approvalRoute.CreatedAt,
            CreatedByUserId = approvalRoute.CreatedByUserId,
            UpdatedAt = approvalRoute.UpdatedAt,
            UpdatedByUserId = approvalRoute.UpdatedByUserId
        };
    }

    public static ApproverResponse ToApproverResponse(ApplicationUser approver)
    {
        return new ApproverResponse
        {
            Id = approver.Id,
            FullName = approver.FullName,
            Email = approver.Email
        };
    }
}
