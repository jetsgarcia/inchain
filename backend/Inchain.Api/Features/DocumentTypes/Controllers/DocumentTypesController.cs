using Inchain.Api.Data;
using Inchain.Api.Features.Admin.DocumentTypes.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.DocumentTypes.Controllers;

[Route("api/document-types")]
[ApiController]
[Authorize(Roles = ApplicationRole.RequesterRoleName)]
public class DocumentTypesController : ControllerBase
{
    private readonly IDocumentTypeService _documentTypeService;

    public DocumentTypesController(IDocumentTypeService documentTypeService)
    {
        _documentTypeService = documentTypeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetActiveDocumentTypes()
    {
        var documentTypes = await _documentTypeService.GetActiveDocumentTypesAsync();

        return Ok(documentTypes);
    }
}