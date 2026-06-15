namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class DocumentRequestAttachmentMetadataResponse
{
    public int Id { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string? ContentType { get; set; }

    public long FileSize { get; set; }

    public DateTime UploadedAt { get; set; }
}
