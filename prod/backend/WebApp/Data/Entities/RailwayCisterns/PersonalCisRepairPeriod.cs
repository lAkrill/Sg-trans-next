using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Entities.Users;

public class PersonalCisRepairPeriod
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public string CisternNum { get; set;} = null!;
    public int? MajorRep {get; set;} 
    public int? DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatorId { get; set; }

    public RailwayCistern railwayCistern { get; set; } = null!;
    public User? Creator { get; set; }
}
