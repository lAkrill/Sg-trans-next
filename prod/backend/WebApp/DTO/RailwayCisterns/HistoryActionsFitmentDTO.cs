using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class HistoryActionsFitmentDTO
{
    public Guid Id { get; set; }
    public Guid FitmentId { get; set; }
    public DateTime Date { get; set; }
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Note { get; set; } = null!;
}

public class CreateHistoryActionsFitmentDTO
{
    public Guid FitmentId { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = null!;
}

public class UpdateHistoryActionsFitmentDTO
{
    public Guid FitmentId { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = null!;
}

public static class HistoryActionsFitmentDTOMapper
{
    public static HistoryActionsFitmentDTO ToHistoryActionsFitmentDTO(this HistoryActionsFitment entity)
    {
        return new HistoryActionsFitmentDTO()
        {
            Id = entity.Id,
            FitmentId = entity.FitmentId,
            Date = entity.Date,
            Email = entity.Creator.Email,
            FirstName = entity.Creator.FirstName,
            LastName = entity.Creator.LastName,
            Note = entity.Note
        };
    }

    public static HistoryActionsFitment ToHistoryActionsFitment(this CreateHistoryActionsFitmentDTO createDto, Guid creatorId)
    {
        return new HistoryActionsFitment()
        {
            Id = Guid.NewGuid(),
            FitmentId = createDto.FitmentId,
            Date = createDto.Date,
            CreatorId = creatorId,
            Note = createDto.Note
        };
    }

    public static void UpdateHistoryActionsFitment(this HistoryActionsFitment entity, UpdateHistoryActionsFitmentDTO updateDto, Guid creatorId)
    {
        entity.FitmentId = updateDto.FitmentId;
        entity.Date = updateDto.Date;
        entity.Note = updateDto.Note;
        entity.CreatorId = creatorId;
    }
}
