using Inchain.Api.Data;
using Inchain.Api.Features.Admin.DocumentTypes.Dtos;

namespace Inchain.Api.Features.Admin.DocumentTypes.Mappers;

public static class DocumentTypeMapper
{
    public static DocumentTypeResponse ToResponse(DocumentType documentType)
    {
        return new DocumentTypeResponse
        {
            Id = documentType.Id,
            Name = documentType.Name,
            Description = documentType.Description,
            IsActive = documentType.IsActive
        };
    }
}
