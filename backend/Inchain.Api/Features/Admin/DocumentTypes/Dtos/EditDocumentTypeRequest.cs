using System.ComponentModel.DataAnnotations;

namespace Inchain.Api.Features.Admin.DocumentTypes.Dtos;

public class EditDocumentTypeRequest
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}
