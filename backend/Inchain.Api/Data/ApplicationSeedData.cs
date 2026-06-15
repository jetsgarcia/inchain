using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Data;

public static class ApplicationSeedData
{
    public const string DraftRequestStatusName = "Draft";
    public const string PendingApprovalRequestStatusName = "PendingApproval";
    public const string ApprovedRequestStatusName = "Approved";
    public const string RejectedRequestStatusName = "Rejected";
    public const string CancelledRequestStatusName = "Cancelled";

    private static readonly IReadOnlyDictionary<string, string> RequestStatuses = new Dictionary<string, string>
    {
        [DraftRequestStatusName] = "Document request has been saved as a draft.",
        [PendingApprovalRequestStatusName] = "Document request is pending approval.",
        [ApprovedRequestStatusName] = "Document request has been approved.",
        [RejectedRequestStatusName] = "Document request has been rejected.",
        [CancelledRequestStatusName] = "Document request has been cancelled."
    };

    public static async Task EnsureSeedDataAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        await EnsureRolesAsync(roleManager);
        await EnsureRequestStatusesAsync(dbContext);
    }

    private static async Task EnsureRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        await EnsureRoleAsync(roleManager, ApplicationRole.Admin);
        await EnsureRoleAsync(roleManager, ApplicationRole.Approver);
        await EnsureRoleAsync(roleManager, ApplicationRole.Requester);
    }

    private static async Task EnsureRoleAsync(RoleManager<ApplicationRole> roleManager, ApplicationRole role)
    {
        if (await roleManager.RoleExistsAsync(role.Name!))
        {
            return;
        }

        await roleManager.CreateAsync(role);
    }

    private static async Task EnsureRequestStatusesAsync(ApplicationDbContext dbContext)
    {
        var existingStatusNames = await dbContext.RequestStatuses
            .Where(requestStatus => RequestStatuses.Keys.Contains(requestStatus.Name))
            .Select(requestStatus => requestStatus.Name)
            .ToListAsync();
        var missingStatuses = RequestStatuses
            .Where(requestStatus => !existingStatusNames.Contains(requestStatus.Key))
            .Select(requestStatus => new RequestStatus
            {
                Name = requestStatus.Key,
                Description = requestStatus.Value
            })
            .ToList();

        if (missingStatuses.Count == 0)
        {
            return;
        }

        await dbContext.RequestStatuses.AddRangeAsync(missingStatuses);
        await dbContext.SaveChangesAsync();
    }
}
