using Inchain.Api.Features.Users.Dtos;
using Inchain.Api.Features.Users.Models;
using Inchain.Api.Features.Users.Results;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Users.Services
{
    public class UserService : IUserService
    {
        private readonly UserManager<ApplicationUser> userManager;
        private readonly RoleManager<IdentityRole> roleManager;

        public UserService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            this.userManager = userManager;
            this.roleManager = roleManager;
        }

        public async Task<CreateUserResult> CreateUserAsync(CreateUserRequest request)
        {
            var existingUser = await userManager.FindByEmailAsync(request.Email);
            if (existingUser is not null)
            {
                return CreateUserResult.Failure("A user with this email already exists.");
            }

            var roleExists = await roleManager.RoleExistsAsync(request.Role);
            if (!roleExists)
            {
                return CreateUserResult.Failure("The selected role does not exist.");
            }

            var user = new ApplicationUser
            {
                FullName = request.FullName,
                UserName = request.Email,
                Email = request.Email
            };

            var createResult = await userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                return CreateUserResult.Failure(createResult.Errors);
            }

            var roleResult = await userManager.AddToRoleAsync(user, request.Role);
            if (!roleResult.Succeeded)
            {
                await userManager.DeleteAsync(user);
                return CreateUserResult.Failure(roleResult.Errors);
            }

            return CreateUserResult.Success(new CreateUserResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = request.Role
            });
        }
    }
}
