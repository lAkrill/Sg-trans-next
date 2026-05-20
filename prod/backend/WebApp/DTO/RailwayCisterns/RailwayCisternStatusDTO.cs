public class RailwayCisternStatusDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }

    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
}

public class CreateRailwayCisternStatusDTO
{
    public string Name { get; set; } = null!;
}

public class UpdateRailwayCisternStatusDTO
{
    public string Name { get; set; } = null!;
}

public static class RailwayCisternStatusDTOMapper
{
    public static RailwayCisternStatusDTO ToRailwayCisternStatusDTO(this RailwayCisternStatus status)
    {
        return new RailwayCisternStatusDTO()
        {
            Id = status.Id,
            Name = status.Name,
            UpdatedAt = status.UpdatedAt,
            FirstName = status.Creator.FirstName,
            LastName = status.Creator.LastName
        };
    }

    public static RailwayCisternStatus ToRailwayCisternStatus(this CreateRailwayCisternStatusDTO dto, Guid creatorId)
    {
        return new RailwayCisternStatus()
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            UpdatedAt = DateTime.Now,
            CreatorId = creatorId
        };
    }

    public static void UpdateRailwayCisternStatus(this RailwayCisternStatus status, UpdateRailwayCisternStatusDTO dto, Guid creatorId)
    {
        status.Name = dto.Name;
        status.CreatorId = creatorId;
        status.UpdatedAt = DateTime.Now;
    }
}