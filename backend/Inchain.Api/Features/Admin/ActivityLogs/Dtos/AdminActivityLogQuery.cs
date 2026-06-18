namespace Inchain.Api.Features.Admin.ActivityLogs.Dtos;

public class AdminActivityLogQuery
{
    public string? ActionType { get; set; }

    public string? TargetEntityType { get; set; }

    public string? SearchText { get; set; }
}
