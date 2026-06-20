using System.Security.Claims;
using Inchain.Api.Data;
using Inchain.Api.Features.Auth.Dtos;
using Inchain.Api.Features.Common;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Auth.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public CurrentUserService(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<CurrentUserResponse?> GetCurrentUserAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var user = await _userManager.GetUserAsync(principal);

        if (user is null)
        {
            return null;
        }

        var roles = await _userManager.GetRolesAsync(user);

        return new CurrentUserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Roles = roles.ToArray(),
            IsDisabled = UserDisabledState.IsDisabled(user)
        };
    }
}
