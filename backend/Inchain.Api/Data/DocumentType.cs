namespace Inchain.Api.Data;

public class DocumentType
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<ApprovalRoute> ApprovalRoutes { get; set; } = new List<ApprovalRoute>();

    public ICollection<DocumentRequest> DocumentRequests { get; set; } = new List<DocumentRequest>();
}
