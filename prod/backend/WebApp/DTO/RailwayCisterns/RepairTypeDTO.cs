using CsvHelper.Configuration.Attributes;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class RepairTypeDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public string? ShortName { get; set; }
    public string? PortalName { get; set; }
    public int? OldCode;
}

public class CreateRepairTypeDTO
{
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public string? ShortName { get; set; }
    public string? PortalName { get; set; }
    public int? OldCode;
}

public class UpdateRepairTypeDTO
{
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public string? ShortName { get; set; }
    public string? PortalName { get; set; }
    public int? OldCode;
}

public static class RepairTypeDTOMapper
{
    public static RepairTypeDTO ToRepairTypeDto(this RepairType repairType)
    {
        return new RepairTypeDTO()
        {
            Id = repairType.Id,
            Name = repairType.Name,
            Code = repairType.Code,
            Description = repairType.Description,
            CreatedAt = repairType.CreatedAt,
            ShortName = repairType.ShortName,
            PortalName = repairType.PortalName,
            OldCode = repairType.OldCode
        };
    }

    public static RepairType ToRepairType(this CreateRepairTypeDTO createRepairTypeDTO)
    {
        return new RepairType()
        {
            Id = Guid.NewGuid(),
            Name = createRepairTypeDTO.Name,
            Code = createRepairTypeDTO.Code,
            Description = createRepairTypeDTO.Description,
            CreatedAt = createRepairTypeDTO.CreatedAt,
            ShortName = createRepairTypeDTO.ShortName,
            PortalName = createRepairTypeDTO.PortalName,
            OldCode = createRepairTypeDTO.OldCode
        };
    }

    public static void UpdateRepairType(this RepairType repairType, UpdateRepairTypeDTO updateRepairTypeDTO)
    {
        repairType.Name = updateRepairTypeDTO.Name;
        repairType.Code = updateRepairTypeDTO.Code;
        repairType.Description = updateRepairTypeDTO.Description;
        repairType.CreatedAt = updateRepairTypeDTO.CreatedAt;
        repairType.ShortName = updateRepairTypeDTO.ShortName;
        repairType.PortalName = updateRepairTypeDTO.PortalName;
        repairType.OldCode = updateRepairTypeDTO.OldCode;
    }
}
