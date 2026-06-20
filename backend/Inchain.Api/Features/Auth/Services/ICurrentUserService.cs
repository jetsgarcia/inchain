using System.Security.Claims;
using Inchain.Api.Features.Auth.Dtos;

namespace Inchain.Api.Features.Auth.Services;

public interface ICurrentUserService
{
    Task<CurrentUserResponse?> GetCurrentUserAsync(ClaimsPrincipal principal);
}
