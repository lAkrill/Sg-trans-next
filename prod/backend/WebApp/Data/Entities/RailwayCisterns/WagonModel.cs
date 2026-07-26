using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class WagonModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int MajorRep {get; set;} 
    public int DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
    public decimal Weight { get; set; }
    public string? FileImage { get; set; }
    public string? FileTU { get; set; }
    public string? FileRE { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatorId { get; set; }


    public User? Creator { get; set; }
    public ICollection<RailwayCistern> RailwayCisterns { get; set; } = new List<RailwayCistern>();
}
