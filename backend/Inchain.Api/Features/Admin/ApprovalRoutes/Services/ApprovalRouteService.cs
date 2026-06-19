using Inchain.Api.Data;
using Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;
using Inchain.Api.Features.Admin.ApprovalRoutes.Mappers;
using Inchain.Api.Features.Admin.ApprovalRoutes.Repositories;
using Inchain.Api.Features.Common;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Services;

public class ApprovalRouteService : IApprovalRouteService
{
    private readonly IApprovalRouteRepository _approvalRouteRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<ApprovalRouteService> _logger;

    public ApprovalRouteService(
        IApprovalRouteRepository approvalRouteRepository,
        UserManager<ApplicationUser> userManager,
        ILogger<ApprovalRouteService> logger)
    {
        _approvalRouteRepository = approvalRouteRepository;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ApprovalRouteResponse>> GetApprovalRoutesAsync()
    {
        var approvalRoutes = await _approvalRouteRepository.GetApprovalRoutesAsync();

        return approvalRoutes
            .Select(ApprovalRouteMapper.ToResponse)
            .ToList();
    }

    public async Task<ApprovalRouteResponse?> GetApprovalRouteAsync(int approvalRouteId)
    {
        var approvalRoute = await _approvalRouteRepository.GetApprovalRouteAsync(approvalRouteId);

        return approvalRoute is null ? null : ApprovalRouteMapper.ToResponse(approvalRoute);
    }

    public async Task<IReadOnlyList<ApproverResponse>> GetApproversAsync()
    {
        var approvers = await _userManager.GetUsersInRoleAsync(ApplicationRole.ApproverRoleName);

        return approvers
            .Where(approver => !UserDisabledState.IsDisabled(approver))
            .OrderBy(approver => approver.FullName)
            .Select(ApprovalRouteMapper.ToApproverResponse)
            .ToList();
    }

    public async Task<AssignApproverResult> AssignApproverAsync(
        int documentTypeId,
        string approverId,
        string? adminUserId)
    {
        var documentType = await _approvalRouteRepository.GetDocumentTypeAsync(documentTypeId);

        if (documentType is null)
        {
            _logger.LogInformation(
                "Approval route assignment skipped because document type {DocumentTypeId} was not found.",
                documentTypeId);

            return AssignApproverResult.NotFound();
        }

        if (!documentType.IsActive)
        {
            _logger.LogInformation(
                "Approval route assignment skipped because document type {DocumentTypeId} is inactive.",
                documentTypeId);

            return AssignApproverResult.Failed(
                ApiError.Create("InactiveDocumentType", "Document type must be active before assigning an approver."));
        }

        var approver = await _userManager.FindByIdAsync(approverId);

        if (approver is null)
        {
            _logger.LogInformation(
                "Approval route assignment skipped because approver {ApproverId} was not found.",
                approverId);

            return AssignApproverResult.Failed(
                ApiError.Create("ApproverNotFound", "Approver user was not found."));
        }

        if (UserDisabledState.IsDisabled(approver))
        {
            _logger.LogInformation(
                "Approval route assignment skipped because approver {ApproverId} is disabled.",
                approver.Id);

            return AssignApproverResult.Failed(
                ApiError.Create("InactiveApprover", "Assigned approver must be active."));
        }

        if (!await _userManager.IsInRoleAsync(approver, ApplicationRole.ApproverRoleName))
        {
            _logger.LogInformation(
                "Approval route assignment skipped because user {ApproverId} is not in the Approver role.",
                approver.Id);

            return AssignApproverResult.Failed(
                ApiError.Create("InvalidApproverRole", "Assigned user must be in the Approver role."));
        }

        var approvalRoute = await _approvalRouteRepository.GetApprovalRouteByDocumentTypeIdAsync(
            documentTypeId,
            trackChanges: true);
        var now = DateTime.UtcNow;
        string actionType;
        string description;

        if (approvalRoute is null)
        {
            approvalRoute = new ApprovalRoute
            {
                DocumentTypeId = documentType.Id,
                ApproverId = approver.Id,
                IsActive = true,
                CreatedAt = now,
                CreatedByUserId = adminUserId
            };

            await _approvalRouteRepository.AddAsync(approvalRoute);
            await _approvalRouteRepository.SaveChangesAsync();

            actionType = "ApprovalRouteCreated";
            description = $"Created approval route '{approvalRoute.Id}' for document type '{documentType.Id}' with approver '{approver.Id}'.";
        }
        else
        {
            var previousApproverId = approvalRoute.ApproverId;

            approvalRoute.ApproverId = approver.Id;
            approvalRoute.IsActive = true;
            approvalRoute.UpdatedAt = now;
            approvalRoute.UpdatedByUserId = adminUserId;

            actionType = "ApprovalRouteUpdated";
            description = $"Updated approval route '{approvalRoute.Id}' for document type '{documentType.Id}'. Changed approver from '{previousApproverId}' to '{approver.Id}'.";
        }

        await AddActivityLogAsync(
            adminUserId,
            approvalRoute.Id.ToString(),
            actionType,
            description,
            now);

        await _approvalRouteRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminUserId} assigned approver {ApproverId} to document type {DocumentTypeId}.",
            adminUserId,
            approver.Id,
            documentType.Id);

        return AssignApproverResult.Success();
    }

    public async Task<bool> DisableApprovalRouteAsync(int approvalRouteId, string? adminUserId)
    {
        var approvalRoute = await _approvalRouteRepository.GetApprovalRouteAsync(
            approvalRouteId,
            trackChanges: true);

        if (approvalRoute is null)
        {
            _logger.LogInformation("Approval route disable skipped because approval route {ApprovalRouteId} was not found.", approvalRouteId);

            return false;
        }

        if (!approvalRoute.IsActive)
        {
            _logger.LogInformation("Approval route {ApprovalRouteId} disable skipped because it is already disabled.", approvalRouteId);

            return true;
        }

        var now = DateTime.UtcNow;

        approvalRoute.IsActive = false;
        approvalRoute.UpdatedAt = now;
        approvalRoute.UpdatedByUserId = adminUserId;

        await AddActivityLogAsync(
            adminUserId,
            approvalRoute.Id.ToString(),
            "ApprovalRouteDisabled",
            $"Disabled approval route '{approvalRoute.Id}' for document type '{approvalRoute.DocumentTypeId}'.",
            now);

        await _approvalRouteRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminUserId} disabled approval route {ApprovalRouteId}.",
            adminUserId,
            approvalRoute.Id);

        return true;
    }

    private async Task AddActivityLogAsync(
        string? adminUserId,
        string approvalRouteId,
        string actionType,
        string description,
        DateTime createdAt)
    {
        await _approvalRouteRepository.AddActivityLogAsync(new ActivityLog
        {
            UserId = adminUserId,
            PerformedByUserId = adminUserId,
            TargetEntityType = "ApprovalRoute",
            TargetEntityId = approvalRouteId,
            ActionType = actionType,
            Action = actionType,
            Description = description,
            Details = description,
            CreatedAt = createdAt
        });
    }
}
