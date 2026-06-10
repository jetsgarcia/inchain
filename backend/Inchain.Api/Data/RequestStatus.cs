namespace Inchain.Api.Data;

public class RequestStatus
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ICollection<DocumentRequest> DocumentRequests { get; set; } = new List<DocumentRequest>();
}
