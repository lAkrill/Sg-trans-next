namespace WebApp.DTO.Audit;

public class ActionLogDTO
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime DateTime { get; set; }
    public string? IP { get; set; }
    public string API { get; set; } = null!;
    public string? Note { get; set; }
}

public static class ActionLogMapper
{
    public static ActionLogDTO ToActionLogDTO(this WebApp.Data.Entities.Audit.ActionLog a)
    {
        return new ActionLogDTO
        {
            Id = a.Id,
            UserId = a.UserId,
            DateTime = a.DateTime,
            IP = a.IP,
            API = a.API,
            Note = a.Note
        };
    }
}
