namespace WebApp.Data.Entities.RailwayCisterns;

public class PartType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int Code { get; set; }
    public decimal Weight { get; set; }
}
