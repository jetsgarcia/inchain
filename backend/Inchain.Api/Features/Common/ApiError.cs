namespace Inchain.Api.Features.Common;

public class ApiError
{
    public string Code { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public static ApiError Create(string code, string description)
    {
        return new ApiError
        {
            Code = code,
            Description = description
        };
    }
}
