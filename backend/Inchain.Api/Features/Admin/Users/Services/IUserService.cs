using Inchain.Api.Data;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public interface IUserService
{
    Task<(IdentityResult Result, ApplicationUser? User)> CreateUserAsync(string email, string password, string fullName);

    Task<(IdentityResult Result, ApplicationUser? User)> EditUserRoleAsync(string userId, string role);
}
