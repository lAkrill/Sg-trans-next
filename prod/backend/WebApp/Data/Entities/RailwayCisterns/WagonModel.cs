namespace WebApp.Data.Entities.RailwayCisterns;

public class WagonModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int MajorRep {get; set;} 
    public int DepoRep {get; set;}

    public ICollection<RailwayCistern> RailwayCisterns { get; set; } = new List<RailwayCistern>();
}
