using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class MilageCisternDTO
{
    public Guid Id { get; set; }
    public Guid CisternId { get; set; }
    public string CisternNumber { get; set; }
    public int Milage { get; set; }
    public int MilageNorm { get; set; }
    public Guid RepairTypeId { get; set; }
    public DateOnly RepairDate { get; set; }
    public int InputModeCode { get; set; }
    public DateOnly InputDate { get; set; }
}

public static class MilageCisternDTOMapper
{
    public static MilageCisternDTO ToMilageCisternDTO(this MilageCistern milage)
    {
        return new MilageCisternDTO
        {
            Id = milage.Id,
            CisternId = milage.CisternId,
            CisternNumber = milage.CisternNumber,
            Milage = milage.Milage,
            MilageNorm = milage.MilageNorm,
            RepairTypeId = milage.RepairTypeId,
            RepairDate = milage.RepairDate,
            InputModeCode = milage.InputModeCode,
            InputDate = milage.InputDate
        };
    }
}

public class CreateMilageCisternDTO
{
    public Guid CisternId { get; set; }
    public string CisternNumber { get; set; }
    public int Milage { get; set; }
    public int MilageNorm { get; set; }
    public Guid RepairTypeId { get; set; }
    public DateOnly RepairDate { get; set; }
    public int InputModeCode { get; set; }
    public DateOnly InputDate { get; set; }
}

public class UpdateMilageCisternDTO
{
    public int Milage { get; set; }
    public int MilageNorm { get; set; }
    public Guid RepairTypeId { get; set; }
    public DateOnly RepairDate { get; set; }
    public int InputModeCode { get; set; }
    public DateOnly InputDate { get; set; }
}
