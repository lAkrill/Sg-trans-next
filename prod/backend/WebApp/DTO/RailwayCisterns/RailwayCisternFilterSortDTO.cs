using WebApp.DTO.Common;

namespace WebApp.DTO.RailwayCisterns;

public class RailwayCisternFilterSortDTO
{
    public FilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class RailwayCisternFilterSortWithoutPaginationDTO
{
    public FilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
}

public class FilterCriteria
{
    public string? NumberPrefix { get; set; }
    public List<string>? Numbers { get; set; }
    public List<Guid>? ManufacturerIds { get; set; }
    public DateRange? BuildDate { get; set; }
    public DecimalRange? TareWeight { get; set; }
    public DecimalRange? LoadCapacity { get; set; }
    public IntRange? Length { get; set; }
    public List<int>? AxleCounts { get; set; }
    public DecimalRange? Volume { get; set; }
    public DecimalRange? FillingVolume { get; set; }
    public DecimalRange? InitialTareWeight { get; set; }
    public List<Guid>? TypeIds { get; set; }
    public List<Guid>? ModelIds { get; set; }
    public DateRange? CommissioningDate { get; set; }
    public List<string>? SerialNumbers { get; set; }
    public List<string>? RegistrationNumbers { get; set; }
    public DateRange? RegistrationDate { get; set; }
    public List<Guid>? RegistrarIds { get; set; }
    public List<Guid>? OwnerIds { get; set; }
    public List<string>? TechConditions { get; set; }
    public List<string>? Prispiski { get; set; }
    public DateRange? ReRegistrationDate { get; set; }
    public DecimalRange? Pressure { get; set; }
    public DecimalRange? TestPressure { get; set; }
    public List<string>? Rents { get; set; }
    public List<Guid>? AffiliationIds { get; set; }
    public IntRange? ServiceLifeYears { get; set; }
    public DateRange? PeriodMajorRepair { get; set; }
    public DateRange? PeriodPeriodicTest { get; set; }
    public DateRange? PeriodIntermediateTest { get; set; }
    public DateRange? PeriodDepotRepair { get; set; }
    public DateRange? PeriodPPRRepair { get; set; }
    public DateTimeWithoutOffsetRange? PeriodPaintRepair { get; set; }
    public DateRange? PeriodDetachRepair { get; set; }
    public DateRange? ReRegistrationNextDate { get; set; }
    public DateRange? ExtensionServiceLifeDate { get; set; }
    public List<Guid>? CisternStatusIds { get; set; }
    public List<string>? Notes { get; set; }
    public List<int>? DangerClasses { get; set; }
    public List<string>? Substances { get; set; }
    public DecimalRange? TareWeight2 { get; set; }
    public DecimalRange? TareWeight3 { get; set; }
    public DateTimeRange? CreatedAt { get; set; }
    public DateTimeRange? UpdatedAt { get; set; }
}

public class SortCriteria
{
    public string FieldName { get; set; } = null!;
    public bool Descending { get; set; }
}
