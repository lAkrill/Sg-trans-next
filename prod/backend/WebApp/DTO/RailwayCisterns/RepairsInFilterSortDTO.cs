using WebApp.DTO.Common;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsInFilterSortDTO
{
    public RepairsInFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public List<string>? SelectedColumns { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
}

public class RepairsInFilterSortWithoutPaginationDTO
{
    public RepairsInFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public List<string>? SelectedColumns { get; set; }
}

public class RepairsInFilterCriteria
{
    public List<string>? CisternNumbers { get; set; }
    public List<Guid>? CisternIds { get; set; }
    public List<Guid>? TypeRepairIds { get; set; }
    public List<string>? DepotNames { get; set; }
    public List<Guid>? DepotIds { get; set; }
    public List<string>? VU23 { get; set; }
    public List<string>? RoadCodes { get; set; }
    public List<string>? RoadNames { get; set; }
    public List<string>? StationCodes { get; set; }
    public List<string>? StationNames { get; set; }
    public List<Guid>? StationIds { get; set; }
    public DateTimeRange? DateIn { get; set; }
    public List<string>? AdminRoadCodes { get; set; }
}
