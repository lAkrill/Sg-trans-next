using WebApp.Data.Entities.Users;

public class RailwayCisternStatus
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }

    public User Creator { get; set; }= null!;
}