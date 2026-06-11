using Inchain.Api.Data;
using Inchain.Api.Features.Admin.DocumentTypes.Dtos;
using Inchain.Api.Features.Admin.DocumentTypes.Mappers;
using Inchain.Api.Features.Admin.DocumentTypes.Repositories;

namespace Inchain.Api.Features.Admin.DocumentTypes.Services;

public class DocumentTypeService : IDocumentTypeService
{
    private readonly IDocumentTypeRepository _documentTypeRepository;
    private readonly ILogger<DocumentTypeService> _logger;

    public DocumentTypeService(
        IDocumentTypeRepository documentTypeRepository,
        ILogger<DocumentTypeService> logger)
    {
        _documentTypeRepository = documentTypeRepository;
        _logger = logger;
    }

    public async Task<IReadOnlyList<DocumentTypeResponse>> GetDocumentTypesAsync()
    {
        var documentTypes = await _documentTypeRepository.GetDocumentTypesAsync();

        return documentTypes
            .Select(DocumentTypeMapper.ToResponse)
            .ToList();
    }

    public async Task<DocumentTypeResponse?> GetDocumentTypeAsync(int documentTypeId)
    {
        var documentType = await _documentTypeRepository.GetDocumentTypeAsync(documentTypeId);

        return documentType is null ? null : DocumentTypeMapper.ToResponse(documentType);
    }

    public async Task<(DocumentTypeResponse? DocumentType, bool IsDuplicate)> CreateDocumentTypeAsync(
        string name,
        string? description)
    {
        var normalizedName = name.Trim();

        if (await _documentTypeRepository.NameExistsAsync(normalizedName))
        {
            _logger.LogInformation("Document type creation skipped because name {DocumentTypeName} already exists.", normalizedName);

            return (null, true);
        }

        var documentType = new DocumentType
        {
            Name = normalizedName,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim()
        };

        await _documentTypeRepository.AddAsync(documentType);
        await _documentTypeRepository.SaveChangesAsync();

        _logger.LogInformation("Created document type {DocumentTypeId} named {DocumentTypeName}.", documentType.Id, documentType.Name);

        return (DocumentTypeMapper.ToResponse(documentType), false);
    }

    public async Task<(bool IsFound, bool IsDuplicate)> EditDocumentTypeAsync(
        int documentTypeId,
        string name,
        string? description)
    {
        var documentType = await _documentTypeRepository.GetDocumentTypeAsync(documentTypeId, trackChanges: true);

        if (documentType is null)
        {
            _logger.LogInformation("Document type edit skipped because document type {DocumentTypeId} was not found.", documentTypeId);

            return (false, false);
        }

        var normalizedName = name.Trim();

        if (await _documentTypeRepository.NameExistsAsync(normalizedName, documentTypeId))
        {
            _logger.LogInformation("Document type {DocumentTypeId} edit skipped because name {DocumentTypeName} already exists.", documentTypeId, normalizedName);

            return (true, true);
        }

        documentType.Name = normalizedName;
        documentType.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();

        await _documentTypeRepository.SaveChangesAsync();

        _logger.LogInformation("Updated document type {DocumentTypeId} named {DocumentTypeName}.", documentType.Id, documentType.Name);

        return (true, false);
    }

    public async Task<(bool IsDeleted, bool IsInUse)> DeleteDocumentTypeAsync(int documentTypeId)
    {
        var documentType = await _documentTypeRepository.GetDocumentTypeAsync(documentTypeId, trackChanges: true);

        if (documentType is null)
        {
            _logger.LogInformation("Document type delete skipped because document type {DocumentTypeId} was not found.", documentTypeId);

            return (false, false);
        }

        if (await _documentTypeRepository.IsInUseAsync(documentTypeId))
        {
            _logger.LogWarning("Document type {DocumentTypeId} delete was blocked because it is already in use.", documentTypeId);

            return (false, true);
        }

        _documentTypeRepository.Delete(documentType);
        await _documentTypeRepository.SaveChangesAsync();

        _logger.LogInformation("Deleted document type {DocumentTypeId} named {DocumentTypeName}.", documentType.Id, documentType.Name);

        return (true, false);
    }
}
