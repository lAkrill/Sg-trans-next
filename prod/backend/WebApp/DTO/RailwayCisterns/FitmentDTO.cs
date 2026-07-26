using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class FitmentDTO
{
    public Guid Id { get; set; }
    public Guid FitmentTypeId { get; set; }
    public string SerialNumber { get; set; } = null!;
    public string PassportNumber { get; set; } = null!;
    public string? File { get; set; }
    public DateTime BuildDate { get; set; }
    public DateTime? LastRepairDate { get; set; }
    public int PeriodRep { get; set; }
    public int ServiceLifeYears { get; set; }
    public int Code { get; set; }
    public Guid? LocationDepoId { get; set; }
    public Guid? LocationCisternId { get; set; }
    public Guid ModelId { get; set; }
    public Guid DepotId { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
    
    public FitmentTypeDTO FitmentType { get; set; } = null!;
    public FitmentModelDTO Model { get; set; } = null!;
    public DepotDTO Depot { get; set; } = null!;
    public DepotDTO? LocationDepo { get; set; }
    public RailwayCisternIdAndNumberDTO? LocationCistern { get; set; }
}

public class CreateFitmentDTO
{
    public Guid FitmentTypeId { get; set; }
    public string SerialNumber { get; set; } = null!;
    public string PassportNumber { get; set; } = "0";
    public string? File { get; set; }
    public DateTime BuildDate { get; set; }
    public DateTime? LastRepairDate { get; set; }
    public int PeriodRep { get; set; } = 1;
    public int ServiceLifeYears { get; set; } = 30;
    public int Code { get; set; } = 0;
    public Guid? LocationDepoId { get; set; }
    public Guid? LocationCisternId { get; set; }
    public Guid ModelId { get; set; }
    public Guid DepotId { get; set; }
}

public class UpdateFitmentDTO
{
    public Guid FitmentTypeId { get; set; }
    public string SerialNumber { get; set; } = null!;
    public string PassportNumber { get; set; } = null!;
    public string? File { get; set; }
    public DateTime BuildDate { get; set; }
    public DateTime? LastRepairDate { get; set; }
    public int PeriodRep { get; set; }
    public int ServiceLifeYears { get; set; }
    public int Code { get; set; }
    public Guid? LocationDepoId { get; set; }
    public Guid? LocationCisternId { get; set; }
    public Guid ModelId { get; set; }
    public Guid DepotId { get; set; }
}

public class FitmentTypeDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public int Code { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
}

public class CreateFitmentTypeDTO
{
    public string Name { get; set; } = null!;
    public int Code { get; set; } = 0;
}

public class UpdateFitmentTypeDTO
{
    public string Name { get; set; } = null!;
    public int Code { get; set; }
}

public class FitmentModelDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
}

public class CreateFitmentModelDTO
{
    public string Name { get; set; } = null!;
}

public class UpdateFitmentModelDTO
{
    public string Name { get; set; } = null!;
}

public static class FitmentDTOMapper
{
    public static FitmentDTO ToFitmentDTO(this Fitment fitment)
    {
        return new FitmentDTO()
        {
            Id = fitment.Id,
            FitmentTypeId = fitment.FitmentTypeId,
            SerialNumber = fitment.SerialNumber,
            PassportNumber = fitment.PassportNumber,
            File = fitment.File,
            BuildDate = fitment.BuildDate,
            LastRepairDate = fitment.LastRepairDate,
            PeriodRep = fitment.PeriodRep,
            ServiceLifeYears = fitment.ServiceLifeYears,
            Code = fitment.Code,
            LocationDepoId = fitment.LocationDepoId,
            LocationCisternId = fitment.LocationCisternId,
            ModelId = fitment.ModelId,
            DepotId = fitment.DepotId,
            UpdatedAt = fitment.UpdatedAt,
            CreatorId = fitment.CreatorId,
            FitmentType = fitment.FitmentType.ToFitmentTypeDTO(),
            Model = fitment.Model.ToFitmentModelDTO(),
            Depot = new DepotDTO
            {
                Id = fitment.Depot.Id,
                Name = fitment.Depot.Name,
                Code = fitment.Depot.Code,
                Location = fitment.Depot.Location,
                ShortName = fitment.Depot.ShortName,
                CreatedAt = fitment.Depot.CreatedAt
            },
            LocationDepo = fitment.LocationDepo == null ? null : new DepotDTO
            {
                Id = fitment.LocationDepo.Id,
                Name = fitment.LocationDepo.Name,
                Code = fitment.LocationDepo.Code,
                Location = fitment.LocationDepo.Location,
                ShortName = fitment.LocationDepo.ShortName,
                CreatedAt = fitment.LocationDepo.CreatedAt
            },
            LocationCistern = fitment.LocationCistern == null ? null : new RailwayCisternIdAndNumberDTO
            {
                Id = fitment.LocationCistern.Id,
                Number = fitment.LocationCistern.Number
            }
        };
    }

