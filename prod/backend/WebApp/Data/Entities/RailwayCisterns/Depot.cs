namespace WebApp.Data.Entities.RailwayCisterns;

public class Depot 
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? Location { get; set; }
    public string? ShortName { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatorId { get; set; }
    
    public ICollection<Part> Parts { get; set; } = new List<Part>();
}
