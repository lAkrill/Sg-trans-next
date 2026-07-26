namespace WebApp.Data.Entities.RailwayCisterns;

public class PartInstallation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PartId { get; set; }
    public Part Part { get; set; } = null!;
    
    public Guid? WagonId { get; set; }
    public RailwayCistern? Wagon { get; set; }
    
    public DateTime InstalledAt { get; set; } = DateTime.Now;
    public string? InstalledBy { get; set; }
    
    public DateTime? RemovedAt { get; set; }
    public string? RemovedBy { get; set; }
    
    public Guid? FromLocationId { get; set; }
    public Location? FromLocation { get; set; }
    
    public Guid ToLocationId { get; set; }
    public Location ToLocation { get; set; } = null!;
    
    public string? Notes { get; set; }
}
