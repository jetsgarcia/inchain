namespace Inchain.Api.Data;

public class RequestAttachment
{
    public int Id { get; set; }

    public int DocumentRequestId { get; set; }

    public string? UploadedById { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public string? ContentType { get; set; }

    public long FileSize { get; set; }

    public bool IsCurrent { get; set; } = true;

    public DateTime UploadedAt { get; set; }

    public DocumentRequest DocumentRequest { get; set; } = null!;

    public ApplicationUser? UploadedBy { get; set; }
}
