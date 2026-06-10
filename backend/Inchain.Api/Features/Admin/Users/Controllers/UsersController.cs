using Inchain.Api.Data;
using Inchain.Api.Features.Admin.Users.Dtos;
using Inchain.Api.Features.Admin.Users.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.Admin.Users.Controllers;

[Route("api/admin/users")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetUsersAsync();

        return Ok(users.Select(user => MapUserResponse(user.User, user.Role)));
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var user = await _userService.GetUserAsync(userId);

        if (user.User is null)
        {
            return NotFound();
        }

        return Ok(MapUserResponse(user.User, user.Role));
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var response = await _userService.CreateUserAsync(
            request.Email,
            request.Password,
            request.FullName,
            request.Role);

        if (!response.Result.Succeeded)
        {
            return BadRequest(response.Result.Errors);
        }

        var createdUser = MapUserResponse(response.User!, request.Role);

        return Created($"/api/admin/users/{createdUser.Id}", createdUser);
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> EditUser(string userId, [FromBody] EditUserRequest request)
    {
        var response = await _userService.EditUserAsync(
            userId,
            request.FullName,
            request.Email,
            request.Role);

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

    private static UserResponse MapUserResponse(ApplicationUser user, string role)
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
