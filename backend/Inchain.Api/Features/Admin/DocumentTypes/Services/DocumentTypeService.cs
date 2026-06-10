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
}
