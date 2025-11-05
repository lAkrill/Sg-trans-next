namespace WebApp.Data.Entities.RailwayCisterns;

public class Vessel
{
    public Guid Id { get; set; } 
    public string SerialNumber { get; set; } = null!;
    public DateTime BuildDate { get; set; }
    public string Manufacturer { get; set; } = null!;
    public string WagonModelId { get; set; } = null!;
    public decimal Pressure { get; set; }
    public decimal Capacity { get; set; }
    
    public Guid RailwayCisternId { get; set; }
    public RailwayCistern RailwayCistern { get; set; } = null!;
}
