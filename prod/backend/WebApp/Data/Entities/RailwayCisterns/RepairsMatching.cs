namespace WebApp.Data.Entities.RailwayCisterns;

public class RepairsMatching
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }
    public int RepairPeriod { get; set; } = 0;

    public RailwayCistern Cistern { get; set; } = null!;
    public RepairsIn RepairIn { get; set; } = null!;
    public RepairsOut RepairOut { get; set; } = null!;
}
