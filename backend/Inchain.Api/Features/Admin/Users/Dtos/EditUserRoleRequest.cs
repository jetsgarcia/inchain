using System.ComponentModel.DataAnnotations;

namespace Inchain.Api.Features.Admin.Users.Dtos;

public class EditUserRoleRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}