    public static Fitment ToFitment(this CreateFitmentDTO createFitmentDTO, Guid creatorId)
    {
        return new Fitment()
        {
            Id = Guid.NewGuid(),
            FitmentTypeId = createFitmentDTO.FitmentTypeId,
            SerialNumber = createFitmentDTO.SerialNumber,
            PassportNumber = createFitmentDTO.PassportNumber,
            File = createFitmentDTO.File,
            BuildDate = createFitmentDTO.BuildDate,
            LastRepairDate = createFitmentDTO.LastRepairDate,
            PeriodRep = createFitmentDTO.PeriodRep,
            ServiceLifeYears = createFitmentDTO.ServiceLifeYears,
            Code = createFitmentDTO.Code,
            LocationDepoId = createFitmentDTO.LocationDepoId,
            LocationCisternId = createFitmentDTO.LocationCisternId,
            ModelId = createFitmentDTO.ModelId,
            DepotId = createFitmentDTO.DepotId,
            CreatorId = creatorId,
            UpdatedAt = DateTime.Now
        };
    }

    public static void UpdateFitment(this Fitment fitment, UpdateFitmentDTO updateFitmentDTO)
    {
        fitment.FitmentTypeId = updateFitmentDTO.FitmentTypeId;
        fitment.SerialNumber = updateFitmentDTO.SerialNumber;
        fitment.PassportNumber = updateFitmentDTO.PassportNumber;
        fitment.File = updateFitmentDTO.File;
        fitment.BuildDate = updateFitmentDTO.BuildDate;
        fitment.LastRepairDate = updateFitmentDTO.LastRepairDate;
        fitment.PeriodRep = updateFitmentDTO.PeriodRep;
        fitment.ServiceLifeYears = updateFitmentDTO.ServiceLifeYears;
        fitment.Code = updateFitmentDTO.Code;
        fitment.LocationDepoId = updateFitmentDTO.LocationDepoId;
        fitment.LocationCisternId = updateFitmentDTO.LocationCisternId;
        fitment.ModelId = updateFitmentDTO.ModelId;
        fitment.DepotId = updateFitmentDTO.DepotId;
        fitment.UpdatedAt = DateTime.Now;
    }

    public static FitmentTypeDTO ToFitmentTypeDTO(this FitmentType fitmentType)
    {
        return new FitmentTypeDTO()
        {
            Id = fitmentType.Id,
            Name = fitmentType.Name,
            Code = fitmentType.Code,
            UpdatedAt = fitmentType.UpdatedAt,
            CreatorId = fitmentType.CreatorId
        };
    }

    public static FitmentType ToFitmentType(this CreateFitmentTypeDTO createFitmentTypeDTO, Guid creatorId)
    {
        return new FitmentType()
        {
            Id = Guid.NewGuid(),
            Name = createFitmentTypeDTO.Name,
            Code = createFitmentTypeDTO.Code,
            CreatorId = creatorId,
            UpdatedAt = DateTime.Now
        };
    }

    public static void UpdateFitmentType(this FitmentType fitmentType, UpdateFitmentTypeDTO updateFitmentTypeDTO)
    {
        fitmentType.Name = updateFitmentTypeDTO.Name;
        fitmentType.Code = updateFitmentTypeDTO.Code;
        fitmentType.UpdatedAt = DateTime.Now;
    }

    public static FitmentModelDTO ToFitmentModelDTO(this FitmentModel fitmentModel)
    {
        return new FitmentModelDTO()
        {
            Id = fitmentModel.Id,
            Name = fitmentModel.Name,
            UpdatedAt = fitmentModel.UpdatedAt,
            CreatorId = fitmentModel.CreatorId
        };
    }

    public static FitmentModel ToFitmentModel(this CreateFitmentModelDTO createFitmentModelDTO, Guid creatorId)
    {
        return new FitmentModel()
        {
            Id = Guid.NewGuid(),
            Name = createFitmentModelDTO.Name,
            CreatorId = creatorId,
            UpdatedAt = DateTime.Now
        };
    }

    public static void UpdateFitmentModel(this FitmentModel fitmentModel, UpdateFitmentModelDTO updateFitmentModelDTO)
    {
        fitmentModel.Name = updateFitmentModelDTO.Name;
        fitmentModel.UpdatedAt = DateTime.Now;
    }
}
