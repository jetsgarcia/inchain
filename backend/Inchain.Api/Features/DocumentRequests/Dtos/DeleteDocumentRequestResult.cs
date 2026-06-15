using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class DeleteDocumentRequestResult
{
    public IReadOnlyList<ApiError> Errors { get; private set; } = Array.Empty<ApiError>();

    public bool IsSuccess { get; private set; }

    public bool IsNotFound { get; private set; }

    public static DeleteDocumentRequestResult Success()
    {
        return new DeleteDocumentRequestResult
        {
            IsSuccess = true
        };
    }

    public static DeleteDocumentRequestResult Failed(params ApiError[] errors)
    {
        return new DeleteDocumentRequestResult
        {
            Errors = errors
        };
    }

    public static DeleteDocumentRequestResult NotFound(params ApiError[] errors)
    {
        return new DeleteDocumentRequestResult
        {
            Errors = errors,
            IsNotFound = true
        };
    }
}
