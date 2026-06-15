namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class DocumentRequestListItemResponse
{
    public int Id { get; set; }

    public string RequestNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string DocumentTypeName { get; set; } = string.Empty;

    public string StatusName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }
}
