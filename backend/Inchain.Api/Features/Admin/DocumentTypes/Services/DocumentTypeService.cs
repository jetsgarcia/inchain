using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Inchain.Api.Features.Admin.DocumentTypes.Services;

public class DocumentTypeService : IDocumentTypeService
{
    private readonly ApplicationDbContext dbContext;
    private readonly ILogger<DocumentTypeService> logger;

    public DocumentTypeService(ApplicationDbContext dbContext, ILogger<DocumentTypeService> logger)
    {
        this.dbContext = dbContext;
        this.logger = logger;
    }

    public async Task<IReadOnlyList<DocumentType>> GetDocumentTypesAsync()
    {
        return await dbContext.DocumentTypes
            .AsNoTracking()
            .OrderBy(documentType => documentType.Name)
            .ToListAsync();
    }

    public async Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId)
    {
        return await dbContext.DocumentTypes
            .AsNoTracking()
            .FirstOrDefaultAsync(documentType => documentType.Id == documentTypeId);
    }

    public async Task<(DocumentType? DocumentType, bool IsDuplicate)> CreateDocumentTypeAsync(
        string name,
        string? description)
    {
        var normalizedName = name.Trim();

        if (await dbContext.DocumentTypes.AnyAsync(documentType => documentType.Name == normalizedName))
        {
            logger.LogInformation("Document type creation skipped because name {DocumentTypeName} already exists.", normalizedName);

            return (null, true);
        }

        var documentType = new DocumentType
        {
            Name = normalizedName,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim()
        };

        dbContext.DocumentTypes.Add(documentType);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Created document type {DocumentTypeId} named {DocumentTypeName}.", documentType.Id, documentType.Name);

        return (documentType, false);
    }

    public async Task<(DocumentType? DocumentType, bool IsDuplicate)> EditDocumentTypeAsync(
        int documentTypeId,
        string name,
        string? description)
    {
        var documentType = await dbContext.DocumentTypes
            .FirstOrDefaultAsync(documentType => documentType.Id == documentTypeId);

        if (documentType is null)
        {
            logger.LogInformation("Document type edit skipped because document type {DocumentTypeId} was not found.", documentTypeId);

            return (null, false);
        }

        var normalizedName = name.Trim();

        if (await dbContext.DocumentTypes.AnyAsync(documentType =>
                documentType.Id != documentTypeId &&
                documentType.Name == normalizedName))
        {
            logger.LogInformation("Document type {DocumentTypeId} edit skipped because name {DocumentTypeName} already exists.", documentTypeId, normalizedName);

            return (null, true);
        }

        documentType.Name = normalizedName;
        documentType.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();

        await dbContext.SaveChangesAsync();

        logger.LogInformation("Updated document type {DocumentTypeId} named {DocumentTypeName}.", documentType.Id, documentType.Name);

        return (documentType, false);
    }

    public async Task<(bool IsDeleted, bool IsInUse)> DeleteDocumentTypeAsync(int documentTypeId)
    {
        var documentType = await dbContext.DocumentTypes
            .FirstOrDefaultAsync(documentType => documentType.Id == documentTypeId);

        if (documentType is null)
        {
            logger.LogInformation("Document type delete skipped because document type {DocumentTypeId} was not found.", documentTypeId);

            return (false, false);
        }

        var isInUse =
            await dbContext.DocumentRequests.AnyAsync(documentRequest =>
                documentRequest.DocumentTypeId == documentTypeId) ||
            await dbContext.ApprovalRoutes.AnyAsync(approvalRoute =>
                approvalRoute.DocumentTypeId == documentTypeId);

        if (isInUse)
        {
            logger.LogWarning("Document type {DocumentTypeId} delete was blocked because it is already in use.", documentTypeId);

            return (false, true);
        }

        dbContext.DocumentTypes.Remove(documentType);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("Deleted document type {DocumentTypeId} named {DocumentTypeName}.", documentType.Id, documentType.Name);

        return (true, false);
    }
}
