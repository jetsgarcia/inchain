namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class DocumentRequestActivityResponse
{
    public int Id { get; set; }

    public string ActionType { get; set; } = string.Empty;

    public string? ActorNameOrEmail { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? Description { get; set; }

    public string? OldStatusName { get; set; }

    public string? NewStatusName { get; set; }

    public string? Remarks { get; set; }
}
