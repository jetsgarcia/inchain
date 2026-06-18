using System.Security.Claims;
using Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;
using Inchain.Api.Features.Admin.ApprovalRoutes.Services;
using Inchain.Api.Features.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
public class ApprovalRoutesController : ControllerBase
{
    private readonly IApprovalRouteService _approvalRouteService;

    public ApprovalRoutesController(IApprovalRouteService approvalRouteService)
    {
        _approvalRouteService = approvalRouteService;
    }

    [HttpGet("api/admin/approval-routes")]
    public async Task<IActionResult> GetApprovalRoutes()
    {
        var approvalRoutes = await _approvalRouteService.GetApprovalRoutesAsync();

        return Ok(approvalRoutes);
    }

    [HttpGet("api/admin/approvers")]
    public async Task<IActionResult> GetApprovers()
    {
        var approvers = await _approvalRouteService.GetApproversAsync();

        return Ok(approvers);
    }

    [HttpPut("api/admin/document-types/{documentTypeId:int}/approver")]
    public async Task<IActionResult> AssignApprover(
        int documentTypeId,
        [FromBody] AssignApproverRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ApproverId))
        {
            return BadRequest(new[]
            {
                ApiError.Create("ApproverIdRequired", "ApproverId is required.")
            });
        }

        var result = await _approvalRouteService.AssignApproverAsync(
            documentTypeId,
            request.ApproverId,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!result.DocumentTypeFound)
        {
            return NotFound(result.Errors);
        }

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return NoContent();
    }

    [HttpPatch("api/admin/approval-routes/{approvalRouteId:int}/disable")]
    public async Task<IActionResult> DisableApprovalRoute(int approvalRouteId)
    {
        var isFound = await _approvalRouteService.DisableApprovalRouteAsync(
            approvalRouteId,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!isFound)
        {
            return NotFound(new[]
            {
                ApiError.Create("ApprovalRouteNotFound", "Approval route was not found.")
            });
        }

        return NoContent();
    }
}
