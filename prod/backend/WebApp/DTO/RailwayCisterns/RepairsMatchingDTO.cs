using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsMatchingDTO
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }
    public int RepairPeriod { get; set; } 

    public RepairsInDTO RepairIn { get; set; } = null!;
    public RepairsOutDTO RepairOut { get; set; } = null!;
}

public class CreateRepairsMatchingDTO
{
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }
    public int RepairPeriod { get; set; } = 0;
}

public class UpdateRepairsMatchingDTO
{
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }
    public int RepairPeriod { get; set; } = 0;
}

public static class RepairsMatchingDTOMapper
{
    public static RepairsMatchingDTO ToRepairsMatchingDTO(this RepairsMatching repairsMatching)
    {
        return new RepairsMatchingDTO()
        {
            Id = repairsMatching.Id,
            CisternId = repairsMatching.CisternId,
            RepairInId = repairsMatching.RepairInId,
            RepairOutId = repairsMatching.RepairOutId,
            DateTime = repairsMatching.DateTime,
            RepairPeriod = repairsMatching.RepairPeriod,

            RepairIn = repairsMatching.RepairIn.ToRepairsInDTO(),

            RepairOut = repairsMatching.RepairOut.ToRepairsOutDTO()
        };
    }

    public static RepairsMatching ToRepairsMatching(this CreateRepairsMatchingDTO createRepairsMatchingDTO)
    {
        return new RepairsMatching()
        {
            Id = Guid.NewGuid(),
            CisternId = createRepairsMatchingDTO.CisternId,
            RepairInId = createRepairsMatchingDTO.RepairInId,
            RepairOutId = createRepairsMatchingDTO.RepairOutId,
            DateTime = createRepairsMatchingDTO.DateTime,
            RepairPeriod = createRepairsMatchingDTO.RepairPeriod
        };
    }

    public static void UpdateRepairsMatching(this RepairsMatching repairsMatching, UpdateRepairsMatchingDTO updateRepairsMatchingDTO)
    {
        repairsMatching.CisternId = updateRepairsMatchingDTO.CisternId;
        repairsMatching.RepairInId = updateRepairsMatchingDTO.RepairInId;
        repairsMatching.RepairOutId = updateRepairsMatchingDTO.RepairOutId;
        repairsMatching.DateTime = updateRepairsMatchingDTO.DateTime;
        repairsMatching.RepairPeriod = updateRepairsMatchingDTO.RepairPeriod;
    }
}
