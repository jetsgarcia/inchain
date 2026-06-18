using Inchain.Api.Features.Admin.ActivityLogs.Dtos;
using Inchain.Api.Features.Admin.ActivityLogs.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Admin.ActivityLogs.Controllers;

[Route("api/admin/activity-logs")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminActivityLogsController : ControllerBase
{
    private readonly IAdminActivityLogService _adminActivityLogService;

    public AdminActivityLogsController(IAdminActivityLogService adminActivityLogService)
    {
        _adminActivityLogService = adminActivityLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetActivityLogs([FromQuery] AdminActivityLogQuery query)
    {
        var activityLogs = await _adminActivityLogService.GetActivityLogsAsync(query);

        return Ok(activityLogs);
    }
}
