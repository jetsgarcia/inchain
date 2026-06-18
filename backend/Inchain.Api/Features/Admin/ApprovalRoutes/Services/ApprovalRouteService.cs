using Inchain.Api.Data;
using Inchain.Api.Features.Admin.ApprovalRoutes.Dtos;
using Inchain.Api.Features.Admin.ApprovalRoutes.Mappers;
using Inchain.Api.Features.Admin.ApprovalRoutes.Repositories;
using Inchain.Api.Features.Common;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.ApprovalRoutes.Services;

public class ApprovalRouteService : IApprovalRouteService
{
    private const int DefaultStepOrder = 1;

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

    public async Task<IReadOnlyList<ApproverResponse>> GetApproversAsync()
    {
        var approvers = await _userManager.GetUsersInRoleAsync(ApplicationRole.ApproverRoleName);

        return approvers
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
        string action;
        string details;

        if (approvalRoute is null)
        {
            approvalRoute = new ApprovalRoute
            {
                DocumentTypeId = documentType.Id,
                ApproverId = approver.Id,
                StepOrder = DefaultStepOrder,
                IsActive = true,
                CreatedAt = now,
                CreatedByUserId = adminUserId
            };

            await _approvalRouteRepository.AddAsync(approvalRoute);
            await _approvalRouteRepository.SaveChangesAsync();

            action = "ApprovalRouteCreated";
            details = $"Created approval route '{approvalRoute.Id}' for document type '{documentType.Id}' with approver '{approver.Id}'.";
        }
        else
        {
            var previousApproverId = approvalRoute.ApproverId;

            approvalRoute.ApproverId = approver.Id;
            approvalRoute.StepOrder = DefaultStepOrder;
            approvalRoute.IsActive = true;
            approvalRoute.UpdatedAt = now;
            approvalRoute.UpdatedByUserId = adminUserId;

            action = "ApprovalRouteUpdated";
            details = $"Updated approval route '{approvalRoute.Id}' for document type '{documentType.Id}'. Changed approver from '{previousApproverId}' to '{approver.Id}'.";
        }

        await _approvalRouteRepository.AddActivityLogAsync(new ActivityLog
        {
            UserId = adminUserId,
            Action = action,
            Details = details,
            CreatedAt = now
        });

        await _approvalRouteRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Admin {AdminUserId} assigned approver {ApproverId} to document type {DocumentTypeId}.",
            adminUserId,
            approver.Id,
            documentType.Id);

        return AssignApproverResult.Success();
    }
}
