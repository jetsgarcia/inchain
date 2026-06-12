namespace Inchain.Api.Data;

public class ApprovalRoute
{
    public int Id { get; set; }

    public int DocumentTypeId { get; set; }

    public string ApproverId { get; set; } = string.Empty;

    public int StepOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public string? CreatedByUserId { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedByUserId { get; set; }

    public DocumentType DocumentType { get; set; } = null!;

    public ApplicationUser Approver { get; set; } = null!;

    public ICollection<ApprovalAction> ApprovalActions { get; set; } = new List<ApprovalAction>();
}
