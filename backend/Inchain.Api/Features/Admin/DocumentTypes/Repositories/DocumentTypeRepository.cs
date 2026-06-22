using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Features.Admin.DocumentTypes.Repositories;

public class DocumentTypeRepository : IDocumentTypeRepository
{
    private readonly ApplicationDbContext _dbContext;

    public DocumentTypeRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<DocumentType>> GetDocumentTypesAsync()
    {
        return await _dbContext.DocumentTypes
            .AsNoTracking()
            .OrderBy(documentType => documentType.Name)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DocumentType>> GetActiveDocumentTypesAsync()
    {
        return await _dbContext.DocumentTypes
            .AsNoTracking()
            .Where(documentType => documentType.IsActive)
            .OrderBy(documentType => documentType.Name)
            .ToListAsync();
    }

    public async Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId, bool trackChanges = false)
    {
        var query = trackChanges
            ? _dbContext.DocumentTypes
            : _dbContext.DocumentTypes.AsNoTracking();

        return await query.FirstOrDefaultAsync(documentType => documentType.Id == documentTypeId);
    }

    public async Task<bool> NameExistsAsync(string name, int? excludedDocumentTypeId = null)
    {
        return await _dbContext.DocumentTypes.AnyAsync(documentType =>
            documentType.Name == name &&
            (!excludedDocumentTypeId.HasValue || documentType.Id != excludedDocumentTypeId.Value));
    }

    public async Task AddAsync(DocumentType documentType)
    {
        await _dbContext.DocumentTypes.AddAsync(documentType);
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
