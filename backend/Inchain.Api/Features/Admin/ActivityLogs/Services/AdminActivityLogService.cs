using System.Text.RegularExpressions;
using Inchain.Api.Data;
using Inchain.Api.Features.Admin.ActivityLogs.Dtos;
using Inchain.Api.Features.Admin.ActivityLogs.Repositories;

namespace Inchain.Api.Features.Admin.ActivityLogs.Services;

public class AdminActivityLogService : IAdminActivityLogService
{
    private static readonly Regex QuotedValueRegex = new("'([^']+)'", RegexOptions.Compiled);

    private readonly IAdminActivityLogRepository _adminActivityLogRepository;

    public AdminActivityLogService(IAdminActivityLogRepository adminActivityLogRepository)
    {
        _adminActivityLogRepository = adminActivityLogRepository;
    }

    public async Task<IReadOnlyList<AdminActivityLogResponse>> GetActivityLogsAsync(AdminActivityLogQuery query)
    {
        var activityLogs = await _adminActivityLogRepository.GetActivityLogsAsync(
            query.ActionType,
            query.TargetEntityType,
            query.SearchText);

        return activityLogs
            .Select(ToResponse)
            .ToList();
    }

    private static AdminActivityLogResponse ToResponse(ActivityLog activityLog)
    {
        var target = GetTarget(activityLog);
        var actionType = GetActionType(activityLog);
        var statusTransition = GetStatusTransition(actionType);

        return new AdminActivityLogResponse
        {
            Id = activityLog.Id,
            TargetEntityType = target.EntityType,
            TargetEntityId = target.EntityId,
            DocumentRequestId = activityLog.DocumentRequestId,
            ActionType = actionType,
            ActorNameOrEmail = GetActorNameOrEmail(activityLog),
            Description = activityLog.Description ?? activityLog.Details,
            OldStatusName = statusTransition.OldStatusName,
            NewStatusName = statusTransition.NewStatusName,
            CreatedAt = activityLog.CreatedAt
        };
    }

    private static (string EntityType, string? EntityId) GetTarget(ActivityLog activityLog)
    {
        if (!string.IsNullOrWhiteSpace(activityLog.TargetEntityType))
        {
            return (activityLog.TargetEntityType, activityLog.TargetEntityId);
        }

        if (activityLog.DocumentRequestId.HasValue || activityLog.Action.StartsWith("DocumentRequest", StringComparison.OrdinalIgnoreCase))
        {
            return ("DocumentRequest", activityLog.DocumentRequestId?.ToString());
        }

        if (activityLog.Action.StartsWith("User", StringComparison.OrdinalIgnoreCase))
        {
            return ("User", GetFirstQuotedValue(activityLog.Details));
        }

        if (activityLog.Action.StartsWith("DocumentType", StringComparison.OrdinalIgnoreCase))
        {
            return ("DocumentType", GetFirstQuotedValue(activityLog.Details));
        }

        if (activityLog.Action.StartsWith("ApprovalRoute", StringComparison.OrdinalIgnoreCase))
        {
            return ("ApprovalRoute", GetFirstQuotedValue(activityLog.Details));
        }

        return ("System", null);
    }

    private static (string? OldStatusName, string? NewStatusName) GetStatusTransition(string action)
    {
        return action switch
        {
            "DocumentRequestCreated" => (null, ApplicationSeedData.DraftRequestStatusName),
            "DocumentRequestSubmitted" => (ApplicationSeedData.DraftRequestStatusName, ApplicationSeedData.PendingApprovalRequestStatusName),
            "DocumentRequestApproved" => (ApplicationSeedData.PendingApprovalRequestStatusName, ApplicationSeedData.ApprovedRequestStatusName),
            "DocumentRequestRejected" => (ApplicationSeedData.PendingApprovalRequestStatusName, ApplicationSeedData.RejectedRequestStatusName),
            "DocumentRequestCancelled" => (ApplicationSeedData.PendingApprovalRequestStatusName, ApplicationSeedData.CancelledRequestStatusName),
            "DocumentRequestDeleted" => (ApplicationSeedData.DraftRequestStatusName, null),
            _ => (null, null)
        };
    }

    private static string? GetActorNameOrEmail(ActivityLog activityLog)
    {
        if (activityLog.PerformedByUser is not null)
        {
            if (!string.IsNullOrWhiteSpace(activityLog.PerformedByUser.FullName))
            {
                return activityLog.PerformedByUser.FullName;
            }

            return !string.IsNullOrWhiteSpace(activityLog.PerformedByUser.Email)
                ? activityLog.PerformedByUser.Email
                : activityLog.PerformedByUserId;
        }

        if (!string.IsNullOrWhiteSpace(activityLog.PerformedByUserId))
        {
            return activityLog.PerformedByUserId;
        }

        if (activityLog.User is null)
        {
            return activityLog.UserId;
        }

        if (!string.IsNullOrWhiteSpace(activityLog.User.FullName))
        {
            return activityLog.User.FullName;
        }

        return !string.IsNullOrWhiteSpace(activityLog.User.Email)
            ? activityLog.User.Email
            : activityLog.UserId;
    }

    private static string GetActionType(ActivityLog activityLog)
    {
        return string.IsNullOrWhiteSpace(activityLog.ActionType)
            ? activityLog.Action
            : activityLog.ActionType;
    }

    private static string? GetFirstQuotedValue(string? details)
    {
        if (string.IsNullOrWhiteSpace(details))
        {
            return null;
        }

        var match = QuotedValueRegex.Match(details);

        return match.Success ? match.Groups[1].Value : null;
    }
}
