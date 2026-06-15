using System.Security.Claims;
using Inchain.Api.Data;
using Inchain.Api.Features.Common;
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

    [HttpGet]
    public async Task<IActionResult> GetMyActiveDocumentRequests()
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (requesterId is null)
        {
            return Unauthorized();
        }

        var documentRequests = await _documentRequestService.GetActiveDocumentRequestsForRequesterAsync(requesterId);

        return Ok(documentRequests);
    }

    [HttpGet("{documentRequestId:int}")]
    public async Task<IActionResult> GetMyActiveDocumentRequest(int documentRequestId)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (requesterId is null)
        {
            return Unauthorized();
        }

        var documentRequest = await _documentRequestService.GetActiveDocumentRequestForRequesterAsync(
            documentRequestId,
            requesterId);

        if (documentRequest is null)
        {
            return NotFound(new[]
            {
                ApiError.Create("DocumentRequestNotFound", "Document request was not found.")
            });
        }

        return Ok(documentRequest);
    }

    [HttpPost("{documentRequestId:int}/submit")]
    public async Task<IActionResult> SubmitDocumentRequest(int documentRequestId)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (requesterId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.SubmitDocumentRequestAsync(documentRequestId, requesterId);

        if (result.IsSuccess)
        {
            return Ok(result.DocumentRequest);
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

    [HttpDelete("{documentRequestId:int}")]
    public async Task<IActionResult> DeleteDocumentRequest(int documentRequestId)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (requesterId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.DeleteDocumentRequestAsync(documentRequestId, requesterId);

        if (result.IsSuccess)
        {
            return NoContent();
        }

        if (result.IsNotFound)
        {
            return NotFound(result.Errors);
        }

        return BadRequest(result.Errors);
    }

    [HttpPut("{documentRequestId:int}")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    [RequestFormLimits(
        MultipartBodyLengthLimit = 20 * 1024 * 1024,
        MultipartBoundaryLengthLimit = 1024,
        MultipartHeadersLengthLimit = 16 * 1024,
        ValueLengthLimit = 10 * 1024 * 1024)]
    public async Task<IActionResult> UpdateDocumentRequest(
        int documentRequestId,
        [FromForm] UpdateDocumentRequest request)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (requesterId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.UpdateDocumentRequestAsync(
            documentRequestId,
            requesterId,
            request.Title,
            request.Description,
            request.DocumentTypeId,
            request.Attachment);

        if (result.IsSuccess)
        {
            return Ok(result.DocumentRequest);
        }

        if (result.IsNotFound)
        {
            return NotFound(result.Errors);
        }

        return BadRequest(result.Errors);
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
