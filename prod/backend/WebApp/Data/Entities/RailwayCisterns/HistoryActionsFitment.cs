using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class HistoryActionsFitment
{
    public Guid Id { get; set; }
    public Guid FitmentId { get; set; }
    public DateTime Date { get; set; }
    public Guid CreatorId { get; set; }
    public string Note { get; set; } = null!;

    public Fitment Fitment { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
