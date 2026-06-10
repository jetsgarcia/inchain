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
        var response = await _userService.CreateUserAsync(request.Email, request.Password, request.FullName);

        if (!response.Result.Succeeded)
        {
            return BadRequest(response.Result.Errors);
        }

        var createdUser = new CreateUserResponse
        {
            Id = response.User!.Id,
            FullName = response.User.FullName,
            Email = response.User.Email
        };

        return Created($"/api/users/{createdUser.Id}", createdUser);
    }

    [HttpPut("{userId}/role")]
    public async Task<IActionResult> EditUserRole(string userId, [FromBody] EditUserRoleRequest request)
    {
        var response = await _userService.EditUserRoleAsync(userId, request.Role);

        if (response.User is null)
        {
            return NotFound(response.Result.Errors);
        }

        if (!response.Result.Succeeded)
        {
            return BadRequest(response.Result.Errors);
        }

        return NoContent();
    }
}
