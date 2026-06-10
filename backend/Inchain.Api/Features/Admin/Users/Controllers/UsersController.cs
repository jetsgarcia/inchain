using Inchain.Api.Features.Admin.Users.Dtos;
using Inchain.Api.Features.Admin.Users.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Admin.Users.Controllers;

[Route("api/users")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var response = await _userService.CreateUserAsync(request.Email, request.Password);

        if (!response.Result.Succeeded)
        {
            return BadRequest(response.Result.Errors);
        }

        var createdUser = new CreateUserResponse
        {
            Id = response.User!.Id,
            Email = response.User.Email
        };

        return Created($"/api/users/{createdUser.Id}", createdUser);
    }
}