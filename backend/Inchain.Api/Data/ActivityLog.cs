namespace Inchain.Api.Data;

public class ActivityLog
{
    public int Id { get; set; }

    public int? DocumentRequestId { get; set; }

    public string? UserId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? Details { get; set; }

    public DateTime CreatedAt { get; set; }

    public DocumentRequest? DocumentRequest { get; set; }

    public ApplicationUser? User { get; set; }
}
