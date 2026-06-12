using Inchain.Api.Features.Common;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;

public class AssignApproverResult
{
    public bool Succeeded { get; set; }

    public bool DocumentTypeFound { get; set; } = true;

    public IReadOnlyList<ApiError> Errors { get; set; } = Array.Empty<ApiError>();

    public static AssignApproverResult Success()
    {
        return new AssignApproverResult
        {
            Succeeded = true
        };
    }

    public static AssignApproverResult NotFound()
    {
        return new AssignApproverResult
        {
            DocumentTypeFound = false,
            Errors = new[]
            {
                ApiError.Create("DocumentTypeNotFound", "Document type was not found.")
            }
        };
    }

    public static AssignApproverResult Failed(params ApiError[] errors)
    {
        return new AssignApproverResult
        {
            Errors = errors
        };
    }
}
