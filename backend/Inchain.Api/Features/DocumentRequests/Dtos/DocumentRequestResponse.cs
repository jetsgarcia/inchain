namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class DocumentRequestResponse
{
    public int Id { get; set; }

    public int DocumentTypeId { get; set; }

    public string DocumentTypeName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string RequestedById { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public RequestAttachmentResponse Attachment { get; set; } = null!;
}
