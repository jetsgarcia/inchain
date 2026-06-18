using System.Security.Claims;
using Inchain.Api.Data;
using Inchain.Api.Features.Common;
using Inchain.Api.Features.DocumentRequests.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.DocumentRequests.Controllers;

[Route("api/document-requests")]
[ApiController]
[Authorize(Roles = ApplicationRole.RequesterRoleName + "," + ApplicationRole.ApproverRoleName)]
public class DocumentRequestActivitiesController : ControllerBase
{
    private readonly IDocumentRequestService _documentRequestService;

    public DocumentRequestActivitiesController(IDocumentRequestService documentRequestService)
    {
        _documentRequestService = documentRequestService;
    }

    [HttpGet("{documentRequestId:int}/activities")]
    public async Task<IActionResult> GetDocumentRequestActivities(int documentRequestId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
        {
            return Unauthorized();
        }

        var activities = await _documentRequestService.GetDocumentRequestActivitiesAsync(
            documentRequestId,
            userId);

        if (activities is null)
        {
            return NotFound(new[]
            {
                ApiError.Create("DocumentRequestNotFound", "Document request was not found.")
            });
        }

        return Ok(activities);
    }
}
