namespace WebApp.DTO.RailwayCisterns;

public class PartDTO
{
    public Guid Id { get; set; }
    public PartTypeDTO PartType { get; set; }
    public DepotDTO? Depot { get; set; }
    public StampNumberDTO StampNumber { get; set; }
    public string? SerialNumber { get; set; }
    public DateOnly? ManufactureYear { get; set; }
    public PartStatusDTO Status { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Навигационные свойства для специализированных деталей
    public WheelPairDTO? WheelPair { get; set; }
    public SideFrameDTO? SideFrame { get; set; }
    public BolsterDTO? Bolster { get; set; }
    public CouplerDTO? Coupler { get; set; }
    public ShockAbsorberDTO? ShockAbsorber { get; set; }
    public RailwayCisternIdAndNumberDTO? CurrentLocation { get; set; }
    public int? Code { get; set; }
    public Guid? DocumentId { get; set; }
    public DocumentDTO? Document { get; set; }
}

public abstract class CreatePartDTOBase 
{
    public Guid PartTypeId { get; set; }
    public Guid? DepotId { get; set; }
    public Guid StampNumberId { get; set; }
    public string? SerialNumber { get; set; }
    public DateOnly? ManufactureYear { get; set; }
    public Guid StatusId { get; set; }
    public string? Notes { get; set; }
    public int? Code { get; set; }
    public Guid? DocumentId { get; set; }
}

public abstract class UpdatePartDTOBase
{
    public Guid? DepotId { get; set; }
    public Guid StampNumberId { get; set; }
    public string? SerialNumber { get; set; }
    public DateOnly? ManufactureYear { get; set; }
    public Guid? CurrentLocation { get; set; }
    public Guid StatusId { get; set; }
    public string? Notes { get; set; }
    public int? Code { get; set; }
    public Guid? DocumentId { get; set; }
}
