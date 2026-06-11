using Inchain.Api.Data;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Repositories;

public interface IUserRepository
{
    Task<IReadOnlyList<ApplicationUser>> GetUsersAsync();

    Task<ApplicationUser?> FindByIdAsync(string userId);

    Task<bool> RoleExistsAsync(string role);

    Task<IdentityResult> CreateAsync(ApplicationUser user, string password);

    Task<IdentityResult> UpdateAsync(ApplicationUser user);

    Task<IdentityResult> DeleteAsync(ApplicationUser user);

    Task<IList<string>> GetRolesAsync(ApplicationUser user);

    Task<IList<ApplicationUser>> GetUsersInRoleAsync(string role);

    Task<IdentityResult> AddToRoleAsync(ApplicationUser user, string role);

    Task<IdentityResult> RemoveFromRolesAsync(ApplicationUser user, IEnumerable<string> roles);
}
