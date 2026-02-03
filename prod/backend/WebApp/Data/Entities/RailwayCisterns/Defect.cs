namespace WebApp.Data.Entities.RailwayCisterns;

public class Defect
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
    public string Cause { get; set; } = null!;
}