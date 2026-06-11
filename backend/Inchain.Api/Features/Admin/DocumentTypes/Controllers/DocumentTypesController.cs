using Inchain.Api.Features.Admin.DocumentTypes.Dtos;
using Inchain.Api.Features.Admin.DocumentTypes.Services;
using Inchain.Api.Features.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Admin.DocumentTypes.Controllers;

[Route("api/admin/document-types")]
[ApiController]
[Authorize(Roles = "Admin")]
public class DocumentTypesController : ControllerBase
{
    private readonly IDocumentTypeService _documentTypeService;

    public DocumentTypesController(IDocumentTypeService documentTypeService)
    {
        _documentTypeService = documentTypeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocumentTypes()
    {
        var documentTypes = await _documentTypeService.GetDocumentTypesAsync();

        return Ok(documentTypes);
    }

    [HttpGet("{documentTypeId:int}")]
    public async Task<IActionResult> GetDocumentType(int documentTypeId)
    {
        var documentType = await _documentTypeService.GetDocumentTypeAsync(documentTypeId);

        if (documentType is null)
        {
            return NotFound();
        }

        return Ok(documentType);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDocumentType([FromBody] CreateDocumentTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new[]
            {
                ApiError.Create("InvalidDocumentTypeName", "Document type name is required.")
            });
        }

        var response = await _documentTypeService.CreateDocumentTypeAsync(request.Name, request.Description);

        if (response.IsDuplicate)
        {
            return Conflict(new[]
            {
                ApiError.Create("DuplicateDocumentTypeName", $"Document type '{request.Name}' already exists.")
            });
        }

        var documentType = response.DocumentType!;

        return CreatedAtAction(nameof(GetDocumentType), new { documentTypeId = documentType.Id }, documentType);
    }

    [HttpPut("{documentTypeId:int}")]
    public async Task<IActionResult> EditDocumentType(
        int documentTypeId,
        [FromBody] EditDocumentTypeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new[]
            {
                ApiError.Create("InvalidDocumentTypeName", "Document type name is required.")
            });
        }

        var response = await _documentTypeService.EditDocumentTypeAsync(
            documentTypeId,
            request.Name,
            request.Description);

        if (!response.IsFound && !response.IsDuplicate)
        {
            return NotFound();
        }

        if (response.IsDuplicate)
        {
            return Conflict(new[]
            {
                ApiError.Create("DuplicateDocumentTypeName", $"Document type '{request.Name}' already exists.")
            });
        }

        return NoContent();
    }

    [HttpDelete("{documentTypeId:int}")]
    public async Task<IActionResult> DeleteDocumentType(int documentTypeId)
    {
        var response = await _documentTypeService.DeleteDocumentTypeAsync(documentTypeId);

        if (response.IsDeleted)
        {
            return NoContent();
        }

        if (response.IsInUse)
        {
            return Conflict(new[]
            {
                ApiError.Create(
                    "DocumentTypeInUse",
                    "Document type cannot be deleted because it is already used by requests or approval routes.")
            });
        }

        return NoContent();
    }
}
