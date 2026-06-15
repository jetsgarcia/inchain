using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class CancelDocumentRequestResult
{
    public DocumentRequestDetailResponse? DocumentRequest { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => DocumentRequest is not null;

    public bool IsNotFound { get; private set; }

    public bool IsConfigurationError { get; private set; }

    public static CancelDocumentRequestResult Success(DocumentRequestDetailResponse documentRequest)
    {
        return new CancelDocumentRequestResult
        {
            DocumentRequest = documentRequest
        };
    }

    public static CancelDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new CancelDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static CancelDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new CancelDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }

    public static CancelDocumentRequestResult ConfigurationError(params ApiError[] errors)
    {
        return new CancelDocumentRequestResult
        {
            Errors = errors,
            IsConfigurationError = true
        };
    }
}
