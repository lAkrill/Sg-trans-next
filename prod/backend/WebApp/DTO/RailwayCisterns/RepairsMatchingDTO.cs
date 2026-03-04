using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsMatchingDTO
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }

    public RailwayCisternListDTO Cistern { get; set; } = null!;
    public RepairsInListDTO RepairIn { get; set; } = null!;
    public RepairsOutListDTO RepairOut { get; set; } = null!;
}

public class CreateRepairsMatchingDTO
{
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }
}

public class UpdateRepairsMatchingDTO
{
    public Guid CisternId { get; set; }
    public Guid RepairInId { get; set; }
    public Guid RepairOutId { get; set; }
    public DateTime DateTime { get; set; }
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

            Cistern = new RailwayCisternListDTO()
            {
                Id = repairsMatching.Cistern.Id,
                Number = repairsMatching.Cistern.Number,
                ManufacturerName = repairsMatching.Cistern.Manufacturer.Name,
                BuildDate = repairsMatching.Cistern.BuildDate,
                TypeName = repairsMatching.Cistern.Type.Name,
                ModelName = repairsMatching.Cistern.Model.Name,
                OwnerName = repairsMatching.Cistern.Owner.Name,
                RegistrationNumber = repairsMatching.Cistern.RegistrationNumber,
                RegistrationDate = repairsMatching.Cistern.RegistrationDate,
                AffiliationValue = repairsMatching.Cistern.Affiliation.Value
            },

            RepairIn = repairsMatching.RepairIn.ToRepairsInListDTO(),

            RepairOut = repairsMatching.RepairOut.ToRepairsOutListDTO()
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
            DateTime = createRepairsMatchingDTO.DateTime
        };
    }

    public static void UpdateRepairsMatching(this RepairsMatching repairsMatching, UpdateRepairsMatchingDTO updateRepairsMatchingDTO)
    {
        repairsMatching.CisternId = updateRepairsMatchingDTO.CisternId;
        repairsMatching.RepairInId = updateRepairsMatchingDTO.RepairInId;
        repairsMatching.RepairOutId = updateRepairsMatchingDTO.RepairOutId;
        repairsMatching.DateTime = updateRepairsMatchingDTO.DateTime;
    }
}
