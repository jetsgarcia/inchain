namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class RequestAttachmentResponse
{
    public int Id { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public string? ContentType { get; set; }

    public long FileSize { get; set; }

    public DateTime UploadedAt { get; set; }
}
