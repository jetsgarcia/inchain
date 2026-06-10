using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Features.Admin.DocumentTypes.Services;

public class DocumentTypeService : IDocumentTypeService
{
    private readonly ApplicationDbContext dbContext;

    public DocumentTypeService(ApplicationDbContext dbContext)
    {
        this.dbContext = dbContext;
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
            return (null, true);
        }

        var documentType = new DocumentType
        {
            Name = normalizedName,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim()
        };

        dbContext.DocumentTypes.Add(documentType);
        await dbContext.SaveChangesAsync();

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
            return (null, false);
        }

        var normalizedName = name.Trim();

        if (await dbContext.DocumentTypes.AnyAsync(documentType =>
                documentType.Id != documentTypeId &&
                documentType.Name == normalizedName))
        {
            return (null, true);
        }

        documentType.Name = normalizedName;
        documentType.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();

        await dbContext.SaveChangesAsync();

        return (documentType, false);
    }
}
