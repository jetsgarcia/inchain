using Inchain.Api.Data;
using Inchain.Api.Features.Admin.Users.Dtos;

namespace Inchain.Api.Features.Admin.Users.Mappers;

public static class UserMapper
{
    public static UserResponse ToResponse(ApplicationUser user, string role)
    {
        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = role
        };
    }
}
