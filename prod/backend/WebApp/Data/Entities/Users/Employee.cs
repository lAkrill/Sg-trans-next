namespace WebApp.Data.Entities.Users;

public class Employee
{
    public Guid Id { get; set; }
    public string LastName { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string Patronymic { get; set; } = null!;
    public string Initials { get; set; } = null!;
    public string Position { get; set; } = null!;
    public DateTime? UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }

    public User Creator { get; set; } = null!;
}
