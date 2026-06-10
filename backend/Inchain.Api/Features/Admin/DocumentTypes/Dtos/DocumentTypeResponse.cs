namespace Inchain.Api.Features.Admin.DocumentTypes.Dtos;

public class DocumentTypeResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}
