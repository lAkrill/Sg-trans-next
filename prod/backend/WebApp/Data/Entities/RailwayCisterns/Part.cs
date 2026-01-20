using System.ComponentModel.DataAnnotations.Schema;

namespace WebApp.Data.Entities.RailwayCisterns;

public class Part 
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PartTypeId { get; set; }
    public PartType PartType { get; set; } = null!;
    
    public Guid? DepotId { get; set; }
    public Depot? Depot { get; set; }
    
    public Guid StampNumberId { get; set; }
    public StampNumber StampNumber { get; set; } = null!;
    
    public string? SerialNumber { get; set; }
    public DateOnly? ManufactureYear { get; set; }
    public Guid? CurrentLocation { get; set; }
    
    public Guid StatusId { get; set; }
    public PartStatus Status { get; set; } = null!;
    
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatorId { get; set; }
    
    // Навигационные свойства для специализированных деталей
    public WheelPair? WheelPair { get; set; }
    public SideFrame? SideFrame { get; set; }
    public Bolster? Bolster { get; set; }
    public Coupler? Coupler { get; set; }
    public ShockAbsorber? ShockAbsorber { get; set; }
    
    public ICollection<PartInstallation> PartInstallations { get; set; } = new List<PartInstallation>();
    
    public int? Code { get; set; }
    [Column("DocumetnsId")]
    public Guid? DocumentId { get; set; }
    public Document? Document { get; set; }
    public RailwayCistern? RailwayCistern { get; set; } 
    public ICollection<PartEquipment> PartEquipments { get; set; } = new List<PartEquipment>();
}
