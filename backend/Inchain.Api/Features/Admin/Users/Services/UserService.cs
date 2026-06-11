using Inchain.Api.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Inchain.Api.Features.Admin.Users.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> userManager;
    private readonly RoleManager<ApplicationRole> roleManager;
    private readonly ILogger<UserService> logger;

    public UserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger<UserService> logger)
    {
        this.userManager = userManager;
        this.roleManager = roleManager;
        this.logger = logger;
    }

    public async Task<IReadOnlyList<(ApplicationUser User, string Role)>> GetUsersAsync()
    {
        var users = await userManager.Users.ToListAsync();
        var usersWithRoles = new List<(ApplicationUser User, string Role)>();

        foreach (var user in users)
        {
            usersWithRoles.Add((user, await GetUserRoleAsync(user)));
        }

        return usersWithRoles;
    }

    public async Task<(ApplicationUser? User, string Role)> GetUserAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return (null, string.Empty);
        }

        return (user, await GetUserRoleAsync(user));
    }

    public async Task<(IdentityResult Result, ApplicationUser? User)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            logger.LogWarning("User creation failed because role {Role} was not found.", role);

            return (CreateRoleNotFoundResult(role), null);
        }

        var user = new ApplicationUser
        {
            FullName = fullName,
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            logger.LogWarning(
                "User creation failed for email {Email}. Errors: {Errors}",
                email,
                GetIdentityErrorDescriptions(result));

            return (result, null);
        }

        var roleResult = await SetUserRoleAsync(user, role);

        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);

            logger.LogWarning(
                "User {UserId} was deleted because role assignment to {Role} failed. Errors: {Errors}",
                user.Id,
                role,
                GetIdentityErrorDescriptions(roleResult));

            return (roleResult, null);
        }

        logger.LogInformation("Created user {UserId} with role {Role}.", user.Id, role);

        return (roleResult, user);
    }

    public async Task<(IdentityResult Result, ApplicationUser? User)> EditUserAsync(
        string userId,
        string? fullName,
        string? email,
        string? role)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            logger.LogWarning("User edit failed because user {UserId} was not found.", userId);

            return (CreateUserNotFoundResult(userId), null);
        }

        if (!string.IsNullOrWhiteSpace(role) && !await roleManager.RoleExistsAsync(role))
        {
            logger.LogWarning("User {UserId} edit failed because role {Role} was not found.", userId, role);

            return (CreateRoleNotFoundResult(role), user);
        }

        if (!string.IsNullOrWhiteSpace(fullName))
        {
            user.FullName = fullName;
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            user.UserName = email;
            user.Email = email;
            user.EmailConfirmed = true;
        }

        var updateResult = await userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            logger.LogWarning(
                "User {UserId} profile update failed. Errors: {Errors}",
                user.Id,
                GetIdentityErrorDescriptions(updateResult));

            return (updateResult, user);
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleResult = await SetUserRoleAsync(user, role);

            if (!roleResult.Succeeded)
            {
                logger.LogWarning(
                    "User {UserId} role update to {Role} failed. Errors: {Errors}",
                    user.Id,
                    role,
                    GetIdentityErrorDescriptions(roleResult));

                return (roleResult, user);
            }
        }

        logger.LogInformation("Updated user {UserId}. Role update requested: {RoleUpdateRequested}.", user.Id, !string.IsNullOrWhiteSpace(role));

        return (IdentityResult.Success, user);
    }

    private async Task<string> GetUserRoleAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);

        return roles.FirstOrDefault() ?? string.Empty;
    }

    private async Task<IdentityResult> SetUserRoleAsync(ApplicationUser user, string role)
    {
        var currentRoles = await userManager.GetRolesAsync(user);
        var roleAdded = false;

        if (currentRoles.Contains(ApplicationRole.AdminRoleName, StringComparer.OrdinalIgnoreCase) &&
            !string.Equals(role, ApplicationRole.AdminRoleName, StringComparison.OrdinalIgnoreCase) &&
            !await HasAnotherAdminUserAsync(user.Id))
        {
            logger.LogWarning(
                "Prevented role change for user {UserId} from Admin to {Role} because it would leave the system without an Admin user.",
                user.Id,
                role);

            return CreateLastAdminRoleChangeResult();
        }

        if (!currentRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
        {
            var addResult = await userManager.AddToRoleAsync(user, role);

            if (!addResult.Succeeded)
            {
                logger.LogWarning(
                    "Adding user {UserId} to role {Role} failed. Errors: {Errors}",
                    user.Id,
                    role,
                    GetIdentityErrorDescriptions(addResult));

                return addResult;
            }

            roleAdded = true;
        }

        var rolesToRemove = currentRoles
            .Where(currentRole => !string.Equals(currentRole, role, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        if (rolesToRemove.Length == 0)
        {
            if (roleAdded)
            {
                logger.LogInformation("Assigned role {Role} to user {UserId}.", role, user.Id);
            }

            return IdentityResult.Success;
        }

        var removeResult = await userManager.RemoveFromRolesAsync(user, rolesToRemove);

        if (!removeResult.Succeeded)
        {
            logger.LogWarning(
                "Removing roles {Roles} from user {UserId} failed while setting role {Role}. Errors: {Errors}",
                string.Join(", ", rolesToRemove),
                user.Id,
                role,
                GetIdentityErrorDescriptions(removeResult));

            return removeResult;
        }

        logger.LogInformation(
            "Changed user {UserId} role from {PreviousRoles} to {Role}.",
            user.Id,
            string.Join(", ", currentRoles),
            role);

        return removeResult;
    }

    private async Task<bool> HasAnotherAdminUserAsync(string userId)
    {
        var adminUsers = await userManager.GetUsersInRoleAsync(ApplicationRole.AdminRoleName);

        return adminUsers.Any(adminUser => adminUser.Id != userId);
    }

    private static IdentityResult CreateUserNotFoundResult(string userId)
    {
        return IdentityResult.Failed(new IdentityError
        {
            Code = "UserNotFound",
            Description = $"User with id '{userId}' was not found."
        });
    }

    private static IdentityResult CreateRoleNotFoundResult(string role)
    {
        return IdentityResult.Failed(new IdentityError
        {
            Code = "RoleNotFound",
            Description = $"Role '{role}' was not found."
        });
    }

    private static IdentityResult CreateLastAdminRoleChangeResult()
    {
        return IdentityResult.Failed(new IdentityError
        {
            Code = "LastAdminRoleChange",
            Description = "Role changes must leave at least one Admin user in the system."
        });
    }

    private static string GetIdentityErrorDescriptions(IdentityResult result)
    {
        return string.Join("; ", result.Errors.Select(error => error.Description));
    }
}
