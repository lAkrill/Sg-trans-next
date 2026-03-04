using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsOutDTO
{
    public Guid Id { get; set; }
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string VU36 { get; set; } = null!;
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public DateTime DateIn { get; set; }
    public DateTime DateOut { get; set; }
    public string[]? ModernCode {get; set;}
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string[]? ModernName {get; set;}

    public RailwayCisternListDTO Cistern { get; set; } = null!;
    public RepairTypeDTO RepairType { get; set; } = null!;
    public DepotDTO Depot { get; set; } = null!;
}

public class RepairsOutListDTO
{
    public Guid Id { get; set; }
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string VU36 { get; set; } = null!;
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public DateTime DateIn { get; set; }
    public DateTime DateOut { get; set; }
    public string[]? ModernCode {get; set;}
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string[]? ModernName {get; set;}

    public RepairTypeDTO RepairType { get; set; } = null!;
    public DepotDTO Depot { get; set; } = null!;
}


public class CreateRepairsOutDTO
{
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string VU36 { get; set; } = null!;
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public DateTime DateIn { get; set; }
    public DateTime DateOut { get; set; }
    public string[]? ModernCode {get; set;}
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string[]? ModernName {get; set;}
}

public class UpdateRepairsOutDTO
{
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string VU36 { get; set; } = null!;
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public DateTime DateIn { get; set; }
    public DateTime DateOut { get; set; }
    public string[]? ModernCode {get; set;}
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string[]? ModernName {get; set;}
}

public static class RepairsOutDTOMapper
{
    public static RepairsOutDTO ToRepairsOutDTO(this RepairsOut repairsOut)
    {
        return new RepairsOutDTO()
        {
            Id = repairsOut.Id,
            CisternNumber = repairsOut.CisternNumber,
            CisternId = repairsOut.CisternId,
            TypeRepairId = repairsOut.TypeRepairId,
            VU36 = repairsOut.VU36,
            DepotName = repairsOut.DepotName,
            DepotCode = repairsOut.DepotCode,
            DepotId = repairsOut.DepotId,
            DateIn = repairsOut.DateIn,
            DateOut = repairsOut.DateOut,
            ModernCode = repairsOut.ModernCode,
            RoadCode = repairsOut.RoadCode,
            RoadName = repairsOut.RoadName,
            ModernName = repairsOut.ModernName,

            Cistern = new RailwayCisternListDTO()
            {
                Id = repairsOut.Cistern.Id,
                Number = repairsOut.CisternNumber,
                ManufacturerName = repairsOut.Cistern.Manufacturer.Name,
                BuildDate = repairsOut.Cistern.BuildDate,
                TypeName = repairsOut.Cistern.Type.Name,
                ModelName = repairsOut.Cistern.Model.Name,
                OwnerName = repairsOut.Cistern.Owner.Name,
                RegistrationNumber = repairsOut.Cistern.RegistrationNumber,
                RegistrationDate = repairsOut.Cistern.RegistrationDate,
                AffiliationValue = repairsOut.Cistern.Affiliation.Value
            },

            RepairType = repairsOut.RepairType.ToRepairTypeDto(),

            Depot = new DepotDTO()
            {
                Id = repairsOut.Depot.Id,
                Name = repairsOut.Depot.Name,
                Code = repairsOut.Depot.Code,
                Location = repairsOut.Depot.Location,
                ShortName = repairsOut.Depot.ShortName,
                CreatedAt = repairsOut.Depot.CreatedAt
            },
        };
    }

    public static RepairsOutListDTO ToRepairsOutListDTO(this RepairsOut repairsOut)
    {
        return new RepairsOutListDTO()
        {
            Id = repairsOut.Id,
            CisternNumber = repairsOut.CisternNumber,
            CisternId = repairsOut.CisternId,
            TypeRepairId = repairsOut.TypeRepairId,
            VU36 = repairsOut.VU36,
            DepotName = repairsOut.DepotName,
            DepotCode = repairsOut.DepotCode,
            DepotId = repairsOut.DepotId,
            DateIn = repairsOut.DateIn,
            DateOut = repairsOut.DateOut,
            ModernCode = repairsOut.ModernCode,
            RoadCode = repairsOut.RoadCode,
            RoadName = repairsOut.RoadName,
            ModernName = repairsOut.ModernName,

            RepairType = repairsOut.RepairType.ToRepairTypeDto(),

            Depot = new DepotDTO()
            {
                Id = repairsOut.Depot.Id,
                Name = repairsOut.Depot.Name,
                Code = repairsOut.Depot.Code,
                Location = repairsOut.Depot.Location,
                ShortName = repairsOut.Depot.ShortName,
                CreatedAt = repairsOut.Depot.CreatedAt
            },
        };
    }

    public static RepairsOut ToRepairsOut(this CreateRepairsOutDTO createRepairsOutDTO)
    {
        return new RepairsOut()
        {
            Id = Guid.NewGuid(),
            CisternNumber = createRepairsOutDTO.CisternNumber,
            CisternId = createRepairsOutDTO.CisternId,
            TypeRepairId = createRepairsOutDTO.TypeRepairId,
            VU36 = createRepairsOutDTO.VU36,
            DepotName = createRepairsOutDTO.DepotName,
            DepotCode = createRepairsOutDTO.DepotCode,
            DepotId = createRepairsOutDTO.DepotId,
            DateIn = createRepairsOutDTO.DateIn,
            DateOut = createRepairsOutDTO.DateOut,
            ModernCode = createRepairsOutDTO.ModernCode,
            RoadCode = createRepairsOutDTO.RoadCode,
            RoadName = createRepairsOutDTO.RoadName,
            ModernName = createRepairsOutDTO.ModernName
        };
    }

    public static void UpdateRepairsOut(this RepairsOut repairsOut, UpdateRepairsOutDTO updateRepairsOutDTO)
    {
        repairsOut.CisternNumber = updateRepairsOutDTO.CisternNumber;
        repairsOut.CisternId = updateRepairsOutDTO.CisternId;
        repairsOut.TypeRepairId = updateRepairsOutDTO.TypeRepairId;
        repairsOut.VU36 = updateRepairsOutDTO.VU36;
        repairsOut.DepotName = updateRepairsOutDTO.DepotName;
        repairsOut.DepotCode = updateRepairsOutDTO.DepotCode;
        repairsOut.DepotId = updateRepairsOutDTO.DepotId;
        repairsOut.DateIn = updateRepairsOutDTO.DateIn;
        repairsOut.DateOut = updateRepairsOutDTO.DateOut;
        repairsOut.ModernCode = updateRepairsOutDTO.ModernCode;
        repairsOut.RoadCode = updateRepairsOutDTO.RoadCode;
        repairsOut.RoadName = updateRepairsOutDTO.RoadName;
        repairsOut.ModernName = updateRepairsOutDTO.ModernName;
    }
}