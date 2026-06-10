using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public interface IUserService
{
    Task<(IdentityResult Result, IdentityUser? User)> CreateUserAsync(string email, string password);
}
