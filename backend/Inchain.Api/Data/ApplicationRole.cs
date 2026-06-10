using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Data;

public class ApplicationRole : IdentityRole
{
    public const string AdminRoleName = "Admin";
    public const string AdminRoleId = "8d5e5484-60a9-4a3d-8e65-dc4f13d3b59a";
    public const string AdminRoleConcurrencyStamp = "0e8182a9-76a5-4a27-b3b8-662d901fb3f6";

    public static ApplicationRole Admin => new()
    {
        Id = AdminRoleId,
        Name = AdminRoleName,
        NormalizedName = AdminRoleName.ToUpperInvariant(),
        ConcurrencyStamp = AdminRoleConcurrencyStamp
    };
}
