using Inchain.Api.Features.Users.Dtos;
using Inchain.Api.Features.Users.Services;
using Inchain.Api.Features.Users.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Users.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService userService;

        public UsersController(IUserService userService)
        {
            this.userService = userService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser(CreateUserRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await userService.CreateUserAsync(request);
            if (!result.Succeeded)
            {
                if (result.ErrorMessage is not null)
                {
                    return BadRequest(new { message = result.ErrorMessage });
                }

                return BadRequest(new { errors = IdentityErrorMapper.ToResponse(result.IdentityErrors) });
            }

            return Created($"/api/users/{result.User!.Id}", result.User);
        }
    }
}
