using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class HistoryActionsPart
{
    public Guid Id { get; set; }
    public Guid PartId { get; set; }
    public DateTime Date { get; set; }
    public Guid CreatorId { get; set; }
    public string Note { get; set; } = null!;

    public Part Part { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
