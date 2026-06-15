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

    public async Task AddDocumentRequestAsync(DocumentRequest documentRequest)
    {
        await _dbContext.DocumentRequests.AddAsync(documentRequest);
    }

    public async Task AddRequestAttachmentAsync(RequestAttachment requestAttachment)
    {
        await _dbContext.RequestAttachments.AddAsync(requestAttachment);
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
