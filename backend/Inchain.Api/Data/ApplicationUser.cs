using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Data;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}
