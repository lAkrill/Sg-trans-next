using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class RepairsInDTO
{
    public Guid Id { get; set; }
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public string VU23 { get; set; } = null!;
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string StationCode { get; set; } = null!;
    public string StationName { get; set; } = null!;
    public Guid StationId { get; set; }
    public DateOnly DateIn { get; set; }
    public string[]? DefectCode {get; set;}
    public string[]? DefectName {get; set;}
    public string? AdminRoadCode { get; set; }

    public RailwayCisternListDTO Cistern { get; set; } = null!;
    public RepairTypeDTO RepairType { get; set; } = null!;
    public DepotDTO Depot { get; set; } = null!;
    public StationDTO Station { get; set; } = null!;
}

public class CreateRepairsInDTO
{
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public string VU23 { get; set; } = null!;
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string StationCode { get; set; } = null!;
    public string StationName { get; set; } = null!;
    public Guid StationId { get; set; }
    public DateOnly DateIn { get; set; }
    public string[]? DefectCode {get; set;}
    public string[]? DefectName {get; set;}
    public string? AdminRoadCode { get; set; }
}

public class UpdateRepairsInDTO
{
    public string CisternNumber { get; set; } = null!;
    public Guid CisternId { get; set; }
    public Guid TypeRepairId { get; set; }
    public string DepotName { get; set; } = null!;
    public string DepotCode { get; set; } = null!;
    public Guid DepotId { get; set; }
    public string VU23 { get; set; } = null!;
    public string? RoadCode { get; set; }
    public string? RoadName { get; set; }
    public string StationCode { get; set; } = null!;
    public string StationName { get; set; } = null!;
    public Guid StationId { get; set; }
    public DateOnly DateIn { get; set; }
    public string[]? DefectCode {get; set;}
    public string[]? DefectName {get; set;}
    public string? AdminRoadCode { get; set; }
}

public static class RepairsInDTOMapper
{
    public static RepairsInDTO ToRepairsInDTO(this RepairsIn repairsIn)
    {
        return new RepairsInDTO()
        {
            Id = repairsIn.Id,
            CisternNumber = repairsIn.CisternNumber,
            CisternId = repairsIn.CisternId,
            TypeRepairId = repairsIn.TypeRepairId,
            DepotName = repairsIn.DepotName,
            DepotCode = repairsIn.DepotCode,
            DepotId = repairsIn.DepotId,
            VU23 = repairsIn.VU23,
            RoadCode = repairsIn.RoadCode,
            RoadName = repairsIn.RoadName,
            StationCode = repairsIn.StationCode,
            StationName = repairsIn.StationName,
            StationId = repairsIn.StationId,
            DateIn = repairsIn.DateIn,
            DefectCode = repairsIn.DefectCode,
            DefectName = repairsIn.DefectName,
            AdminRoadCode = repairsIn.AdminRoadCode,

            Cistern = new RailwayCisternListDTO()
            {
                Id = repairsIn.Cistern.Id,
                Number = repairsIn.Cistern.Number,
                ManufacturerName = repairsIn.Cistern.Manufacturer.Name,
                BuildDate = repairsIn.Cistern.BuildDate,
                TypeName = repairsIn.Cistern.Type.Name,
                ModelName = repairsIn.Cistern.Model.Name,
                OwnerName = repairsIn.Cistern.Owner.Name,
                RegistrationNumber = repairsIn.Cistern.RegistrationNumber,
                RegistrationDate = repairsIn.Cistern.RegistrationDate,
                AffiliationValue = repairsIn.Cistern.Affiliation.Value
            },

            RepairType = repairsIn.RepairType.ToRepairTypeDto(),

            Depot = new DepotDTO()
            {
                Id = repairsIn.Depot.Id,
                Name = repairsIn.Depot.Name,
                Code = repairsIn.Depot.Code,
                Location = repairsIn.Depot.Location,
                ShortName = repairsIn.Depot.ShortName,
                CreatedAt = repairsIn.Depot.CreatedAt
            },

            Station = new StationDTO()
            {
                Id = repairsIn.Station.Id,
                Name = repairsIn.Station.Name,
                Code = repairsIn.Station.Code,
                OsmId = repairsIn.Station.OsmId,
                UicRef = repairsIn.Station.UicRef,
                Lat = repairsIn.Station.Lat,
                Lon = repairsIn.Station.Lon,
                Iso3166 = repairsIn.Station.Iso3166,
                Type = repairsIn.Station.Type,
                Operator = repairsIn.Station.Operator,
                Country = repairsIn.Station.Country,
                Region = repairsIn.Station.Region,
                Division = repairsIn.Station.Division,
                Railway = repairsIn.Station.Railway
            }
        };
    }

    public static RepairsIn ToRepairsIn(this CreateRepairsInDTO repairsIn)
    {
        return new RepairsIn()
        {
            Id = Guid.NewGuid(),
            CisternNumber = repairsIn.CisternNumber,
            CisternId = repairsIn.CisternId,
            TypeRepairId = repairsIn.TypeRepairId,
            DepotName = repairsIn.DepotName,
            DepotCode = repairsIn.DepotCode,
            DepotId = repairsIn.DepotId,
            VU23 = repairsIn.VU23,
            RoadCode = repairsIn.RoadCode,
            RoadName = repairsIn.RoadName,
            StationCode = repairsIn.StationCode,
            StationName = repairsIn.StationName,
            StationId = repairsIn.StationId,
            DateIn = repairsIn.DateIn,
            DefectCode = repairsIn.DefectCode,
            DefectName = repairsIn.DefectName,
            AdminRoadCode = repairsIn.AdminRoadCode
        };
    }

    public static void UpdateRepairsIn(this RepairsIn repairsIn, UpdateRepairsInDTO updateRepairsInDTO)
    {
        repairsIn.CisternNumber = updateRepairsInDTO.CisternNumber;
        repairsIn.CisternId = updateRepairsInDTO.CisternId;
        repairsIn.TypeRepairId = updateRepairsInDTO.TypeRepairId;
        repairsIn.DepotName = updateRepairsInDTO.DepotName;
        repairsIn.DepotCode = updateRepairsInDTO.DepotCode;
        repairsIn.DepotId = updateRepairsInDTO.DepotId;
        repairsIn.VU23 = updateRepairsInDTO.VU23;
        repairsIn.RoadCode = updateRepairsInDTO.RoadCode;
        repairsIn.RoadName = updateRepairsInDTO.RoadName;
        repairsIn.StationCode = updateRepairsInDTO.StationCode;
        repairsIn.StationName = updateRepairsInDTO.StationName;
        repairsIn.StationId = updateRepairsInDTO.StationId;
        repairsIn.DateIn = updateRepairsInDTO.DateIn;
        repairsIn.DefectCode = updateRepairsInDTO.DefectCode;
        repairsIn.DefectName = updateRepairsInDTO.DefectName;
        repairsIn.AdminRoadCode = updateRepairsInDTO.AdminRoadCode;
    }
}