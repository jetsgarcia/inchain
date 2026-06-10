using System.ComponentModel.DataAnnotations;

namespace Inchain.Api.Features.Admin.Users.Dtos;

public class EditUserRequest
{
    public string? FullName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    public string? Role { get; set; }
}
