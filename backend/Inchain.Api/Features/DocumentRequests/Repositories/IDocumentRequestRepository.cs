using Inchain.Api.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace Inchain.Api.Features.DocumentRequests.Repositories;

public interface IDocumentRequestRepository
{
    Task<IDbContextTransaction> BeginTransactionAsync();

    Task<DocumentType?> GetDocumentTypeAsync(int documentTypeId);

    Task<RequestStatus?> GetRequestStatusByNameAsync(string name);

    Task<IReadOnlyList<DocumentRequest>> GetActiveDocumentRequestsForRequesterAsync(string requesterId);

    Task<IReadOnlyList<DocumentRequest>> GetPendingDocumentRequestsForApproverAsync(string approverId);

    Task<DocumentRequest?> GetPendingDocumentRequestForApproverAsync(int documentRequestId, string approverId);

    Task<DocumentRequest?> GetPendingDocumentRequestForApproverForUpdateAsync(int documentRequestId, string approverId);

    Task<DocumentRequest?> GetActiveDocumentRequestForRequesterAsync(int documentRequestId, string requesterId);

    Task<DocumentRequest?> GetActiveDocumentRequestForAttachmentAccessAsync(
        int documentRequestId,
        string userId);

    Task<DocumentRequest?> GetDocumentRequestForActivityAccessAsync(
        int documentRequestId,
        string userId);

    Task<DocumentRequest?> GetActiveDocumentRequestForRequesterForUpdateAsync(
        int documentRequestId,
        string requesterId);

    Task<DocumentRequest?> GetActiveDocumentRequestForRequesterForDeleteAsync(
        int documentRequestId,
        string requesterId);

    Task<IReadOnlyList<ApprovalRoute>> GetActiveApprovalRoutesForDocumentTypeAsync(int documentTypeId);

    Task AddDocumentRequestAsync(DocumentRequest documentRequest);

    Task AddRequestAttachmentAsync(RequestAttachment requestAttachment);

    Task AddApprovalActionAsync(ApprovalAction approvalAction);

    Task AddActivityLogAsync(ActivityLog activityLog);

    Task SaveChangesAsync();
}
