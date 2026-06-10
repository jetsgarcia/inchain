using Inchain.Api.Data;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> userManager;
    private readonly RoleManager<IdentityRole> roleManager;

    public UserService(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        this.userManager = userManager;
        this.roleManager = roleManager;
    }

    public async Task<(IdentityResult Result, ApplicationUser? User)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
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
            return (result, null);
        }

        var addToRoleResult = await userManager.AddToRoleAsync(user, role);

        if (!addToRoleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);

            return (addToRoleResult, null);
        }

        return (addToRoleResult, user);
    }

    public async Task<(IdentityResult Result, ApplicationUser? User)> EditUserRoleAsync(string userId, string role)
    {
        var user = await userManager.FindByIdAsync(userId);

        if (user is null)
        {
            return (IdentityResult.Failed(new IdentityError
            {
                Code = "UserNotFound",
                Description = $"User with id '{userId}' was not found."
            }), null);
        }

        if (!await roleManager.RoleExistsAsync(role))
        {
            return (CreateRoleNotFoundResult(role), user);
        }

        var currentRoles = await userManager.GetRolesAsync(user);

        if (!currentRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
        {
            var addResult = await userManager.AddToRoleAsync(user, role);

            if (!addResult.Succeeded)
            {
                return (addResult, user);
            }
        }

        var rolesToRemove = currentRoles
            .Where(currentRole => !string.Equals(currentRole, role, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        if (rolesToRemove.Length == 0)
        {
            return (IdentityResult.Success, user);
        }

        var removeResult = await userManager.RemoveFromRolesAsync(user, rolesToRemove);

        return (removeResult, user);
    }

    private static IdentityResult CreateRoleNotFoundResult(string role)
    {
        return IdentityResult.Failed(new IdentityError
        {
            Code = "RoleNotFound",
            Description = $"Role '{role}' was not found."
        });
    }
}
