using System.ComponentModel.DataAnnotations;

namespace Inchain.Api.Features.Admin.DocumentTypes.Dtos;

public class CreateDocumentTypeRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}
