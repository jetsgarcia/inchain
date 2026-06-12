using System.ComponentModel.DataAnnotations;

namespace Inchain.Api.Features.Admin.Users.Dtos;

public class SetUserDisabledRequest
{
    [Required]
    public bool IsDisabled { get; set; }
}
