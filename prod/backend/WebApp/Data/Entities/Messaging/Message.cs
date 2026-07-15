using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.Messaging;

public class Message
{
    public Guid Id { get; set; }
    public DateTime CreationDate { get; set; }
    public DateTime ReadingDate { get; set; }
    public string? Text { get; set; }

    public Guid FromUserId { get; set; }
    public User FromUser { get; set; }

    public Guid ToUserId { get; set; }
    public User ToUser { get; set; }

    // DB column name is "Satus" (typo) — map via configuration
    public int Status { get; set; }

    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public int Priority { get; set; }
}
