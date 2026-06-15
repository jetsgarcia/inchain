using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class CreateDocumentRequestResult
{
    public DocumentRequestResponse? DocumentRequest { get; private set; }

    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess => DocumentRequest is not null;

    public bool IsNotFound { get; private set; }

    public bool IsConfigurationError { get; private set; }

    public static CreateDocumentRequestResult Success(DocumentRequestResponse documentRequest)
    {
        return new CreateDocumentRequestResult
        {
            DocumentRequest = documentRequest
        };
    }

    public static CreateDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new CreateDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static CreateDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new CreateDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }

    public static CreateDocumentRequestResult ConfigurationError(params ApiError[] errors)
    {
        return new CreateDocumentRequestResult
        {
            Errors = errors,
            IsConfigurationError = true
        };
    }
}
