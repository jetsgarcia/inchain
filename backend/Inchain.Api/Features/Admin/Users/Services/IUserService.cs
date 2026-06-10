using Inchain.Api.Data;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public interface IUserService
{
    Task<IReadOnlyList<(ApplicationUser User, string Role)>> GetUsersAsync();

    Task<(ApplicationUser? User, string Role)> GetUserAsync(string userId);

    Task<(IdentityResult Result, ApplicationUser? User)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role);

    Task<(IdentityResult Result, ApplicationUser? User)> EditUserRoleAsync(string userId, string role);
}
