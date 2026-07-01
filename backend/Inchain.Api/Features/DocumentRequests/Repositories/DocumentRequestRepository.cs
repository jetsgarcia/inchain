using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Inchain.Api.Features.DocumentRequests.Repositories;

public class DocumentRequestRepository : IDocumentRequestRepository
{
    private readonly ApplicationDbContext _dbContext;

    public DocumentRequestRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync()
    {
        return await _dbContext.Database.BeginTransactionAsync();
    }

    public async Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId)
    {
        return await _dbContext.DocumentTypes
            .FirstOrDefaultAsync(documentType => documentType.Id == documentTypeId);
    }

    public async Task<RequestStatus?> GetRequestStatusByNameAsync(string name)
    {
        return await _dbContext.RequestStatuses
            .FirstOrDefaultAsync(requestStatus => requestStatus.Name == name);
    }

    public async Task<IReadOnlyList<DocumentRequest>> GetActiveDocumentRequestsForRequesterAsync(string requesterId)
    {
        return await _dbContext.DocumentRequests
            .AsNoTracking()
            .Include(documentRequest => documentRequest.DocumentType)
            .Include(documentRequest => documentRequest.RequestStatus)
            .Where(documentRequest =>
                documentRequest.RequestedById == requesterId &&
                !documentRequest.IsDeleted)
            .OrderByDescending(documentRequest => documentRequest.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DocumentRequest>> GetPendingDocumentRequestsForApproverAsync(string approverId)
    {
        return await _dbContext.DocumentRequests
            .AsNoTracking()
            .Include(documentRequest => documentRequest.DocumentType)
            .Include(documentRequest => documentRequest.RequestStatus)
            .Include(documentRequest => documentRequest.RequestedBy)
            .Where(documentRequest =>
                documentRequest.AssignedApproverUserId == approverId &&
                !documentRequest.IsDeleted)
            .OrderBy(documentRequest => documentRequest.SubmittedAt)
            .ThenBy(documentRequest => documentRequest.CreatedAt)
            .ToListAsync();
    }

    public async Task<DocumentRequest?> GetPendingDocumentRequestForApproverAsync(
        int documentRequestId,
        string approverId)
    {
        return await _dbContext.DocumentRequests
            .AsNoTracking()
            .Include(documentRequest => documentRequest.DocumentType)
            .Include(documentRequest => documentRequest.RequestStatus)
            .Include(documentRequest => documentRequest.RequestedBy)
            .Include(documentRequest => documentRequest.RequestAttachments)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                documentRequest.AssignedApproverUserId == approverId &&
                !documentRequest.IsDeleted &&
                documentRequest.RequestStatus.Name == ApplicationSeedData.PendingApprovalRequestStatusName);
    }

    public async Task<DocumentRequest?> GetPendingDocumentRequestForApproverForUpdateAsync(
        int documentRequestId,
        string approverId)
    {
        return await _dbContext.DocumentRequests
            .Include(documentRequest => documentRequest.DocumentType)
            .Include(documentRequest => documentRequest.RequestStatus)
            .Include(documentRequest => documentRequest.RequestedBy)
            .Include(documentRequest => documentRequest.RequestAttachments)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                documentRequest.AssignedApproverUserId == approverId &&
                !documentRequest.IsDeleted &&
                documentRequest.RequestStatus.Name == ApplicationSeedData.PendingApprovalRequestStatusName);
    }

    public async Task<DocumentRequest?> GetActiveDocumentRequestForRequesterAsync(
        int documentRequestId,
        string requesterId)
    {
        return await _dbContext.DocumentRequests
            .AsNoTracking()
            .Include(documentRequest => documentRequest.DocumentType)
            .Include(documentRequest => documentRequest.RequestStatus)
            .Include(documentRequest => documentRequest.RequestAttachments)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                documentRequest.RequestedById == requesterId &&
                !documentRequest.IsDeleted);
    }

    public async Task<DocumentRequest?> GetActiveDocumentRequestForAttachmentAccessAsync(
        int documentRequestId,
        string userId)
    {
        return await _dbContext.DocumentRequests
            .AsNoTracking()
            .Include(documentRequest => documentRequest.RequestAttachments)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                !documentRequest.IsDeleted &&
                (documentRequest.RequestedById == userId ||
                 documentRequest.AssignedApproverUserId == userId));
    }

    public async Task<DocumentRequest?> GetDocumentRequestForActivityAccessAsync(
        int documentRequestId,
        string userId)
    {
        return await _dbContext.DocumentRequests
            .AsNoTracking()
            .Include(documentRequest => documentRequest.ActivityLogs)
                .ThenInclude(activityLog => activityLog.User)
            .Include(documentRequest => documentRequest.ApprovalActions)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                (documentRequest.RequestedById == userId ||
                 documentRequest.AssignedApproverUserId == userId));
    }

    public async Task<DocumentRequest?> GetActiveDocumentRequestForRequesterForUpdateAsync(
        int documentRequestId,
        string requesterId)
    {
        return await _dbContext.DocumentRequests
            .Include(documentRequest => documentRequest.DocumentType)
            .Include(documentRequest => documentRequest.RequestStatus)
            .Include(documentRequest => documentRequest.RequestAttachments)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                documentRequest.RequestedById == requesterId &&
                !documentRequest.IsDeleted);
    }

    public async Task<DocumentRequest?> GetActiveDocumentRequestForRequesterForDeleteAsync(
        int documentRequestId,
        string requesterId)
    {
        return await _dbContext.DocumentRequests
            .Include(documentRequest => documentRequest.RequestStatus)
            .FirstOrDefaultAsync(documentRequest =>
                documentRequest.Id == documentRequestId &&
                documentRequest.RequestedById == requesterId &&
                !documentRequest.IsDeleted);
    }

    public async Task<IReadOnlyList<ApprovalRoute>> GetActiveApprovalRoutesForDocumentTypeAsync(int documentTypeId)
    {
        return await _dbContext.ApprovalRoutes
            .AsNoTracking()
            .Where(approvalRoute =>
                approvalRoute.DocumentTypeId == documentTypeId &&
                approvalRoute.IsActive)
            .ToListAsync();
    }

    public async Task AddDocumentRequestAsync(DocumentRequest documentRequest)
    {
        await _dbContext.DocumentRequests.AddAsync(documentRequest);
    }

    public async Task AddRequestAttachmentAsync(RequestAttachment requestAttachment)
    {
        await _dbContext.RequestAttachments.AddAsync(requestAttachment);
    }

    public async Task AddApprovalActionAsync(ApprovalAction approvalAction)
    {
        await _dbContext.ApprovalActions.AddAsync(approvalAction);
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
