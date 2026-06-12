using Inchain.Api.Data;
using Inchain.Api.Features.Admin.Users.Dtos;
using Inchain.Api.Features.Admin.Users.Mappers;
using Inchain.Api.Features.Admin.Users.Repositories;
using Inchain.Api.Features.Common;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(IUserRepository userRepository, ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<IReadOnlyList<UserResponse>> GetUsersAsync()
    {
        var users = await _userRepository.GetUsersAsync();
        var userResponses = new List<UserResponse>();

        foreach (var user in users)
        {
            userResponses.Add(UserMapper.ToResponse(user, await GetUserRoleAsync(user)));
        }

        return userResponses;
    }

    public async Task<UserResponse?> GetUserAsync(string userId)
    {
        var user = await _userRepository.FindByIdAsync(userId);

        if (user is null)
        {
            return null;
        }

        return UserMapper.ToResponse(user, await GetUserRoleAsync(user));
    }

    public async Task<(IdentityResult Result, UserResponse? User)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role)
    {
        if (!await _userRepository.RoleExistsAsync(role))
        {
            _logger.LogWarning("User creation failed because role {Role} was not found.", role);

            return (CreateRoleNotFoundResult(role), null);
        }

        var user = new ApplicationUser
        {
            FullName = fullName,
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await _userRepository.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            _logger.LogWarning(
                "User creation failed for email {Email}. Errors: {Errors}",
                email,
                GetIdentityErrorDescriptions(result));

            return (result, null);
        }

        var roleResult = await SetUserRoleAsync(user, role);

        if (!roleResult.Succeeded)
        {
            await _userRepository.DeleteAsync(user);

            _logger.LogWarning(
                "User {UserId} was deleted because role assignment to {Role} failed. Errors: {Errors}",
                user.Id,
                role,
                GetIdentityErrorDescriptions(roleResult));

            return (roleResult, null);
        }

        _logger.LogInformation("Created user {UserId} with role {Role}.", user.Id, role);

        return (roleResult, UserMapper.ToResponse(user, role));
    }

    public async Task<(IdentityResult Result, bool UserFound)> EditUserAsync(
        string userId,
        string? fullName,
        string? email,
        string? role)
    {
        var user = await _userRepository.FindByIdAsync(userId);

        if (user is null)
        {
            _logger.LogWarning("User edit failed because user {UserId} was not found.", userId);

            return (CreateUserNotFoundResult(userId), false);
        }

        if (!string.IsNullOrWhiteSpace(role) && !await _userRepository.RoleExistsAsync(role))
        {
            _logger.LogWarning("User {UserId} edit failed because role {Role} was not found.", userId, role);

            return (CreateRoleNotFoundResult(role), true);
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

        var updateResult = await _userRepository.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            _logger.LogWarning(
                "User {UserId} profile update failed. Errors: {Errors}",
                user.Id,
                GetIdentityErrorDescriptions(updateResult));

            return (updateResult, true);
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleResult = await SetUserRoleAsync(user, role);

            if (!roleResult.Succeeded)
            {
                _logger.LogWarning(
                    "User {UserId} role update to {Role} failed. Errors: {Errors}",
                    user.Id,
                    role,
                    GetIdentityErrorDescriptions(roleResult));

                return (roleResult, true);
            }
        }

        _logger.LogInformation("Updated user {UserId}. Role update requested: {RoleUpdateRequested}.", user.Id, !string.IsNullOrWhiteSpace(role));

        return (IdentityResult.Success, true);
    }

    public async Task<(IdentityResult Result, bool UserFound)> SetUserDisabledAsync(string userId, bool isDisabled)
    {
        var user = await _userRepository.FindByIdAsync(userId);

        if (user is null)
        {
            _logger.LogWarning("User disable state update failed because user {UserId} was not found.", userId);

            return (CreateUserNotFoundResult(userId), false);
        }

        if (isDisabled &&
            await IsAdminUserAsync(user) &&
            !await HasAnotherActiveAdminUserAsync(user.Id))
        {
            _logger.LogWarning("Prevented disabling user {UserId} because it would leave the system without an active Admin user.", user.Id);

            return (CreateLastAdminDisableResult(), true);
        }

        var result = await _userRepository.SetDisabledAsync(user, isDisabled);

        if (!result.Succeeded)
        {
            _logger.LogWarning(
                "User {UserId} disabled state update to {IsDisabled} failed. Errors: {Errors}",
                user.Id,
                isDisabled,
                GetIdentityErrorDescriptions(result));

            return (result, true);
        }

        _logger.LogInformation("Set user {UserId} disabled state to {IsDisabled}.", user.Id, isDisabled);

        return (result, true);
    }

    private async Task<string> GetUserRoleAsync(ApplicationUser user)
    {
        var roles = await _userRepository.GetRolesAsync(user);

        return roles.FirstOrDefault() ?? string.Empty;
    }

    private async Task<IdentityResult> SetUserRoleAsync(ApplicationUser user, string role)
    {
        var currentRoles = await _userRepository.GetRolesAsync(user);
        var roleAdded = false;

        if (currentRoles.Contains(ApplicationRole.AdminRoleName, StringComparer.OrdinalIgnoreCase) &&
            !string.Equals(role, ApplicationRole.AdminRoleName, StringComparison.OrdinalIgnoreCase) &&
            !await HasAnotherActiveAdminUserAsync(user.Id))
        {
            _logger.LogWarning(
                "Prevented role change for user {UserId} from Admin to {Role} because it would leave the system without an Admin user.",
                user.Id,
                role);

            return CreateLastAdminRoleChangeResult();
        }

        if (!currentRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
        {
            var addResult = await _userRepository.AddToRoleAsync(user, role);

            if (!addResult.Succeeded)
            {
                _logger.LogWarning(
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
                _logger.LogInformation("Assigned role {Role} to user {UserId}.", role, user.Id);
            }

            return IdentityResult.Success;
        }

        var removeResult = await _userRepository.RemoveFromRolesAsync(user, rolesToRemove);

        if (!removeResult.Succeeded)
        {
            _logger.LogWarning(
                "Removing roles {Roles} from user {UserId} failed while setting role {Role}. Errors: {Errors}",
                string.Join(", ", rolesToRemove),
                user.Id,
                role,
                GetIdentityErrorDescriptions(removeResult));

            return removeResult;
        }

        _logger.LogInformation(
            "Changed user {UserId} role from {PreviousRoles} to {Role}.",
            user.Id,
            string.Join(", ", currentRoles),
            role);

        return removeResult;
    }

    private async Task<bool> HasAnotherActiveAdminUserAsync(string userId)
    {
        var adminUsers = await _userRepository.GetUsersInRoleAsync(ApplicationRole.AdminRoleName);

        return adminUsers.Any(adminUser => adminUser.Id != userId && !UserDisabledState.IsDisabled(adminUser));
    }

    private async Task<bool> IsAdminUserAsync(ApplicationUser user)
    {
        var roles = await _userRepository.GetRolesAsync(user);

        return roles.Contains(ApplicationRole.AdminRoleName, StringComparer.OrdinalIgnoreCase);
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

    private static IdentityResult CreateLastAdminDisableResult()
    {
        return IdentityResult.Failed(new IdentityError
        {
            Code = "LastAdminDisable",
            Description = "Disabling users must leave at least one active Admin user in the system."
        });
    }

    private static string GetIdentityErrorDescriptions(IdentityResult result)
    {
        return string.Join("; ", result.Errors.Select(error => error.Description));
    }
}
