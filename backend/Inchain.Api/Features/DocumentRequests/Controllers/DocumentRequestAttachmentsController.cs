using System.Security.Claims;
using Inchain.Api.Data;
using Inchain.Api.Features.DocumentRequests.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.DocumentRequests.Controllers;

[Route("api/document-requests")]
[ApiController]
[Authorize(Roles = ApplicationRole.RequesterRoleName + "," + ApplicationRole.ApproverRoleName)]
public class DocumentRequestAttachmentsController : ControllerBase
{
    private readonly IDocumentRequestService _documentRequestService;

    public DocumentRequestAttachmentsController(IDocumentRequestService documentRequestService)
    {
        _documentRequestService = documentRequestService;
    }

    [HttpGet("{documentRequestId:int}/attachment")]
    public async Task<IActionResult> DownloadCurrentAttachment(int documentRequestId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await _documentRequestService.GetCurrentAttachmentFileAsync(documentRequestId, userId);

        if (!result.IsSuccess)
        {
            return NotFound(result.Errors);
        }

        var stream = new FileStream(
            result.PhysicalFilePath!,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 64 * 1024,
            options: FileOptions.Asynchronous | FileOptions.SequentialScan);

        return File(stream, result.ContentType!, result.OriginalFileName!);
    }
}
