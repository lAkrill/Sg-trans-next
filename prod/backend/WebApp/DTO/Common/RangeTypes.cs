namespace WebApp.DTO.Common;

public class DateRange
{
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
}

public class DateTimeRange
{
    public DateTimeOffset? From { get; set; }
    public DateTimeOffset? To { get; set; }
}

public class DateTimeWithoutOffsetRange
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public class DecimalRange
{
    public decimal? From { get; set; }
    public decimal? To { get; set; }
}

public class IntRange
{
    public int? From { get; set; }
    public int? To { get; set; }
}
