using Inchain.Api.Data;
using Inchain.Api.Features.Common;
using Inchain.Api.Features.DocumentRequests.Dtos;
using Inchain.Api.Features.DocumentRequests.Mappers;
using Inchain.Api.Features.DocumentRequests.Repositories;

namespace Inchain.Api.Features.DocumentRequests.Services;

public class DocumentRequestService : IDocumentRequestService
{
    private const string AttachmentStorageDirectory = "Storage";
    private const string RequestAttachmentsDirectory = "RequestAttachments";

    private readonly IDocumentRequestRepository _documentRequestRepository;
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly ILogger<DocumentRequestService> _logger;

    public DocumentRequestService(
        IDocumentRequestRepository documentRequestRepository,
        IWebHostEnvironment webHostEnvironment,
        ILogger<DocumentRequestService> logger)
    {
        _documentRequestRepository = documentRequestRepository;
        _webHostEnvironment = webHostEnvironment;
        _logger = logger;
    }

    public async Task<IReadOnlyList<DocumentRequestListItemResponse>> GetActiveDocumentRequestsForRequesterAsync(
        string requesterId)
    {
        var documentRequests = await _documentRequestRepository.GetActiveDocumentRequestsForRequesterAsync(requesterId);

        return documentRequests
            .Select(DocumentRequestMapper.ToListItemResponse)
            .ToList();
    }

    public async Task<DocumentRequestDetailResponse?> GetActiveDocumentRequestForRequesterAsync(
        int documentRequestId,
        string requesterId)
    {
        var documentRequest = await _documentRequestRepository.GetActiveDocumentRequestForRequesterAsync(
            documentRequestId,
            requesterId);

        return documentRequest is null
            ? null
            : DocumentRequestMapper.ToDetailResponse(documentRequest);
    }

    public async Task<CreateDocumentRequestResult> CreateDocumentRequestAsync(
        string requesterId,
        string? title,
        string? description,
        int documentTypeId,
        IFormFile? attachment)
    {
        var validationErrors = ValidateRequest(title, description, documentTypeId, attachment);

        if (validationErrors.Count > 0)
        {
            return CreateDocumentRequestResult.Failed(validationErrors.ToArray());
        }

        var documentType = await _documentRequestRepository.GetDocumentTypeAsync(documentTypeId);

        if (documentType is null)
        {
            return CreateDocumentRequestResult.NotFound(
                ApiError.Create("DocumentTypeNotFound", "Document type was not found."));
        }

        if (!documentType.IsActive)
        {
            return CreateDocumentRequestResult.Failed(
                ApiError.Create("InactiveDocumentType", "Document type must be active."));
        }

        var draftStatus = await _documentRequestRepository.GetRequestStatusByNameAsync(ApplicationSeedData.DraftRequestStatusName);

        if (draftStatus is null)
        {
            _logger.LogError(
                "Document request creation failed because request status {StatusName} is not configured.",
                ApplicationSeedData.DraftRequestStatusName);

            return CreateDocumentRequestResult.ConfigurationError(
                ApiError.Create("DraftStatusNotConfigured", "Draft request status is not configured."));
        }

        var now = DateTime.UtcNow;
        var normalizedTitle = title!.Trim();
        var normalizedDescription = description!.Trim();
        var storedFilePath = string.Empty;

        await using var transaction = await _documentRequestRepository.BeginTransactionAsync();

        try
        {
            var documentRequest = new DocumentRequest
            {
                DocumentTypeId = documentType.Id,
                RequestStatusId = draftStatus.Id,
                RequestedById = requesterId,
                Title = normalizedTitle,
                Description = normalizedDescription,
                CreatedAt = now
            };

            await _documentRequestRepository.AddDocumentRequestAsync(documentRequest);
            await _documentRequestRepository.SaveChangesAsync();

            storedFilePath = await SaveAttachmentAsync(documentRequest.Id, attachment!);

            var requestAttachment = new RequestAttachment
            {
                DocumentRequestId = documentRequest.Id,
                UploadedById = requesterId,
                FileName = NormalizeFileName(attachment!.FileName),
                FilePath = storedFilePath,
                ContentType = string.IsNullOrWhiteSpace(attachment.ContentType) ? null : attachment.ContentType,
                FileSize = attachment.Length,
                IsCurrent = true,
                UploadedAt = now
            };

            await _documentRequestRepository.AddRequestAttachmentAsync(requestAttachment);
            await _documentRequestRepository.AddActivityLogAsync(new ActivityLog
            {
                DocumentRequestId = documentRequest.Id,
                UserId = requesterId,
                Action = "DocumentRequestCreated",
                Details = $"Created draft document request '{documentRequest.Id}'.",
                CreatedAt = now
            });

            await _documentRequestRepository.SaveChangesAsync();
            await transaction.CommitAsync();

            documentRequest.DocumentType = documentType;
            documentRequest.RequestStatus = draftStatus;

            _logger.LogInformation(
                "Requester {RequesterId} created draft document request {DocumentRequestId}.",
                requesterId,
                documentRequest.Id);

            return CreateDocumentRequestResult.Success(
                DocumentRequestMapper.ToResponse(documentRequest, requestAttachment));
        }
        catch
        {
            await transaction.RollbackAsync();
            DeleteStoredFile(storedFilePath);
            throw;
        }
    }

