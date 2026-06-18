namespace Inchain.Api.Features.Admin.ActivityLogs.Dtos;

public class AdminActivityLogResponse
{
    public int Id { get; set; }

    public string TargetEntityType { get; set; } = string.Empty;

    public string? TargetEntityId { get; set; }

    public int? DocumentRequestId { get; set; }

    public string ActionType { get; set; } = string.Empty;

    public string? ActorNameOrEmail { get; set; }

    public string? Description { get; set; }

    public string? OldStatusName { get; set; }

    public string? NewStatusName { get; set; }

    public DateTime CreatedAt { get; set; }
}
