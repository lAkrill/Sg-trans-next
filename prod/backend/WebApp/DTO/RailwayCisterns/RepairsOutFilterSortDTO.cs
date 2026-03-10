using WebApp.DTO.Common;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsOutFilterSortDTO
{
    public RepairsOutFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public List<string>? SelectedColumns { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
}

public class RepairsOutFilterSortWithoutPaginationDTO
{
    public RepairsOutFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public List<string>? SelectedColumns { get; set; }
}

public class RepairsOutFilterCriteria
{
    public List<string>? CisternNumbers { get; set; }
    public List<Guid>? CisternIds { get; set; }
    public List<Guid>? TypeRepairIds { get; set; }
    public List<string>? DepotNames { get; set; }
    public List<Guid>? DepotIds { get; set; }
    public List<string>? VU36 { get; set; }
    public List<string>? RoadCodes { get; set; }
    public List<string>? RoadNames { get; set; }
    public DateTimeRange? DateIn { get; set; }
    public DateTimeRange? DateOut { get; set; }
}
