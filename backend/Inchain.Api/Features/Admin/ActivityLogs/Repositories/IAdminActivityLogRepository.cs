using Inchain.Api.Data;

namespace Inchain.Api.Features.Admin.ActivityLogs.Repositories;

public interface IAdminActivityLogRepository
{
    Task<IReadOnlyList<ActivityLog>> GetActivityLogsAsync(
        string? actionType,
        string? targetEntityType,
        string? searchText);
}
