using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class DocumentsRegulatory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Number { get; set; }
    public DateOnly Date { get; set; }
    public string? File { get; set; }
    public string? Url { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
    public User Creator { get; set; } = null!;
}
