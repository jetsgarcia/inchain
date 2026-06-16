using Inchain.Api.Data;
using Inchain.Api.Features.DocumentRequests.Dtos;

namespace Inchain.Api.Features.DocumentRequests.Mappers;

public static class DocumentRequestMapper
{
    public static ApproverDocumentRequestListItemResponse ToApproverListItemResponse(DocumentRequest documentRequest)
    {
        return new ApproverDocumentRequestListItemResponse
        {
            Id = documentRequest.Id,
            RequestNumber = CreateRequestNumber(documentRequest.Id),
            Title = documentRequest.Title,
            RequesterName = documentRequest.RequestedBy.FullName,
            RequesterEmail = documentRequest.RequestedBy.Email,
            DocumentTypeName = documentRequest.DocumentType.Name,
            StatusName = documentRequest.RequestStatus.Name,
            SubmittedAt = documentRequest.SubmittedAt,
            CreatedAt = documentRequest.CreatedAt
        };
    }

    public static DocumentRequestDetailResponse ToDetailResponse(DocumentRequest documentRequest)
    {
        var attachment = documentRequest.RequestAttachments
            .Where(requestAttachment => requestAttachment.IsCurrent)
            .OrderByDescending(requestAttachment => requestAttachment.UploadedAt)
            .ThenByDescending(requestAttachment => requestAttachment.Id)
            .FirstOrDefault();

        return new DocumentRequestDetailResponse
        {
            Id = documentRequest.Id,
            RequestNumber = CreateRequestNumber(documentRequest.Id),
            Title = documentRequest.Title,
            Description = documentRequest.Description ?? string.Empty,
            DocumentTypeName = documentRequest.DocumentType.Name,
            StatusName = documentRequest.RequestStatus.Name,
            CreatedAt = documentRequest.CreatedAt,
            UpdatedAt = documentRequest.UpdatedAt,
            SubmittedAt = documentRequest.SubmittedAt,
            Attachment = attachment is null
                ? null
                : new DocumentRequestAttachmentMetadataResponse
                {
                    Id = attachment.Id,
                    OriginalFileName = attachment.FileName,
                    ContentType = attachment.ContentType,
                    FileSize = attachment.FileSize,
                    UploadedAt = attachment.UploadedAt
                }
        };
    }

    public static DocumentRequestListItemResponse ToListItemResponse(DocumentRequest documentRequest)
    {
        return new DocumentRequestListItemResponse
        {
            Id = documentRequest.Id,
            RequestNumber = CreateRequestNumber(documentRequest.Id),
            Title = documentRequest.Title,
            DocumentTypeName = documentRequest.DocumentType.Name,
            StatusName = documentRequest.RequestStatus.Name,
            CreatedAt = documentRequest.CreatedAt,
            SubmittedAt = documentRequest.SubmittedAt
        };
    }

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

    private static string CreateRequestNumber(int documentRequestId)
    {
        return $"DR-{documentRequestId:D6}";
    }
}
