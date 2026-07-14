using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class FitmentModel
{
    public Guid Id { get; set; }
    
    public string Name { get; set; }
    
    public DateTime UpdatedAt { get; set; }
    
    public Guid CreatorId { get; set; }
    public User Creator { get; set; }
    
    public ICollection<Fitment> Fitments { get; set; } = new List<Fitment>();
}
