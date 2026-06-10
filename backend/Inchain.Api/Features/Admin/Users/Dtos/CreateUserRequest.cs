using System.ComponentModel.DataAnnotations;

namespace Inchain.Api.Features.Admin.Users.Dtos;

public class CreateUserRequest
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;
}
