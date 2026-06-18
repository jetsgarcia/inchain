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
            .Include(activityLog => activityLog.PerformedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(actionType))
        {
            var normalizedActionType = actionType.Trim();

            query = query.Where(activityLog =>
                activityLog.ActionType == normalizedActionType ||
                activityLog.Action == normalizedActionType);
        }

        if (!string.IsNullOrWhiteSpace(targetEntityType))
        {
            query = ApplyTargetEntityTypeFilter(query, targetEntityType.Trim());
        }

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var normalizedSearchText = searchText.Trim();

            query = query.Where(activityLog =>
                (activityLog.ActionType != null && activityLog.ActionType.Contains(normalizedSearchText)) ||
                activityLog.Action.Contains(normalizedSearchText) ||
                (activityLog.TargetEntityType != null && activityLog.TargetEntityType.Contains(normalizedSearchText)) ||
                (activityLog.TargetEntityId != null && activityLog.TargetEntityId.Contains(normalizedSearchText)) ||
                (activityLog.Description != null && activityLog.Description.Contains(normalizedSearchText)) ||
                (activityLog.Details != null && activityLog.Details.Contains(normalizedSearchText)) ||
                (activityLog.User != null && activityLog.User.FullName.Contains(normalizedSearchText)) ||
                (activityLog.User != null && activityLog.User.Email != null && activityLog.User.Email.Contains(normalizedSearchText)) ||
                (activityLog.PerformedByUser != null && activityLog.PerformedByUser.FullName.Contains(normalizedSearchText)) ||
                (activityLog.PerformedByUser != null && activityLog.PerformedByUser.Email != null && activityLog.PerformedByUser.Email.Contains(normalizedSearchText)));
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
                activityLog.TargetEntityType == "DocumentRequest" ||
                activityLog.DocumentRequestId != null ||
                activityLog.Action.StartsWith("DocumentRequest"));
        }

        if (string.Equals(targetEntityType, "User", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog =>
                activityLog.TargetEntityType == "User" ||
                activityLog.Action.StartsWith("User") ||
                activityLog.ActionType == "RoleAssigned" ||
                activityLog.ActionType == "RoleRemoved");
        }

        if (string.Equals(targetEntityType, "DocumentType", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog =>
                activityLog.TargetEntityType == "DocumentType" ||
                activityLog.Action.StartsWith("DocumentType"));
        }

        if (string.Equals(targetEntityType, "ApprovalRoute", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(activityLog =>
                activityLog.TargetEntityType == "ApprovalRoute" ||
                activityLog.Action.StartsWith("ApprovalRoute") ||
                activityLog.ActionType == "RouteUpdated");
        }

        return query.Where(activityLog => false);
    }
}
