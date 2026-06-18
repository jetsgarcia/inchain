using Inchain.Api.Features.DocumentRequests.Dtos;

namespace Inchain.Api.Features.DocumentRequests.Services;

public interface IDocumentRequestService
{
    Task<IReadOnlyList<DocumentRequestListItemResponse>> GetActiveDocumentRequestsForRequesterAsync(string requesterId);

    Task<IReadOnlyList<ApproverDocumentRequestListItemResponse>> GetPendingDocumentRequestsForApproverAsync(string approverId);

    Task<ApproverDocumentRequestDetailResponse?> GetPendingDocumentRequestForApproverAsync(
        int documentRequestId,
        string approverId);

    Task<DocumentRequestDetailResponse?> GetActiveDocumentRequestForRequesterAsync(
        int documentRequestId,
        string requesterId);

    Task<DocumentRequestAttachmentFileResult> GetCurrentAttachmentFileAsync(
        int documentRequestId,
        string userId);

    Task<IReadOnlyList<DocumentRequestActivityResponse>?> GetDocumentRequestActivitiesAsync(
        int documentRequestId,
        string userId);

    Task<CreateDocumentRequestResult> CreateDocumentRequestAsync(
        string requesterId,
        string? title,
        string? description,
        int documentTypeId,
        IFormFile? attachment);

    Task<UpdateDocumentRequestResult> UpdateDocumentRequestAsync(
        int documentRequestId,
        string requesterId,
        string? title,
        string? description,
        int documentTypeId,
        IFormFile? attachment);

    Task<DeleteDocumentRequestResult> DeleteDocumentRequestAsync(
        int documentRequestId,
        string requesterId);

    Task<SubmitDocumentRequestResult> SubmitDocumentRequestAsync(
        int documentRequestId,
        string requesterId);

    Task<CancelDocumentRequestResult> CancelDocumentRequestAsync(
        int documentRequestId,
        string requesterId);

    Task<ApproveDocumentRequestResult> ApproveDocumentRequestAsync(
        int documentRequestId,
        string approverId,
        string? remarks);

    Task<RejectDocumentRequestResult> RejectDocumentRequestAsync(
        int documentRequestId,
        string approverId,
        string? remarks);
}
