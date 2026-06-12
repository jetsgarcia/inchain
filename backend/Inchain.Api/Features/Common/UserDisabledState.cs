using Inchain.Api.Data;

namespace Inchain.Api.Features.Common;

public static class UserDisabledState
{
    public static bool IsDisabled(ApplicationUser user)
    {
        return user.LockoutEnabled &&
            user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value > DateTimeOffset.UtcNow;
    }
}
