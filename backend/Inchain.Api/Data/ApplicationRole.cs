using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Data;

public class ApplicationRole : IdentityRole
{
    public const string AdminRoleName = "Admin";
    public const string AdminRoleId = "8d5e5484-60a9-4a3d-8e65-dc4f13d3b59a";
    public const string AdminRoleConcurrencyStamp = "0e8182a9-76a5-4a27-b3b8-662d901fb3f6";
    public const string ApproverRoleName = "Approver";
    public const string ApproverRoleId = "a7f6e19d-ff44-4b8e-bd1d-3d9f3fc2b1c4";
    public const string ApproverRoleConcurrencyStamp = "a2c9e6f8-6d2d-4355-b22f-773f01d191a8";
    public const string RequesterRoleName = "Requester";
    public const string RequesterRoleId = "c36af7e8-1714-46ef-999d-c9db9d92b730";
    public const string RequesterRoleConcurrencyStamp = "ef76052c-8d70-44d1-928f-0951ffcd7e23";

    public static ApplicationRole Admin => new()
    {
        Id = AdminRoleId,
        Name = AdminRoleName,
        NormalizedName = AdminRoleName.ToUpperInvariant(),
        ConcurrencyStamp = AdminRoleConcurrencyStamp
    };

    public static ApplicationRole Approver => new()
    {
        Id = ApproverRoleId,
        Name = ApproverRoleName,
        NormalizedName = ApproverRoleName.ToUpperInvariant(),
        ConcurrencyStamp = ApproverRoleConcurrencyStamp
    };

    public static ApplicationRole Requester => new()
    {
        Id = RequesterRoleId,
        Name = RequesterRoleName,
        NormalizedName = RequesterRoleName.ToUpperInvariant(),
        ConcurrencyStamp = RequesterRoleConcurrencyStamp
    };
}
