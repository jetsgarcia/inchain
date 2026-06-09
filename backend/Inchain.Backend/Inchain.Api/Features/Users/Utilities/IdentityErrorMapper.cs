using Microsoft.AspNetCore.Identity;

namespace Inchain.Api.Features.Users.Utilities
{
    public static class IdentityErrorMapper
    {
        public static IEnumerable<object> ToResponse(IEnumerable<IdentityError> errors)
        {
            return errors.Select(error => new
            {
                code = error.Code,
                description = error.Description
            });
        }
    }
}
