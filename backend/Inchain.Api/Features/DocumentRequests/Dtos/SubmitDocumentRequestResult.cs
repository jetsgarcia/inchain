using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class SubmitDocumentRequestResult
{
    public DocumentRequestDetailResponse? DocumentRequest { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => DocumentRequest is not null;

    public bool IsNotFound { get; private set; }

    public bool IsConfigurationError { get; private set; }

    public static SubmitDocumentRequestResult Success(DocumentRequestDetailResponse documentRequest)
    {
        return new SubmitDocumentRequestResult
        {
            DocumentRequest = documentRequest
        };
    }

    public static SubmitDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new SubmitDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static SubmitDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new SubmitDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }

    public static SubmitDocumentRequestResult ConfigurationError(params ApiError[] errors)
    {
        return new SubmitDocumentRequestResult
        {
            Errors = errors,
            IsConfigurationError = true
        };
    }
}
