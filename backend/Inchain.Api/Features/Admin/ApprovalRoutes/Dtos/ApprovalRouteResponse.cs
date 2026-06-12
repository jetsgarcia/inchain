namespace Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;

public class ApprovalRouteResponse
{
    public int Id { get; set; }

    public int DocumentTypeId { get; set; }

    public string DocumentTypeName { get; set; } = string.Empty;

    public string ApproverId { get; set; } = string.Empty;

    public string ApproverFullName { get; set; } = string.Empty;

    public string? ApproverEmail { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? CreatedByUserId { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedByUserId { get; set; }
}
