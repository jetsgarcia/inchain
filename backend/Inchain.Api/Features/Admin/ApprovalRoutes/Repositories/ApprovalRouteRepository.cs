using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Repositories;

public class ApprovalRouteRepository : IApprovalRouteRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ApprovalRouteRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ApprovalRoute>> GetApprovalRoutesAsync()
    {
        return await _dbContext.ApprovalRoutes
            .AsNoTracking()
            .Include(approvalRoute => approvalRoute.DocumentType)
            .Include(approvalRoute => approvalRoute.Approver)
            .OrderBy(approvalRoute => approvalRoute.DocumentType.Name)
            .ToListAsync();
    }

    public async Task<ApprovalRoute?> GetApprovalRouteByDocumentTypeIdAsync(
        int documentTypeId,
        bool trackChanges = false)
    {
        var query = trackChanges
            ? _dbContext.ApprovalRoutes
            : _dbContext.ApprovalRoutes.AsNoTracking();

        return await query
            .Include(approvalRoute => approvalRoute.DocumentType)
            .Include(approvalRoute => approvalRoute.Approver)
            .FirstOrDefaultAsync(approvalRoute => approvalRoute.DocumentTypeId == documentTypeId);
    }

    public async Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId)
    {
        return await _dbContext.DocumentTypes
            .FirstOrDefaultAsync(documentType => documentType.Id == documentTypeId);
    }

    public async Task AddAsync(ApprovalRoute approvalRoute)
    {
        await _dbContext.ApprovalRoutes.AddAsync(approvalRoute);
    }

    public async Task AddActivityLogAsync(ActivityLog activityLog)
    {
        await _dbContext.ActivityLogs.AddAsync(activityLog);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
