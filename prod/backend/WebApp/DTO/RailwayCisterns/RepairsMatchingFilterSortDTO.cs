using WebApp.DTO.Common;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsMatchingFilterSortDTO
{
    public RepairsMatchingFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public List<string>? SelectedColumns { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 100;
}

public class RepairsMatchingFilterSortWithoutPaginationDTO
{
    public RepairsMatchingFilterCriteria? Filters { get; set; }
    public List<SortCriteria>? SortFields { get; set; }
    public List<string>? SelectedColumns { get; set; }
}

public class RepairsMatchingFilterCriteria
{
    public List<Guid>? CisternIds { get; set; }
    public List<Guid>? RepairInIds { get; set; }
    public List<Guid>? RepairOutIds { get; set; }
    public DateTimeRange? DateTime { get; set; }
}
