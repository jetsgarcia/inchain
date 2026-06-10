using Inchain.Api.Data;
using Inchain.Api.Features.Admin.DocumentTypes.Dtos;
using Inchain.Api.Features.Admin.DocumentTypes.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Admin.DocumentTypes.Controllers;

[Route("api/document-types")]
[ApiController]
[Authorize(Roles = "Admin")]
public class DocumentTypesController : ControllerBase
{
    private readonly IDocumentTypeService _documentTypeService;

    public DocumentTypesController(IDocumentTypeService documentTypeService)
    {
        _documentTypeService = documentTypeService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateDocumentType([FromBody] CreateDocumentTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new[]
            {
                new
                {
                    Code = "InvalidDocumentTypeName",
                    Description = "Document type name is required."
                }
            });
        }

        var response = await _documentTypeService.CreateDocumentTypeAsync(request.Name, request.Description);

        if (response.IsDuplicate)
        {
            return Conflict(new[]
            {
                new
                {
                    Code = "DuplicateDocumentTypeName",
                    Description = $"Document type '{request.Name}' already exists."
                }
            });
        }

        var documentType = MapDocumentTypeResponse(response.DocumentType!);

        return Created($"/api/document-types/{documentType.Id}", documentType);
    }

    private static DocumentTypeResponse MapDocumentTypeResponse(DocumentType documentType)
    {
        return new DocumentTypeResponse
        {
            Id = documentType.Id,
            Name = documentType.Name,
            Description = documentType.Description
        };
    }
}
