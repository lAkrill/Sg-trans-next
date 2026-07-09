using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class HistoryActionsRailway
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public DateTime Date { get; set; }
    public Guid CreatorId { get; set; }
    public string Note { get; set; } = null!;

    public RailwayCistern Cistern { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
