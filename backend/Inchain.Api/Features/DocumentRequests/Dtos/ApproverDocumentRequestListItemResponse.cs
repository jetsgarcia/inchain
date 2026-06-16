namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class ApproverDocumentRequestListItemResponse
{
    public int Id { get; set; }

    public string RequestNumber { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string RequesterName { get; set; } = string.Empty;

    public string? RequesterEmail { get; set; }

    public string DocumentTypeName { get; set; } = string.Empty;

    public string StatusName { get; set; } = string.Empty;

    public DateTime? SubmittedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
