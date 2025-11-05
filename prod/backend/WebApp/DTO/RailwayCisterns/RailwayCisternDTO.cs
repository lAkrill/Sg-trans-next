namespace WebApp.DTO.RailwayCisterns;


public class RailwayCisternIdAndNumberDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; }
}
public class RailwayCisternDetailDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; }
    public ManufacturerDTO Manufacturer { get; set; }
    public DateOnly BuildDate { get; set; }
    public decimal TareWeight { get; set; }
    public decimal LoadCapacity { get; set; }
    public int Length { get; set; }
    public int AxleCount { get; set; }
    public decimal Volume { get; set; }
    public decimal? FillingVolume { get; set; }
    public decimal? InitialTareWeight { get; set; }
    public WagonTypeDTO Type { get; set; }
    public WagonModelDTO Model { get; set; }
    public DateOnly? CommissioningDate { get; set; }
    public string SerialNumber { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public RegistrarDTO Registrar { get; set; }
    public string Notes { get; set; }
    public OwnerDTO Owner { get; set; }
    public string? TechConditions { get; set; }
    public string? Pripiska { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public decimal Pressure { get; set; }
    public decimal TestPressure { get; set; }
    public string? Rent { get; set; }
    public AffiliationDTO Affiliation { get; set; }
    public int ServiceLifeYears { get; set; }
    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public int DangerClass { get; set; }
    public string Substance { get; set; }
    public decimal TareWeight2 { get; set; }
    public decimal TareWeight3 { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<VesselListDTO>? Vessels { get; set; }
}

public class RailwayCisternListDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; }
    public string ManufacturerName { get; set; }
    public DateOnly BuildDate { get; set; }
    public string TypeName { get; set; }
    public string ModelName { get; set; }
    public string OwnerName { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public string AffiliationValue { get; set; }
}

public class CreateRailwayCisternDTO
{
    public string Number { get; set; }
    public Guid ManufacturerId { get; set; }
    public DateOnly BuildDate { get; set; }
    public decimal TareWeight { get; set; }
    public decimal LoadCapacity { get; set; }
    public int Length { get; set; }
    public int AxleCount { get; set; }
    public decimal Volume { get; set; }
    public decimal? FillingVolume { get; set; }
    public decimal? InitialTareWeight { get; set; }
    public Guid TypeId { get; set; }
    public Guid? ModelId { get; set; }
    public DateOnly? CommissioningDate { get; set; }
    public string SerialNumber { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public Guid? RegistrarId { get; set; }
    public string Notes { get; set; }
    public Guid? OwnerId { get; set; }
    public string? TechConditions { get; set; }
    public string? Pripiska { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public decimal Pressure { get; set; }
    public decimal TestPressure { get; set; }
    public string? Rent { get; set; }
    public Guid AffiliationId { get; set; }
    public int ServiceLifeYears { get; set; }
    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public int DangerClass { get; set; }
    public string Substance { get; set; }
    public decimal TareWeight2 { get; set; }
    public decimal TareWeight3 { get; set; }
}

public class UpdateRailwayCisternDTO
{
    public string Number { get; set; }
    public Guid ManufacturerId { get; set; }
    public DateOnly BuildDate { get; set; }
    public decimal TareWeight { get; set; }
    public decimal LoadCapacity { get; set; }
    public int Length { get; set; }
    public int AxleCount { get; set; }
    public decimal Volume { get; set; }
    public decimal? FillingVolume { get; set; }
    public decimal? InitialTareWeight { get; set; }
    public Guid TypeId { get; set; }
    public Guid? ModelId { get; set; }
    public DateOnly? CommissioningDate { get; set; }
    public string SerialNumber { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public Guid? RegistrarId { get; set; }
    public string Notes { get; set; }
    public Guid? OwnerId { get; set; }
    public string? TechConditions { get; set; }
    public string? Pripiska { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public decimal Pressure { get; set; }
    public decimal TestPressure { get; set; }
    public string? Rent { get; set; }
    public Guid AffiliationId { get; set; }
    public int ServiceLifeYears { get; set; }
    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public int DangerClass { get; set; }
    public string Substance { get; set; }
    public decimal TareWeight2 { get; set; }
    public decimal TareWeight3 { get; set; }
}
