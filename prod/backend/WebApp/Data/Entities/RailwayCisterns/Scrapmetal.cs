using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class Scrapmetal
{
    public Guid Id { get; set; }

    public Guid? PartId { get; set; }
    public Part? Part { get; set; }

    public decimal Weight { get; set; } = 0;
    public DateOnly Date { get; set; }
    public int Code { get; set; } = 0;
    public string? Note { get; set; }

    public Guid? DocumentId { get; set; }
    public Document? Document { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Guid CreatorId { get; set; }
    public User Creator { get; set; } = null!;
}
