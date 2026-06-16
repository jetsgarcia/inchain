using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class RejectDocumentRequestResult
{
    public ApproverDocumentRequestDetailResponse? DocumentRequest { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => DocumentRequest is not null;

    public bool IsNotFound { get; private set; }

    public bool IsConfigurationError { get; private set; }

    public static RejectDocumentRequestResult Success(ApproverDocumentRequestDetailResponse documentRequest)
    {
        return new RejectDocumentRequestResult
        {
            DocumentRequest = documentRequest
        };
    }

    public static RejectDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new RejectDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static RejectDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new RejectDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }

    public static RejectDocumentRequestResult ConfigurationError(params ApiError[] errors)
    {
        return new RejectDocumentRequestResult
        {
            Errors = errors,
            IsConfigurationError = true
        };
    }
}
