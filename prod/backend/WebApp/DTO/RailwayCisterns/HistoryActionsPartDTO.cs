using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class HistoryActionsPartDTO
{
    public Guid Id { get; set; }
    public Guid PartId { get; set; }
    public DateTime Date { get; set; }
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Note { get; set; } = null!;
}

public class CreateHistoryActionsPartDTO
{
    public Guid PartId { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = null!;
}

public class UpdateHistoryActionsPartDTO
{
    public Guid PartId { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = null!;
}

public static class HistoryActionsPartDTOMapper
{
    public static HistoryActionsPartDTO ToHistoryActionsPartDTO(this HistoryActionsPart entity)
    {
        return new HistoryActionsPartDTO()
        {
            Id = entity.Id,
            PartId = entity.PartId,
            Date = entity.Date,
            Email = entity.Creator.Email,
            FirstName = entity.Creator.FirstName,
            LastName = entity.Creator.LastName,
            Note = entity.Note
        };
    }

    public static HistoryActionsPart ToHistoryActionsPart(this CreateHistoryActionsPartDTO createDto, Guid creatorId)
    {
        return new HistoryActionsPart()
        {
            Id = Guid.NewGuid(),
            PartId = createDto.PartId,
            Date = createDto.Date,
            CreatorId = creatorId,
            Note = createDto.Note
        };
    }

    public static void UpdateHistoryActionsPart(this HistoryActionsPart entity, UpdateHistoryActionsPartDTO updateDto, Guid creatorId)
    {
        entity.PartId = updateDto.PartId;
        entity.Date = updateDto.Date;
        entity.Note = updateDto.Note;
        entity.CreatorId = creatorId;
    }
}
