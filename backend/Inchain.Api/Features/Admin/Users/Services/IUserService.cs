using Inchain.Api.Features.Admin.Users.Dtos;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> GetUsersAsync();

    Task<UserResponse?> GetUserAsync(string userId);

    Task<(IdentityResult Result, UserResponse? User)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role,
        string? adminUserId);

    Task<(IdentityResult Result, bool UserFound)> EditUserAsync(
        string userId,
        string? fullName,
        string? email,
        string? role,
        string? adminUserId);

    Task<(IdentityResult Result, bool UserFound)> SetUserDisabledAsync(
        string userId,
        bool isDisabled,
        string? adminUserId);
}
