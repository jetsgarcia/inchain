using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class DocumentRequestAttachmentFileResult
{
    public string? PhysicalFilePath { get; private set; }

    public string? ContentType { get; private set; }

    public string? OriginalFileName { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => !string.IsNullOrWhiteSpace(PhysicalFilePath);

    public bool IsNotFound { get; private set; }

    public static DocumentRequestAttachmentFileResult Success(
        string physicalFilePath,
        string contentType,
        string originalFileName)
    {
        return new DocumentRequestAttachmentFileResult
        {
            PhysicalFilePath = physicalFilePath,
            ContentType = contentType,
            OriginalFileName = originalFileName
        };
    }

    public static DocumentRequestAttachmentFileResult NotFound(params ApiError[] errors)
    {
        return new DocumentRequestAttachmentFileResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }
}