    public async Task<UpdateDocumentRequestResult> UpdateDocumentRequestAsync(
        int documentRequestId,
        string requesterId,
        string? title,
        string? description,
        int documentTypeId,
        IFormFile? attachment)
    {
        var validationErrors = ValidateRequestDetails(title, description, documentTypeId);
        var attachmentErrors = ValidateOptionalAttachment(attachment);

        validationErrors.AddRange(attachmentErrors);

        if (validationErrors.Count > 0)
        {
            return UpdateDocumentRequestResult.Failed(validationErrors.ToArray());
        }

        var documentRequest = await _documentRequestRepository.GetActiveDocumentRequestForRequesterForUpdateAsync(
            documentRequestId,
            requesterId);

        if (documentRequest is null)
        {
            return UpdateDocumentRequestResult.NotFound(
                ApiError.Create("DocumentRequestNotFound", "Document request was not found."));
        }

        if (documentRequest.RequestStatus.Name != ApplicationSeedData.DraftRequestStatusName)
        {
            return UpdateDocumentRequestResult.Failed(
                ApiError.Create("DocumentRequestNotDraft", "Only draft document requests can be updated."));
        }

        var documentType = await _documentRequestRepository.GetDocumentTypeAsync(documentTypeId);

        if (documentType is null)
        {
            return UpdateDocumentRequestResult.NotFound(
                ApiError.Create("DocumentTypeNotFound", "Document type was not found."));
        }

        if (!documentType.IsActive)
        {
            return UpdateDocumentRequestResult.Failed(
                ApiError.Create("InactiveDocumentType", "Document type must be active."));
        }

        var currentAttachment = documentRequest.RequestAttachments
            .Where(requestAttachment => requestAttachment.IsCurrent)
            .OrderByDescending(requestAttachment => requestAttachment.UploadedAt)
            .ThenByDescending(requestAttachment => requestAttachment.Id)
            .FirstOrDefault();

        if (attachment is null && currentAttachment is null)
        {
            return UpdateDocumentRequestResult.Failed(
                ApiError.Create("InvalidAttachment", "A current attachment is required."));
        }

        var now = DateTime.UtcNow;
        var storedFilePath = string.Empty;

        await using var transaction = await _documentRequestRepository.BeginTransactionAsync();

        try
        {
            documentRequest.Title = title!.Trim();
            documentRequest.Description = description!.Trim();
            documentRequest.DocumentTypeId = documentType.Id;
            documentRequest.UpdatedAt = now;

            if (attachment is not null)
            {
                foreach (var existingAttachment in documentRequest.RequestAttachments.Where(requestAttachment => requestAttachment.IsCurrent))
                {
                    existingAttachment.IsCurrent = false;
                }

                storedFilePath = await SaveAttachmentAsync(documentRequest.Id, attachment);

                var requestAttachment = new RequestAttachment
                {
                    DocumentRequestId = documentRequest.Id,
                    DocumentRequest = documentRequest,
                    UploadedById = requesterId,
                    FileName = NormalizeFileName(attachment.FileName),
                    FilePath = storedFilePath,
                    ContentType = string.IsNullOrWhiteSpace(attachment.ContentType) ? null : attachment.ContentType,
                    FileSize = attachment.Length,
                    IsCurrent = true,
                    UploadedAt = now
                };

                await _documentRequestRepository.AddRequestAttachmentAsync(requestAttachment);
            }

            await _documentRequestRepository.AddActivityLogAsync(new ActivityLog
            {
                DocumentRequestId = documentRequest.Id,
                UserId = requesterId,
                Action = "DocumentRequestUpdated",
                Details = $"Updated draft document request '{documentRequest.Id}'.",
                CreatedAt = now
            });

            await _documentRequestRepository.SaveChangesAsync();
            await transaction.CommitAsync();

            documentRequest.DocumentType = documentType;

            _logger.LogInformation(
                "Requester {RequesterId} updated draft document request {DocumentRequestId}.",
                requesterId,
                documentRequest.Id);

            return UpdateDocumentRequestResult.Success(DocumentRequestMapper.ToDetailResponse(documentRequest));
        }
        catch
        {
            await transaction.RollbackAsync();
            DeleteStoredFile(storedFilePath);
            throw;
        }
    }

