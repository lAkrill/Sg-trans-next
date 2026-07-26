using System.Linq;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.DTO.Common;

namespace WebApp.DTO.RailwayCisterns;


public class RailwayCisternIdAndNumberDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; }
}
public class RailwayCisternDetailDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; }
    public ManufacturerDTO Manufacturer { get; set; }
    public DateOnly BuildDate { get; set; }
    public decimal TareWeight { get; set; }
    public decimal LoadCapacity { get; set; }
    public int Length { get; set; }
    public int AxleCount { get; set; }
    public decimal Volume { get; set; }
    public decimal? FillingVolume { get; set; }
    public decimal? InitialTareWeight { get; set; }
    public WagonTypeDTO Type { get; set; }
    public WagonModelDTO Model { get; set; }
    public DateOnly? CommissioningDate { get; set; }
    public string SerialNumber { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public RegistrarDTO Registrar { get; set; }
    public string Notes { get; set; }
    public OwnerDTO Owner { get; set; }
    public string? TechConditions { get; set; }
    public string? Pripiska { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public decimal Pressure { get; set; }
    public decimal TestPressure { get; set; }
    public string? Rent { get; set; }
    public AffiliationDTO Affiliation { get; set; }
    public int ServiceLifeYears { get; set; }

    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public DateOnly? PeriodPPRRepair { get; set; }
    public DateTime? PeriodPaintRepair {get; set; }
    //PLAN
    public DateOnly? PlanPeriodMajorRepair { get; set; }
    public DateOnly? PlanPeriodPeriodicTest { get; set; }
    public DateOnly? PlanPeriodIntermediateTest { get; set; }
    public DateOnly? PlanPeriodDepotRepair { get; set; }
    public DateOnly? PlanPeriodPPRRepair { get; set; }
    public DateOnly? PeriodDetachRepair { get; set; }

    public int DangerClass { get; set; }
    public string Substance { get; set; }
    public decimal TareWeight2 { get; set; }
    public decimal TareWeight3 { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<VesselListDTO>? Vessels { get; set; }
    public MilageCisternDTO? LastMilage {get; set;}
    public RailwayCisternStatusDTO RailwayCisternStatus { get; set; } = null!;
    public DateOnly? ReRegistrationNextDate { get; set; }
    public DateOnly? ExtensionServiceLifeDate { get; set; }
}

public static class RailwayCisternDTOMapper
{
    public static RailwayCisternIdAndNumberDTO ToRailwayCisternIdAndNumberDTO(this RailwayCistern cistern)
    {
        return new RailwayCisternIdAndNumberDTO
        {
            Id = cistern.Id,
            Number = cistern.Number
        };
    }

    public static RailwayCisternListDTO ToRailwayCisternListDTO(this RailwayCistern cistern)
    {
        return new RailwayCisternListDTO
        {
            Id = cistern.Id,
            Number = cistern.Number,
            ManufacturerName = cistern.Manufacturer.Name,
            BuildDate = cistern.BuildDate,
            TypeName = cistern.Type.Name,
            ModelName = cistern.Model?.Name,
            OwnerName = cistern.Owner?.Name,
            RegistrationNumber = cistern.RegistrationNumber,
            RegistrationDate = cistern.RegistrationDate,
            AffiliationValue = cistern.Affiliation.Value
        };
    }

    public static RailwayCisternDetailDTO ToRailwayCisternDetailDTO(this RailwayCistern cistern)
    {
        return new RailwayCisternDetailDTO
        {
            Id = cistern.Id,
            Number = cistern.Number,
            Manufacturer = new ManufacturerDTO
            {
                Id = cistern.Manufacturer.Id,
                Name = cistern.Manufacturer.Name,
                Country = cistern.Manufacturer.Country,
                ShortName = cistern.Manufacturer.ShortName,
                Code = cistern.Manufacturer.Code,
                CreatedAt = cistern.Manufacturer.CreatedAt,
                UpdatedAt = cistern.Manufacturer.UpdatedAt
            },
            BuildDate = cistern.BuildDate,
            TareWeight = cistern.TareWeight,
            LoadCapacity = cistern.LoadCapacity,
            Length = cistern.Length,
            AxleCount = cistern.AxleCount,
            Volume = cistern.Volume,
            FillingVolume = cistern.FillingVolume,
            InitialTareWeight = cistern.InitialTareWeight,
            Type = new WagonTypeDTO
            {
                Id = cistern.Type.Id,
                Name = cistern.Type.Name,
                Type = cistern.Type.Type
            },
            Model = cistern.Model != null
                ? new WagonModelDTO
                {
                    Id = cistern.Model.Id,
                    Name = cistern.Model.Name,
                    MajorRep = cistern.Model.MajorRep,
                    DepoRep = cistern.Model.DepoRep,
                    IntermediateTest = cistern.Model.IntermediateTest,
                    PeriodicTest = cistern.Model.PeriodicTest,
                    PPRRep = cistern.Model.PPRRep,
                    UpdatedAt = cistern.Model.UpdatedAt,
                    Email = cistern.Model.Creator?.Email,
                    FirstName = cistern.Model.Creator?.FirstName,
                    LastName = cistern.Model.Creator?.LastName
                }
                : null,
            CommissioningDate = cistern.CommissioningDate,
            SerialNumber = cistern.SerialNumber,
            RegistrationNumber = cistern.RegistrationNumber,
            RegistrationDate = cistern.RegistrationDate,
            Registrar = cistern.Registrar != null
                ? new RegistrarDTO
                {
                    Id = cistern.Registrar.Id,
                    Name = cistern.Registrar.Name
                }
                : null,
            Notes = cistern.Notes,
            Owner = cistern.Owner != null
                ? new OwnerDTO
                {
                    Id = cistern.Owner.Id,
                    Name = cistern.Owner.Name,
                    UNP = cistern.Owner.UNP,
                    ShortName = cistern.Owner.ShortName,
                    Address = cistern.Owner.Address,
                    TreatRepairs = cistern.Owner.TreatRepairs,
                    CreatedAt = cistern.Owner.CreatedAt,
                    UpdatedAt = cistern.Owner.UpdatedAt
                }
                : null,
            TechConditions = cistern.TechConditions,
            Pripiska = cistern.Pripiska,
            ReRegistrationDate = cistern.ReRegistrationDate,
            Pressure = cistern.Pressure,
            TestPressure = cistern.TestPressure,
            Rent = cistern.Rent,
            Affiliation = new AffiliationDTO
            {
                Id = cistern.Affiliation.Id,
                Value = cistern.Affiliation.Value
            },
            ServiceLifeYears = cistern.ServiceLifeYears,
            PeriodMajorRepair = cistern.PeriodMajorRepair,
            PeriodPeriodicTest = cistern.PeriodPeriodicTest,
            PeriodIntermediateTest = cistern.PeriodIntermediateTest,
            PeriodDepotRepair = cistern.PeriodDepotRepair,
            PeriodPPRRepair = cistern.PeriodPPRRepair,
            PeriodPaintRepair = cistern.PeriodPaintRepair,
            PeriodDetachRepair = cistern.PeriodDetachRepair,
            DangerClass = cistern.DangerClass,
            Substance = cistern.Substance,
            TareWeight2 = cistern.TareWeight2,
            TareWeight3 = cistern.TareWeight3,
            CreatedAt = cistern.CreatedAt,
            UpdatedAt = cistern.UpdatedAt,
            Vessels = cistern.Vessels?.Select(v => v.ToVesselListDTO()).ToList(),
            LastMilage = cistern.MilageCisterns?.OrderByDescending(m => m.InputDate).FirstOrDefault()?.ToMilageCisternDTO(),
            RailwayCisternStatus = cistern.RailwayCisternStatus.ToRailwayCisternStatusDTO(),
            ReRegistrationNextDate = cistern.ReRegistrationNextDate,
            ExtensionServiceLifeDate = cistern.ExtensionServiceLifeDate
        };
    }

    public static RailwayCistern ToRailwayCistern(this CreateRailwayCisternDTO dto, string creatorId)
    {
        return new RailwayCistern
        {
            Number = dto.Number,
            ManufacturerId = dto.ManufacturerId,
            BuildDate = dto.BuildDate,
            TareWeight = dto.TareWeight,
            LoadCapacity = dto.LoadCapacity,
            Length = dto.Length,
            AxleCount = dto.AxleCount,
            Volume = dto.Volume,
            FillingVolume = dto.FillingVolume,
            InitialTareWeight = dto.InitialTareWeight,
            TypeId = dto.TypeId,
            ModelId = dto.ModelId,
            CommissioningDate = dto.CommissioningDate,
            SerialNumber = dto.SerialNumber,
            RegistrationNumber = dto.RegistrationNumber,
            RegistrationDate = dto.RegistrationDate,
            RegistrarId = dto.RegistrarId,
            Notes = dto.Notes,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            CreatorId = creatorId,
            OwnerId = dto.OwnerId,
            TechConditions = dto.TechConditions,
            Pripiska = dto.Pripiska,
            ReRegistrationDate = dto.ReRegistrationDate,
            Pressure = dto.Pressure,
            TestPressure = dto.TestPressure,
            Rent = dto.Rent,
            AffiliationId = dto.AffiliationId,
            ServiceLifeYears = dto.ServiceLifeYears,
            PeriodMajorRepair = dto.PeriodMajorRepair,
            PeriodPeriodicTest = dto.PeriodPeriodicTest,
            PeriodIntermediateTest = dto.PeriodIntermediateTest,
            PeriodDepotRepair = dto.PeriodDepotRepair,
            PeriodPPRRepair = dto.PeriodPPRRepair,
            PeriodPaintRepair = dto.PeriodPaintRepair,
            DangerClass = dto.DangerClass,
            Substance = dto.Substance,
            TareWeight2 = dto.TareWeight2,
            TareWeight3 = dto.TareWeight3,
            CisternStatusId = dto.RailwayCisternStatusId,
            ReRegistrationNextDate = dto.ReRegistrationNextDate,
            ExtensionServiceLifeDate = dto.ExtensionServiceLifeDate,
            PeriodDetachRepair = dto.PeriodDetachRepair
        };
    }

    public static void UpdateRailwayCistern(this RailwayCistern cistern, UpdateRailwayCisternDTO dto)
    {
        cistern.Number = dto.Number;
        cistern.ManufacturerId = dto.ManufacturerId;
        cistern.BuildDate = dto.BuildDate;
        cistern.TareWeight = dto.TareWeight;
        cistern.LoadCapacity = dto.LoadCapacity;
        cistern.Length = dto.Length;
        cistern.AxleCount = dto.AxleCount;
        cistern.Volume = dto.Volume;
        cistern.FillingVolume = dto.FillingVolume;
        cistern.InitialTareWeight = dto.InitialTareWeight;
        cistern.TypeId = dto.TypeId;
        cistern.ModelId = dto.ModelId;
        cistern.CommissioningDate = dto.CommissioningDate;
        cistern.SerialNumber = dto.SerialNumber;
        cistern.RegistrationNumber = dto.RegistrationNumber;
        cistern.RegistrationDate = dto.RegistrationDate;
        cistern.RegistrarId = dto.RegistrarId;
        cistern.Notes = dto.Notes;
        cistern.OwnerId = dto.OwnerId;
        cistern.TechConditions = dto.TechConditions;
        cistern.Pripiska = dto.Pripiska;
        cistern.ReRegistrationDate = dto.ReRegistrationDate;
        cistern.Pressure = dto.Pressure;
        cistern.TestPressure = dto.TestPressure;
        cistern.Rent = dto.Rent;
        cistern.AffiliationId = dto.AffiliationId;
        cistern.ServiceLifeYears = dto.ServiceLifeYears;
        cistern.PeriodMajorRepair = dto.PeriodMajorRepair;
        cistern.PeriodPeriodicTest = dto.PeriodPeriodicTest;
        cistern.PeriodIntermediateTest = dto.PeriodIntermediateTest;
        cistern.PeriodDepotRepair = dto.PeriodDepotRepair;
        cistern.PeriodPPRRepair = dto.PeriodPPRRepair;
        cistern.PeriodPaintRepair = dto.PeriodPaintRepair;
        cistern.DangerClass = dto.DangerClass;
        cistern.Substance = dto.Substance;
        cistern.TareWeight2 = dto.TareWeight2;
        cistern.TareWeight3 = dto.TareWeight3;
        cistern.CisternStatusId = dto.RailwayCisternStatusId;
        cistern.ReRegistrationNextDate = dto.ReRegistrationNextDate;
        cistern.ExtensionServiceLifeDate = dto.ExtensionServiceLifeDate;
        cistern.PeriodDetachRepair = dto.PeriodDetachRepair;
        cistern.UpdatedAt = DateTimeOffset.UtcNow;
    }
}

public class RailwayCisternListDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; }
    public string ManufacturerName { get; set; }
    public DateOnly BuildDate { get; set; }
    public string TypeName { get; set; }
    public string ModelName { get; set; }
    public string OwnerName { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public string AffiliationValue { get; set; }
}

public class CreateRailwayCisternDTO
{
    public string Number { get; set; }
    public Guid ManufacturerId { get; set; }
    public DateOnly BuildDate { get; set; }
    public decimal TareWeight { get; set; }
    public decimal LoadCapacity { get; set; }
    public int Length { get; set; }
    public int AxleCount { get; set; }
    public decimal Volume { get; set; }
    public decimal? FillingVolume { get; set; }
    public decimal? InitialTareWeight { get; set; }
    public Guid TypeId { get; set; }
    public Guid? ModelId { get; set; }
    public DateOnly? CommissioningDate { get; set; }
    public string SerialNumber { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public Guid? RegistrarId { get; set; }
    public string Notes { get; set; }
    public Guid? OwnerId { get; set; }
    public string? TechConditions { get; set; }
    public string? Pripiska { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public decimal Pressure { get; set; }
    public decimal TestPressure { get; set; }
    public string? Rent { get; set; }
    public Guid AffiliationId { get; set; }
    public int ServiceLifeYears { get; set; }
    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public DateOnly? PeriodPPRRepair { get; set; }
    public DateTime? PeriodPaintRepair {get; set; }
    public int DangerClass { get; set; }
    public string Substance { get; set; }
    public decimal TareWeight2 { get; set; }
    public decimal TareWeight3 { get; set; }
    public Guid RailwayCisternStatusId {get; set; }
    public DateOnly? ReRegistrationNextDate { get; set; }
    public DateOnly? ExtensionServiceLifeDate { get; set; }
    public DateOnly? PeriodDetachRepair { get; set; }
}

public class UpdateRailwayCisternDTO
{
    public string Number { get; set; }
    public Guid ManufacturerId { get; set; }
    public DateOnly BuildDate { get; set; }
    public decimal TareWeight { get; set; }
    public decimal LoadCapacity { get; set; }
    public int Length { get; set; }
    public int AxleCount { get; set; }
    public decimal Volume { get; set; }
    public decimal? FillingVolume { get; set; }
    public decimal? InitialTareWeight { get; set; }
    public Guid TypeId { get; set; }
    public Guid? ModelId { get; set; }
    public DateOnly? CommissioningDate { get; set; }
    public string SerialNumber { get; set; }
    public string RegistrationNumber { get; set; }
    public DateOnly RegistrationDate { get; set; }
    public Guid? RegistrarId { get; set; }
    public string Notes { get; set; }
    public Guid? OwnerId { get; set; }
    public string? TechConditions { get; set; }
    public string? Pripiska { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public decimal Pressure { get; set; }
    public decimal TestPressure { get; set; }
    public string? Rent { get; set; }
    public Guid AffiliationId { get; set; }
    public int ServiceLifeYears { get; set; }
    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public DateOnly? PeriodPPRRepair { get; set; }
    public DateTime? PeriodPaintRepair {get; set; }
    public int DangerClass { get; set; }
    public string Substance { get; set; }
    public decimal TareWeight2 { get; set; }
    public decimal TareWeight3 { get; set; }
    public Guid RailwayCisternStatusId {get; set; }
    public DateOnly? ReRegistrationNextDate { get; set; }
    public DateOnly? ExtensionServiceLifeDate { get; set; }
    public DateOnly? PeriodDetachRepair { get; set; }
}

public class FilterRepairsCisternsRequestDTO
{
    public string[]? Numbers {get; set;}
    public string[]? WagonModelsNames {get; set;}
    public DateRange? BuildDate { get; set; }
    public DateRange? CommissioningDate {get;set;}
    public DateRange? CommissioningEndDate {get;set; }

    public DateRange? PeriodMajorRepair { get; set; }
    public DateRange? PeriodPeriodicTest { get; set; }
    public DateRange? PeriodIntermediateTest { get; set; }
    public DateRange? PeriodDepotRepair { get; set; }
    public DateRange? PeriodPPRRepair { get; set; }
    public DateRange? PeriodDetachRepair { get; set; }
    public DateTimeWithoutOffsetRange? PeriodPaintRepair {get; set; }
    //PLAN
    public DateRange? PlanPeriodMajorRepair { get; set; }
    public DateRange? PlanPeriodPeriodicTest { get; set; }
    public DateRange? PlanPeriodIntermediateTest { get; set; }
    public DateRange? PlanPeriodDepotRepair { get; set; }
    public DateRange? PlanPeriodPPRRepair { get; set; }
    public DateRange? ExtensionServiceLifeDate { get; set; }
    public bool IsAnd {get; set;} = true;
}

public class FilterRepairsCisternsResponseDTO
{
    public Guid Id { get; set;}
    public string Number {get;set;}
    public string RegistrationNumber {get; set;}
    public Guid? WagonModelId {get; set; }
    public string? WagonModelName {get; set;}
    public DateOnly BuildDate {get; set;}
    public DateOnly? CommissioningDate {get; set;}
    public int ServiceLifeYears {get; set;}
    public DateOnly? PeriodMajorRepair { get; set; }
    public DateOnly? PeriodPeriodicTest { get; set; }
    public DateOnly? PeriodIntermediateTest { get; set; }
    public DateOnly? PeriodDepotRepair { get; set; }
    public DateOnly? PeriodPPRRepair { get; set; }
    public DateTime? PeriodPaintRepair {get; set; }
    public DateOnly? PeriodDetachRepair { get; set; }
    //PLAN
    public DateOnly? PlanPeriodMajorRepair { get; set; }
    public string? PlanPeriodMajorRepairStatus { get; set; }
    public DateOnly? PlanPeriodPeriodicTest { get; set; }
    public string? PlanPeriodPeriodicTestStatus { get; set; }
    public DateOnly? PlanPeriodIntermediateTest { get; set; }
    public string? PlanPeriodIntermediateTestStatus { get; set; }
    public DateOnly? PlanPeriodDepotRepair { get; set; }
    public string? PlanPeriodDepotRepairStatus { get; set; }
    public DateOnly? PlanPeriodPPRRepair { get; set; }
    public string? PlanPeriodPPRRepairStatus { get; set; }
    public int Milage {get; set;}
    public int MilageNorm {get; set;}
    public int MilageRemain {get; set;}
    public DateOnly? CommissioningEndDate {get; set;}
    public DateOnly? ExtensionServiceLifeDate { get; set; }
    public DateOnly? ReRegistrationDate { get; set; }
    public DateOnly? ReRegistrationNextDate { get; set; }
}
