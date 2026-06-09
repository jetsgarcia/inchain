using Inchain.Api.Features.Users.Dtos;
using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Users.Results
{
    public class CreateUserResult
    {
        private CreateUserResult()
        {
        }

        public bool Succeeded { get; private set; }

        public CreateUserResponse? User { get; private set; }

        public string? ErrorMessage { get; private set; }

        public IEnumerable<IdentityError> IdentityErrors { get; private set; } = [];

        public static CreateUserResult Success(CreateUserResponse user)
        {
            return new CreateUserResult
            {
                Succeeded = true,
                User = user
            };
        }

        public static CreateUserResult Failure(string message)
        {
            return new CreateUserResult
            {
                ErrorMessage = message
            };
        }

        public static CreateUserResult Failure(IEnumerable<IdentityError> identityErrors)
        {
            return new CreateUserResult
            {
                IdentityErrors = identityErrors
            };
        }
    }
}
