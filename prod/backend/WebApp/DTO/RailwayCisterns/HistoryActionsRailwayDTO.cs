using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class HistoryActionsRailwayDTO
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public DateTime Date { get; set; }
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Note { get; set; } = null!;
}

public class CreateHistoryActionsRailwayDTO
{
    public Guid CisternId { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = null!;
}

public class UpdateHistoryActionsRailwayDTO
{
    public Guid CisternId { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = null!;
}

public static class HistoryActionsRailwayDTOMapper
{
    public static HistoryActionsRailwayDTO ToHistoryActionsRailwayDTO(this HistoryActionsRailway entity)
    {
        return new HistoryActionsRailwayDTO()
        {
            Id = entity.Id,
            CisternId = entity.CisternId,
            Date = entity.Date,
            Email = entity.Creator.Email,
            FirstName = entity.Creator.FirstName,
            LastName = entity.Creator.LastName,
            Note = entity.Note
        };
    }

    public static HistoryActionsRailway ToHistoryActionsRailway(this CreateHistoryActionsRailwayDTO createDto, Guid creatorId)
    {
        return new HistoryActionsRailway()
        {
            Id = Guid.NewGuid(),
            CisternId = createDto.CisternId,
            Date = createDto.Date,
            CreatorId = creatorId,
            Note = createDto.Note
        };
    }

    public static void UpdateHistoryActionsRailway(this HistoryActionsRailway entity, UpdateHistoryActionsRailwayDTO updateDto, Guid creatorId)
    {
        entity.CisternId = updateDto.CisternId;
        entity.Date = updateDto.Date;
        entity.Note = updateDto.Note;
        entity.CreatorId = creatorId;
    }
}
