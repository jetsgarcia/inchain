using Inchain.Api.Features.Admin.ActivityLogs.Dtos;

namespace Inchain.Api.Features.Admin.ActivityLogs.Services;

public interface IAdminActivityLogService
{
    Task<IReadOnlyList<AdminActivityLogResponse>> GetActivityLogsAsync(AdminActivityLogQuery query);
}
