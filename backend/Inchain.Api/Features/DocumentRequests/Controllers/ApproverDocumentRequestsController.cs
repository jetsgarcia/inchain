using System.Security.Claims;
using Inchain.Api.Data;
using Inchain.Api.Features.Common;
using Inchain.Api.Features.DocumentRequests.Dtos;
using Inchain.Api.Features.DocumentRequests.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.DocumentRequests.Controllers;

[Route("api/approver/document-requests")]
[ApiController]
[Authorize(Roles = ApplicationRole.ApproverRoleName)]
public class ApproverDocumentRequestsController : ControllerBase
{
    private readonly IDocumentRequestService _documentRequestService;

    public ApproverDocumentRequestsController(IDocumentRequestService documentRequestService)
    {
        _documentRequestService = documentRequestService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyPendingDocumentRequests()
    {
        var approverId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (approverId is null)
        {
            return Unauthorized();
        }

        var documentRequests = await _documentRequestService.GetPendingDocumentRequestsForApproverAsync(approverId);

        return Ok(documentRequests);
    }

    [HttpGet("{documentRequestId:int}")]
    public async Task<IActionResult> GetMyPendingDocumentRequest(int documentRequestId)
    {
        var approverId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (approverId is null)
        {
            return Unauthorized();
        }

        var documentRequest = await _documentRequestService.GetPendingDocumentRequestForApproverAsync(
            documentRequestId,
            approverId);

        if (documentRequest is null)
        {
            return NotFound(new[]
            {
                ApiError.Create("DocumentRequestNotFound", "Document request was not found.")
            });
        }

        return Ok(documentRequest);
    }

    [HttpPost("{documentRequestId:int}/approve")]
    public async Task<IActionResult> ApproveDocumentRequest(
        int documentRequestId,
        [FromBody] ApproveDocumentRequest request)
    {
        var approverId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (approverId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.ApproveDocumentRequestAsync(
            documentRequestId,
            approverId,
            request.Remarks);

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

    [HttpPost("{documentRequestId:int}/reject")]
    public async Task<IActionResult> RejectDocumentRequest(
        int documentRequestId,
        [FromBody] RejectDocumentRequest request)
    {
        var approverId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (approverId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.RejectDocumentRequestAsync(
            documentRequestId,
            approverId,
            request.Remarks);

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
}