    public async Task<DeleteDocumentRequestResult> DeleteDocumentRequestAsync(
        int documentRequestId,
        string requesterId)
    {
        var documentRequest = await _documentRequestRepository.GetActiveDocumentRequestForRequesterForDeleteAsync(
            documentRequestId,
            requesterId);

        if (documentRequest is null)
        {
            return DeleteDocumentRequestResult.NotFound(
                ApiError.Create("DocumentRequestNotFound", "Document request was not found."));
        }

        if (documentRequest.RequestStatus.Name != ApplicationSeedData.DraftRequestStatusName)
        {
            return DeleteDocumentRequestResult.Failed(
                ApiError.Create("DocumentRequestNotDraft", "Only draft document requests can be deleted."));
        }

        var now = DateTime.UtcNow;

        documentRequest.IsDeleted = true;
        documentRequest.DeletedAt = now;
        documentRequest.DeletedByUserId = requesterId;
        documentRequest.UpdatedAt = now;

        await _documentRequestRepository.AddActivityLogAsync(new ActivityLog
        {
            DocumentRequestId = documentRequest.Id,
            UserId = requesterId,
            Action = "DocumentRequestDeleted",
            Details = $"Soft deleted draft document request '{documentRequest.Id}'.",
            CreatedAt = now
        });

        await _documentRequestRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Requester {RequesterId} soft deleted draft document request {DocumentRequestId}.",
            requesterId,
            documentRequest.Id);

        return DeleteDocumentRequestResult.Success();
    }

    private static List<ApiError> ValidateRequest(
        string? title,
        string? description,
        int documentTypeId,
        IFormFile? attachment)
    {
        var errors = ValidateRequestDetails(title, description, documentTypeId);

        if (attachment is null || attachment.Length <= 0)
        {
            errors.Add(ApiError.Create("InvalidAttachment", "Attachment is required."));
        }
        else if (string.IsNullOrWhiteSpace(attachment.FileName))
        {
            errors.Add(ApiError.Create("InvalidAttachmentFileName", "Attachment file name is required."));
        }

        return errors;
    }

    private static List<ApiError> ValidateRequestDetails(
        string? title,
        string? description,
        int documentTypeId)
    {
        var errors = new List<ApiError>();

        if (string.IsNullOrWhiteSpace(title))
        {
            errors.Add(ApiError.Create("InvalidTitle", "Title is required."));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            errors.Add(ApiError.Create("InvalidDescription", "Description is required."));
        }

        if (documentTypeId <= 0)
        {
            errors.Add(ApiError.Create("InvalidDocumentTypeId", "Document type id is required."));
        }

        return errors;
    }

    private static List<ApiError> ValidateOptionalAttachment(IFormFile? attachment)
    {
        var errors = new List<ApiError>();

        if (attachment is null)
        {
            return errors;
        }

        if (attachment.Length <= 0)
        {
            errors.Add(ApiError.Create("InvalidAttachment", "Attachment must not be empty."));
        }
        else if (string.IsNullOrWhiteSpace(attachment.FileName))
        {
            errors.Add(ApiError.Create("InvalidAttachmentFileName", "Attachment file name is required."));
        }

        return errors;
    }

    private async Task<string> SaveAttachmentAsync(int documentRequestId, IFormFile attachment)
    {
        var storedFileName = CreateStoredFileName(attachment.FileName);
        var relativeDirectory = Path.Combine(
            AttachmentStorageDirectory,
            RequestAttachmentsDirectory,
            documentRequestId.ToString());
        var absoluteDirectory = Path.Combine(_webHostEnvironment.ContentRootPath, relativeDirectory);

        Directory.CreateDirectory(absoluteDirectory);

        var absoluteFilePath = Path.Combine(absoluteDirectory, storedFileName);

        try
        {
            await using var fileStream = new FileStream(absoluteFilePath, FileMode.CreateNew);
            await attachment.CopyToAsync(fileStream);
        }
        catch
        {
            if (File.Exists(absoluteFilePath))
            {
                File.Delete(absoluteFilePath);
            }

            throw;
        }

        return Path.Combine(relativeDirectory, storedFileName).Replace(Path.DirectorySeparatorChar, '/');
    }

    private void DeleteStoredFile(string storedFilePath)
    {
        if (string.IsNullOrWhiteSpace(storedFilePath))
        {
            return;
        }

        var absoluteFilePath = Path.Combine(
            _webHostEnvironment.ContentRootPath,
            storedFilePath.Replace('/', Path.DirectorySeparatorChar));

        try
        {
            if (!File.Exists(absoluteFilePath))
            {
                return;
            }

            File.Delete(absoluteFilePath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete stored attachment file {StoredFilePath}.", storedFilePath);
        }
    }

    private static string CreateStoredFileName(string fileName)
    {
        var extension = Path.GetExtension(NormalizeFileName(fileName));

        return $"{Guid.NewGuid():N}{extension}";
    }

    private static string NormalizeFileName(string fileName)
    {
        var normalizedFileName = Path.GetFileName(fileName).Trim();

        foreach (var invalidCharacter in Path.GetInvalidFileNameChars())
        {
            normalizedFileName = normalizedFileName.Replace(invalidCharacter, '_');
        }

        if (string.IsNullOrWhiteSpace(normalizedFileName))
        {
            normalizedFileName = "attachment";
        }

        if (normalizedFileName.Length <= 255)
        {
            return normalizedFileName;
        }

        var extension = Path.GetExtension(normalizedFileName);
        var baseName = Path.GetFileNameWithoutExtension(normalizedFileName);
        var maxBaseNameLength = Math.Max(1, 255 - extension.Length);

        return $"{baseName[..Math.Min(baseName.Length, maxBaseNameLength)]}{extension}";
    }
}
