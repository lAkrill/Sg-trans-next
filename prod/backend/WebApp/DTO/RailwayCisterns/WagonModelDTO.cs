using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class WagonModelDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public int MajorRep {get; set;} 
    public int DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
    public DateTime? UpdatedAt { get; set; }
    public string? Email { get; set; } = string.Empty;
    
    public string? FirstName { get; set; } = string.Empty;
    
    public string? LastName { get; set; } = string.Empty;
}

public class CreateWagonModelDTO
{
    public string Name { get; set; }
    public int MajorRep {get; set;} 
    public int DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
    public Guid? CreatorId { get; set; }
}

public class UpdateWagonModelDTO
{
    public string Name { get; set; }
    public int MajorRep {get; set;} 
    public int DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
}

public static class WagonModelDTOMapper
{
    public static WagonModelDTO ToWagonModelDTO(this WagonModel wagonModel)
    {
        return new WagonModelDTO()
        {
            Id = wagonModel.Id,
            Name = wagonModel.Name,
            MajorRep = wagonModel.MajorRep,
            DepoRep = wagonModel.DepoRep,
            IntermediateTest = wagonModel.IntermediateTest,
            PeriodicTest = wagonModel.PeriodicTest,
            PPRRep = wagonModel.PPRRep,
            UpdatedAt = wagonModel.UpdatedAt,
            Email = wagonModel.Creator?.Email,
            FirstName = wagonModel.Creator?.FirstName,
            LastName = wagonModel.Creator?.LastName
        };
    }

    public static WagonModel ToWagonModel(this CreateWagonModelDTO createDto, Guid creatorId)
    {
        return new WagonModel()
        {
            Id = Guid.NewGuid(),
            Name = createDto.Name,
            MajorRep = createDto.MajorRep,
            DepoRep = createDto.DepoRep,
            IntermediateTest = createDto.IntermediateTest,
            PeriodicTest = createDto.PeriodicTest,
            PPRRep = createDto.PPRRep,
            UpdatedAt = DateTime.Now,
            CreatorId = creatorId
        };
    }

    public static void UpdateWagonModel(this WagonModel wagonModel, UpdateWagonModelDTO updateDto)
    {
        wagonModel.Name = updateDto.Name;
        wagonModel.MajorRep = updateDto.MajorRep;
        wagonModel.DepoRep = updateDto.DepoRep;
        wagonModel.IntermediateTest = updateDto.IntermediateTest;
        wagonModel.PeriodicTest = updateDto.PeriodicTest;
        wagonModel.PPRRep = updateDto.PPRRep;
        wagonModel.UpdatedAt = DateTime.Now;
    }
}