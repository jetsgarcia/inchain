using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class ApproveDocumentRequestResult
{
    public ApproverDocumentRequestDetailResponse? DocumentRequest { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => DocumentRequest is not null;

    public bool IsNotFound { get; private set; }

    public bool IsConfigurationError { get; private set; }

    public static ApproveDocumentRequestResult Success(ApproverDocumentRequestDetailResponse documentRequest)
    {
        return new ApproveDocumentRequestResult
        {
            DocumentRequest = documentRequest
        };
    }

    public static ApproveDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new ApproveDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static ApproveDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new ApproveDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }

    public static ApproveDocumentRequestResult ConfigurationError(params ApiError[] errors)
    {
        return new ApproveDocumentRequestResult
        {
            Errors = errors,
            IsConfigurationError = true
        };
    }
}
