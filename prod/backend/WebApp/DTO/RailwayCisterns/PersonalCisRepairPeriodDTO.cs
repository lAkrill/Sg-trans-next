public class PersonalCisRepairPeriodDTO
{
     public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public string CisternNum { get; set;} = null!;
    public int? MajorRep {get; set;} 
    public int? DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
    public DateTime? UpdatedAt { get; set; }
    public Guid? CreatorId { get; set; }
}

public class CreatePersonalCisRepairPeriodDTO
{
    public Guid CisternId { get; set; }
    public string CisternNum { get; set;} = null!;
    public int? MajorRep {get; set;} 
    public int? DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
}

public class UpdatePersonalCisRepairPeriodDTO
{
    public Guid CisternId { get; set; }
    public string CisternNum { get; set;} = null!;
    public int? MajorRep {get; set;} 
    public int? DepoRep {get; set;}
    public int? IntermediateTest {get; set;}
    public int? PeriodicTest {get; set;}
    public int? PPRRep {get; set;}
}

public static class PersonalCisRepairPeriodDTOMapper
{
    public static PersonalCisRepairPeriodDTO ToPersonalCisRepairPeriodDTO(this PersonalCisRepairPeriod entity)
    {
        return new PersonalCisRepairPeriodDTO()
        {
            Id = entity.Id,
            CisternId = entity.CisternId,
            CisternNum = entity.CisternNum,
            MajorRep = entity.MajorRep,
            DepoRep = entity.DepoRep,
            IntermediateTest = entity.IntermediateTest,
            PeriodicTest = entity.PeriodicTest,
            PPRRep = entity.PPRRep,
            UpdatedAt = entity.UpdatedAt,
            CreatorId = entity.CreatorId
        };
    }

    public static PersonalCisRepairPeriod ToPersonalCisRepairPeriod(this CreatePersonalCisRepairPeriodDTO createDto, Guid creatorId)
    {
        return new PersonalCisRepairPeriod()
        {
            Id = Guid.NewGuid(),
            CisternId = createDto.CisternId,
            CisternNum = createDto.CisternNum,
            MajorRep = createDto.MajorRep,
            DepoRep = createDto.DepoRep,
            IntermediateTest = createDto.IntermediateTest,
            PeriodicTest = createDto.PeriodicTest,
            PPRRep = createDto.PPRRep,
            UpdatedAt = DateTime.Now,
            CreatorId = creatorId
        };
    }

    public static void UpdatePersonalCisRepairPeriod(this PersonalCisRepairPeriod entity, UpdatePersonalCisRepairPeriodDTO updateDto)
    {
        entity.CisternId = updateDto.CisternId;
        entity.CisternNum = updateDto.CisternNum;
        entity.MajorRep = updateDto.MajorRep;
        entity.DepoRep = updateDto.DepoRep;
        entity.IntermediateTest = updateDto.IntermediateTest;
        entity.PeriodicTest = updateDto.PeriodicTest;
        entity.PPRRep = updateDto.PPRRep;
        entity.UpdatedAt = DateTime.Now;
    }
}