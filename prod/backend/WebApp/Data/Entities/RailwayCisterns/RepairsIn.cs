namespace WebApp.Data.Entities.RailwayCisterns;

public class RepairsIn
{
    public Guid Id { get; set; }
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public string VU23 { get; set; } = null!;
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string StationCode { get; set; } = null!;
    public string StationName { get; set; } = null!;
    public Guid StationId { get; set; }
    public DateOnly DateIn { get; set; }
    public string[]? DefectCode {get; set;}
    public string[]? DefectName {get; set;}
    public string? AdminRoadCode { get; set; }
    
    public RailwayCistern? Cistern { get; set; }
    public RepairType? TypeRepair { get; set; }
    public Depot? Depot { get; set; }
}