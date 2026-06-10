using Inchain.Api.Data;

namespace Inchain.Api.Features.Admin.DocumentTypes.Services;

public interface IDocumentTypeService
{
    Task<IReadOnlyList<DocumentType>> GetDocumentTypesAsync();

    Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId);

    Task<(DocumentType? DocumentType, bool IsDuplicate)> CreateDocumentTypeAsync(string name, string? description);

    Task<(DocumentType? DocumentType, bool IsDuplicate)> EditDocumentTypeAsync(
        int documentTypeId,
        string name,
        string? description);

    Task<(bool IsDeleted, bool IsInUse)> DeleteDocumentTypeAsync(int documentTypeId);
}
