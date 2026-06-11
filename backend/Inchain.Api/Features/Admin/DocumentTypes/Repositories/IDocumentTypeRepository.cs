using Inchain.Api.Data;

namespace Inchain.Api.Features.Admin.DocumentTypes.Repositories;

public interface IDocumentTypeRepository
{
    Task<IReadOnlyList<DocumentType>> GetDocumentTypesAsync();

    Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId, bool trackChanges = false);

    Task<bool> NameExistsAsync(string name, int? excludedDocumentTypeId = null);

    Task<bool> IsInUseAsync(int documentTypeId);

    Task AddAsync(DocumentType documentType);

    void Delete(DocumentType documentType);

    Task SaveChangesAsync();
}
