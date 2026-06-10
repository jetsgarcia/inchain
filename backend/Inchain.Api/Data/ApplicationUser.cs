using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Data;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;

    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();

    public ICollection<ApprovalAction> ApprovalActions { get; set; } = new List<ApprovalAction>();

    public ICollection<ApprovalRoute> ApprovalRoutes { get; set; } = new List<ApprovalRoute>();

    public ICollection<DocumentRequest> DocumentRequests { get; set; } = new List<DocumentRequest>();

    public ICollection<RequestAttachment> RequestAttachments { get; set; } = new List<RequestAttachment>();
}
