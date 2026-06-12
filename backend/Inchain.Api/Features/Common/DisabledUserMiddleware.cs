using Inchain.Api.Data;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Common;

public class DisabledUserMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DisabledUserMiddleware> _logger;

    public DisabledUserMiddleware(RequestDelegate next, ILogger<DisabledUserMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userId = userManager.GetUserId(context.User);

            if (!string.IsNullOrWhiteSpace(userId))
            {
                var user = await userManager.FindByIdAsync(userId);

                if (user is null || UserDisabledState.IsDisabled(user))
                {
                    _logger.LogWarning("Rejected authenticated request for disabled or missing user {UserId}.", userId);

                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                    return;
                }
            }
        }

        await _next(context);
    }
}
