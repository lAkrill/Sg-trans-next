namespace WebApp.Data.Entities.RailwayCisterns;

public class RepairsOut
{
    public Guid Id { get; set; }
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string VU36 { get; set; } = null!;
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public DateOnly DateIn { get; set; }
    public DateOnly DateOut { get; set; }
    public string[]? ModernCode {get; set;}
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string[]? ModernName {get; set;}

    public RailwayCistern Cistern { get; set; } = null!;
    public RepairType RepairType { get; set; } = null!;
    public Depot Depot { get; set; } = null!;
}