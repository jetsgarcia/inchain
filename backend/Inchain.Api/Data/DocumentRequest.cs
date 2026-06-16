namespace Inchain.Api.Data;

public class DocumentRequest
{
    public int Id { get; set; }

    public int DocumentTypeId { get; set; }

    public int RequestStatusId { get; set; }

    public string RequestedById { get; set; } = string.Empty;

    public string? AssignedApproverUserId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public string? DeletedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DocumentType DocumentType { get; set; } = null!;

    public RequestStatus RequestStatus { get; set; } = null!;

    public ApplicationUser RequestedBy { get; set; } = null!;

    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();

    public ICollection<ApprovalAction> ApprovalActions { get; set; } = new List<ApprovalAction>();

    public ICollection<RequestAttachment> RequestAttachments { get; set; } = new List<RequestAttachment>();
}
