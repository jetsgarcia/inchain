using System.Security.Claims;
using Inchain.Api.Data;
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
}
