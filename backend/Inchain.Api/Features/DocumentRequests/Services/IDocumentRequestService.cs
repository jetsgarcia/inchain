using Inchain.Api.Features.DocumentRequests.Dtos;

namespace Inchain.Api.Features.DocumentRequests.Services;

public interface IDocumentRequestService
{
    Task<IReadOnlyList<DocumentRequestListItemResponse>> GetActiveDocumentRequestsForRequesterAsync(string requesterId);

    Task<DocumentRequestDetailResponse?> GetActiveDocumentRequestForRequesterAsync(
        int documentRequestId,
        string requesterId);

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
}
