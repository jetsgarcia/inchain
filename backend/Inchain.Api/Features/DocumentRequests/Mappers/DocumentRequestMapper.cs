using Inchain.Api.Data;
using Inchain.Api.Features.DocumentRequests.Dtos;

namespace Inchain.Api.Features.DocumentRequests.Mappers;

public static class DocumentRequestMapper
{
    public static DocumentRequestResponse ToResponse(
        DocumentRequest documentRequest,
        RequestAttachment attachment)
    {
        return new DocumentRequestResponse
        {
            Id = documentRequest.Id,
            DocumentTypeId = documentRequest.DocumentTypeId,
            DocumentTypeName = documentRequest.DocumentType.Name,
            Status = documentRequest.RequestStatus.Name,
            RequestedById = documentRequest.RequestedById,
            Title = documentRequest.Title,
            Description = documentRequest.Description ?? string.Empty,
            CreatedAt = documentRequest.CreatedAt,
            Attachment = new RequestAttachmentResponse
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                UploadedAt = attachment.UploadedAt
            }
        };
    }
}
