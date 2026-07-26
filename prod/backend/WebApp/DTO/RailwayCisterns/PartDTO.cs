namespace WebApp.DTO.RailwayCisterns;

public class PartDTO
{
    public Guid Id { get; set; }
    public PartTypeDTO? PartType { get; set; }
    public DepotDTO? Depot { get; set; }
    public StampNumberDTO? StampNumber { get; set; }
    public string? SerialNumber { get; set; }
    public DateOnly? ManufactureYear { get; set; }
    public PartStatusDTO? Status { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int ServiceLifeYears { get; set; }
    public DateOnly? ExtendedUntil { get; set; }
    public string? Model { get; set; }
    public string? File { get; set; }
    //
    public RailwayCisternIdAndNumberDTO? CurrentLocation { get; set; }
    public int? Code { get; set; }
    public Guid? DocumentId { get; set; }
    public DocumentDTO? Document { get; set; }
}

public class CreatePartDTO
{
    public Guid PartTypeId { get; set; }
    public Guid? DepotId { get; set; }
    public Guid StampNumberId { get; set; }
    public string? SerialNumber { get; set; }
    public DateOnly? ManufactureYear { get; set; }
    public Guid? CurrentLocation { get; set; }
    public Guid StatusId { get; set; }
    public string? Notes { get; set; }
    public int? Code { get; set; }
    public Guid? DocumentId { get; set; }
    public int ServiceLifeYears { get; set; } = 0;
    public DateOnly? ExtendedUntil { get; set; }
    public string? Model { get; set; }
    public string? File { get; set; }
}

public class UpdatePartDTO
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
    public int? ServiceLifeYears { get; set; }
    public DateOnly? ExtendedUntil { get; set; }
    public string? Model { get; set; }
    public string? File { get; set; }
}
