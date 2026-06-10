using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Admin.Users.Services;

public class UserService : IUserService
{
    private readonly UserManager<IdentityUser> userManager;

    public UserService(UserManager<IdentityUser> userManager)
    {
        this.userManager = userManager;
    }

    public async Task<(IdentityResult Result, IdentityUser? User)> CreateUserAsync(string email, string password)
    {
        var user = new IdentityUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            return (result, null);
        }

        return (result, user);
    }
}