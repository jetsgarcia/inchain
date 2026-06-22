using Inchain.Api.Data;

namespace Inchain.Api.Features.Admin.DocumentTypes.Repositories;

public interface IDocumentTypeRepository
{
    Task<IReadOnlyList<DocumentType>> GetDocumentTypesAsync();

    Task<IReadOnlyList<DocumentType>> GetActiveDocumentTypesAsync();

    Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId, bool trackChanges = false);

    Task<bool> NameExistsAsync(string name, int? excludedDocumentTypeId = null);

    Task AddAsync(DocumentType documentType);

    Task AddActivityLogAsync(ActivityLog activityLog);

    Task SaveChangesAsync();
}
