using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Features.Admin.ActivityLogs.Repositories;

public class AdminActivityLogRepository : IAdminActivityLogRepository
{
    private readonly ApplicationDbContext _dbContext;

    public AdminActivityLogRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ActivityLog>> GetActivityLogsAsync(
        string? actionType,
        string? targetEntityType,
        string? searchText)
    {
        var query = _dbContext.ActivityLogs
            .AsNoTracking()
            .Include(activityLog => activityLog.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(actionType))
        {
            var normalizedActionType = actionType.Trim();

            query = query.Where(activityLog => activityLog.Action == normalizedActionType);
        }

        if (!string.IsNullOrWhiteSpace(targetEntityType))
        {
            query = ApplyTargetEntityTypeFilter(query, targetEntityType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var normalizedSearchText = searchText.Trim();

            query = query.Where(activityLog =>
                activityLog.Action.Contains(normalizedSearchText) ||
                (activityLog.Details != null && activityLog.Details.Contains(normalizedSearchText)) ||
                (activityLog.User != null && activityLog.User.FullName.Contains(normalizedSearchText)) ||
                (activityLog.User != null && activityLog.User.Email != null && activityLog.User.Email.Contains(normalizedSearchText)));
        }

        return await query
            .OrderByDescending(activityLog => activityLog.CreatedAt)
            .ThenByDescending(activityLog => activityLog.Id)
            .ToListAsync();
    }

    private static IQueryable<ActivityLog> ApplyTargetEntityTypeFilter(
        IQueryable<ActivityLog> query,
        string targetEntityType)
    {
        if (string.Equals(targetEntityType, "DocumentRequest", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog =>
                activityLog.DocumentRequestId != null ||
                activityLog.Action.StartsWith("DocumentRequest"));
        }

        if (string.Equals(targetEntityType, "User", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog => activityLog.Action.StartsWith("User"));
        }

        if (string.Equals(targetEntityType, "DocumentType", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog => activityLog.Action.StartsWith("DocumentType"));
        }

        if (string.Equals(targetEntityType, "ApprovalRoute", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog => activityLog.Action.StartsWith("ApprovalRoute"));
        }

        return query.Where(activityLog => false);
    }
}
