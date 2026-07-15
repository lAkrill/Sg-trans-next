using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.Audit;

public class ActionLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; }
    public DateTime DateTime { get; set; }
    public string? IP { get; set; }
    public string API { get; set; } = null!;
    public string? Note { get; set; }
}
