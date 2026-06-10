namespace Inchain.Api.Data;

public class ApprovalAction
{
    public int Id { get; set; }

    public int DocumentRequestId { get; set; }

    public int? ApprovalRouteId { get; set; }

    public string ApproverId { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string? Comments { get; set; }

    public DateTime CreatedAt { get; set; }

    public DocumentRequest DocumentRequest { get; set; } = null!;

    public ApprovalRoute? ApprovalRoute { get; set; }

    public ApplicationUser Approver { get; set; } = null!;
}
