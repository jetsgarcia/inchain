namespace Inchain.Api.Data;

public class ActivityLog
{
    public int Id { get; set; }

    public int? DocumentRequestId { get; set; }

    public string? UserId { get; set; }

    public string? PerformedByUserId { get; set; }

    public string? TargetEntityType { get; set; }

    public string? TargetEntityId { get; set; }

    public string? ActionType { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; }

    public DocumentRequest? DocumentRequest { get; set; }

    public ApplicationUser? User { get; set; }

    public ApplicationUser? PerformedByUser { get; set; }
}
