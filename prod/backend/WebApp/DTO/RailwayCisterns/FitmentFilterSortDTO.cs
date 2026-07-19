using WebApp.DTO.Common;

namespace WebApp.DTO.RailwayCisterns;

public class FitmentFilterSortDTO
{
    public FitmentFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
}

public class FitmentFilterSortWithoutPaginationDTO
{
    public FitmentFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
}

public class FitmentFilterCriteria
{
    public List<Guid>? FitmentTypeIds { get; set; }
    public List<string>? SerialNumbers { get; set; }
    public List<string>? PassportNumbers { get; set; }
    public DateRange? BuildDate { get; set; }
    public DateRange? LastRepairDate { get; set; }
    public IntRange? PeriodRep { get; set; }
    public IntRange? ServiceLifeYears { get; set; }
    public List<Guid>? ModelIds { get; set; }
    public List<Guid>? DepotIds { get; set; }
    public List<Guid>? CreatorIds { get; set; }
    public DateTimeRange? UpdatedAt { get; set; }
}
