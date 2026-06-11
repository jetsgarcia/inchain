using Inchain.Api.Features.Admin.DocumentTypes.Dtos;

namespace Inchain.Api.Features.Admin.DocumentTypes.Services;

public interface IDocumentTypeService
{
    Task<IReadOnlyList<DocumentTypeResponse>> GetDocumentTypesAsync();

    Task<DocumentTypeResponse?> GetDocumentTypeAsync(int documentTypeId);

    Task<(DocumentTypeResponse? DocumentType, bool IsDuplicate)> CreateDocumentTypeAsync(string name, string? description);

    Task<(bool IsFound, bool IsDuplicate)> EditDocumentTypeAsync(
        int documentTypeId,
        string name,
        string? description);

    Task<bool> DisableDocumentTypeAsync(int documentTypeId);

    Task<bool> EnableDocumentTypeAsync(int documentTypeId);
}
