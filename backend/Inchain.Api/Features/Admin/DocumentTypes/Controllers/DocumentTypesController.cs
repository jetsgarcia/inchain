using System.Security.Claims;
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

        var response = await _documentTypeService.CreateDocumentTypeAsync(
            request.Name,
            request.Description,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

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
            request.Description,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

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

    [HttpPatch("{documentTypeId:int}/disable")]
    public async Task<IActionResult> DisableDocumentType(int documentTypeId)
    {
        var isFound = await _documentTypeService.DisableDocumentTypeAsync(
            documentTypeId,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!isFound)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPatch("{documentTypeId:int}/enable")]
    public async Task<IActionResult> EnableDocumentType(int documentTypeId)
    {
        var isFound = await _documentTypeService.EnableDocumentTypeAsync(
            documentTypeId,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!isFound)
        {
            return NotFound();
        }

        return NoContent();
    }
}
