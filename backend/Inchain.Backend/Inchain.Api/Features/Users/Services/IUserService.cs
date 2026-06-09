using Inchain.Api.Features.Users.Dtos;
using Inchain.Api.Features.Users.Results;

namespace Inchain.Api.Features.Users.Services
{
    public interface IUserService
    {
        Task<CreateUserResult> CreateUserAsync(CreateUserRequest request);
    }
}
