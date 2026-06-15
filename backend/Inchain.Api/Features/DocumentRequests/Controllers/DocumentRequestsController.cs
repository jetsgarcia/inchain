using System.Security.Claims;
using Inchain.Api.Data;
using Inchain.Api.Features.DocumentRequests.Dtos;
using Inchain.Api.Features.DocumentRequests.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.DocumentRequests.Controllers;

[Route("api/document-requests")]
[ApiController]
[Authorize(Roles = ApplicationRole.RequesterRoleName)]
public class DocumentRequestsController : ControllerBase
{
    private readonly IDocumentRequestService _documentRequestService;

    public DocumentRequestsController(IDocumentRequestService documentRequestService)
    {
        _documentRequestService = documentRequestService;
    }

    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)]
    [RequestFormLimits(
        MultipartBodyLengthLimit = 20 * 1024 * 1024,
        MultipartBoundaryLengthLimit = 1024,
        MultipartHeadersLengthLimit = 16 * 1024,
        ValueLengthLimit = 10 * 1024 * 1024)]
    public async Task<IActionResult> CreateDocumentRequest([FromForm] CreateDocumentRequest request)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (requesterId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.CreateDocumentRequestAsync(
            requesterId,
            request.Title,
            request.Description,
            request.DocumentTypeId,
            request.Attachment);

        if (result.IsSuccess)
        {
            var documentRequest = result.DocumentRequest!;

            return Created($"/api/document-requests/{documentRequest.Id}", documentRequest);
        }

        if (result.IsNotFound)
        {
            return NotFound(result.Errors);
        }

        if (result.IsConfigurationError)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, result.Errors);
        }

        return BadRequest(result.Errors);
    }
}
