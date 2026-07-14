using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class FitmentType
{
    public Guid Id { get; set; }
    
    public string Name { get; set; }
    
    public int Code { get; set; } = 0;
    
    public DateTime UpdatedAt { get; set; }
    
    public Guid CreatorId { get; set; }
    public User Creator { get; set; }
    
    public ICollection<Fitment> Fitments { get; set; } = new List<Fitment>();
}
