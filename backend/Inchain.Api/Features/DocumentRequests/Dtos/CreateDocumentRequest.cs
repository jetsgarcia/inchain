using Microsoft.AspNetCore.Mvc;

namespace Inchain.Api.Features.DocumentRequests.Dtos;

public class CreateDocumentRequest
{
    [FromForm(Name = "title")]
    public string? Title { get; set; }

    [FromForm(Name = "description")]
    public string? Description { get; set; }

    [FromForm(Name = "documentTypeId")]
    public int DocumentTypeId { get; set; }

    [FromForm(Name = "attachment")]
    public IFormFile? Attachment { get; set; }
}
