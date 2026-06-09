using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Users.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
    }
}
