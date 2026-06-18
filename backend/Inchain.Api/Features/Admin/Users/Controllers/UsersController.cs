using System.Security.Claims;
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

        return Ok(users);
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUser(string userId)
    {
        var user = await _userService.GetUserAsync(userId);

        if (user is null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var response = await _userService.CreateUserAsync(
            request.Email,
            request.Password,
            request.FullName,
            request.Role,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!response.Result.Succeeded)
        {
            return BadRequest(response.Result.Errors);
        }

        var createdUser = response.User!;

        return CreatedAtAction(nameof(GetUser), new { userId = createdUser.Id }, createdUser);
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> EditUser(string userId, [FromBody] EditUserRequest request)
    {
        var response = await _userService.EditUserAsync(
            userId,
            request.FullName,
            request.Email,
            request.Role,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!response.UserFound)
        {
            return NotFound(response.Result.Errors);
        }

        if (!response.Result.Succeeded)
        {
            return BadRequest(response.Result.Errors);
        }

        return NoContent();
    }

    [HttpPut("{userId}/disabled")]
    public async Task<IActionResult> SetUserDisabled(string userId, [FromBody] SetUserDisabledRequest request)
    {
        var response = await _userService.SetUserDisabledAsync(
            userId,
            request.IsDisabled,
            User.FindFirstValue(ClaimTypes.NameIdentifier));

        if (!response.UserFound)
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
