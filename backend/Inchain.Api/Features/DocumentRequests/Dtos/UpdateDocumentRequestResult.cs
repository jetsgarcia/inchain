using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class UpdateDocumentRequestResult
{
    public DocumentRequestDetailResponse? DocumentRequest { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => DocumentRequest is not null;

    public bool IsNotFound { get; private set; }

    public static UpdateDocumentRequestResult Success(DocumentRequestDetailResponse documentRequest)
    {
        return new UpdateDocumentRequestResult
        {
            DocumentRequest = documentRequest
        };
    }

    public static UpdateDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new UpdateDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static UpdateDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new UpdateDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }
}
