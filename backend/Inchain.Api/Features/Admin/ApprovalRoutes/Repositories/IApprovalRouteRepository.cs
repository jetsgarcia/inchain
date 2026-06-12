using Inchain.Api.Data;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Repositories;

public interface IApprovalRouteRepository
{
    Task<IReadOnlyList<ApprovalRoute>> GetApprovalRoutesAsync();

    Task<ApprovalRoute?> GetApprovalRouteByDocumentTypeIdAsync(int documentTypeId, bool trackChanges = false);

    Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId);

    Task AddAsync(ApprovalRoute approvalRoute);

    Task AddActivityLogAsync(ActivityLog activityLog);

    Task SaveChangesAsync();
}
