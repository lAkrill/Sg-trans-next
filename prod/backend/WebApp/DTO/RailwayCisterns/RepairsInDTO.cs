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
    public DateTime DateIn { get; set; }
    public string[]? DefectCode {get; set;}
    public string[]? DefectName {get; set;}
    public string? AdminRoadCode { get; set; }

    public RepairTypeDTO RepairType { get; set; } = null!;
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
    public DateTime DateIn { get; set; }
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
    public DateTime DateIn { get; set; }
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

            RepairType = repairsIn.RepairType.ToRepairTypeDto()
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