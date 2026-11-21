using System;

namespace ZhongWenHub.Data.Entities.Content;

public class ContentIssueActivityEntity : BaseEntity
{
    public Guid ContentIssueId { get; set; }
    public ContentIssueEntity? ContentIssue { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = "SUPPORT"; // SUPPORT, CONTENT_MANAGER, STUDENT
    public string Action { get; set; } = string.Empty;
    public string? Message { get; set; }
}
