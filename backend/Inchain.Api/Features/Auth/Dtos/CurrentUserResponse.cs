namespace Inchain.Api.Features.Auth.Dtos;

public class CurrentUserResponse
{
    public string Id { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string[] Roles { get; set; } = [];

    public bool IsDisabled { get; set; }
}
