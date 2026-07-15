namespace WebApp.DTO.Messaging;

public class MessageDTO
{
    public Guid Id { get; set; }
    public DateTime CreationDate { get; set; }
    public DateTime ReadingDate { get; set; }
    public string? Text { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public int Status { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public int Priority { get; set; }
}

public class CreateMessageDTO
{
    public string? Text { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public int Priority { get; set; } = 0;
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
}

public class UpdateMessageDTO
{
    public string? Text { get; set; }
    public DateTime? ReadingDate { get; set; }
    public int Status { get; set; }
    public int Priority { get; set; }
}
