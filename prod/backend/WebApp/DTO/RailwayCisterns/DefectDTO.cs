using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class DefectDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
    public string Cause { get; set; } = null!;
}

public class CreateDefectDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
    public string Cause { get; set; } = null!;
}

public class UpdateDefectDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
    public string Cause { get; set; } = null!;
}

public static class DefectDTOMapper
{
    public static DefectDTO ToDefectDTO(this Defect defect)
    {
        return new DefectDTO()
        {
            Id = defect.Id,
            Name = defect.Name,
            ShortName = defect.ShortName,
            Cause = defect.Cause
        };
    }

    public static Defect ToDefect(this CreateDefectDTO defectDTO)
    {
        return new Defect()
        {
            Id = defectDTO.Id,
            Name = defectDTO.Name,
            ShortName = defectDTO.ShortName,
            Cause = defectDTO.Cause
        };
    }

    public static void UpdateDefect(this Defect defect, UpdateDefectDTO updateDefectDTO)
    {
        defect.Id = updateDefectDTO.Id;
        defect.Name = updateDefectDTO.Name;
        defect.ShortName = updateDefectDTO.ShortName;
        defect.Cause = updateDefectDTO.Cause;
    }
}