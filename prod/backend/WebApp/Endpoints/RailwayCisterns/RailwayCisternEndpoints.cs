using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Text.Json;

namespace WebApp.Endpoints.RailwayCisterns;

public record ResponseForPagination(
    List<RailwayCisternDetailDTO> RailwayCisterns,
    int TotalCount,
    int TotalPages,
    int CurrentPage,
    int PageSize);

public record ResponseForPaginationList(
    List<RailwayCisternListDTO> RailwayCisterns,
    int TotalCount,
    int TotalPages,
    int CurrentPage,
    int PageSize);

public static class RailwayCisternEndpoints
{
    public static void MapRailwayCisternEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/railway-cisterns")
            .RequireAuthorization()
            .WithTags("railway-cisterns");

        // Get all cistern numbers
        group.MapGet("/numbers", async ([FromServices] ApplicationDbContext context) =>
            {
                var numbers = await context.Set<RailwayCistern>()
                    .Select(rc => rc.Number)
                    .OrderBy(n => n)
                    .ToListAsync();
                return Results.Ok(numbers);
            })
            .WithName("GetAllCisternNumbers")
            .Produces<List<string>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get all cistern numbers and ids
        group.MapGet("/id-numbers", async ([FromServices] ApplicationDbContext context) =>
            {
                var list = await context.Set<RailwayCistern>()
                    .Select(rc => new RailwayCisternIdAndNumberDTO { Id = rc.Id, Number = rc.Number })
                    .OrderBy(n => n.Number)
                    .ToListAsync();
                return Results.Ok(list);
            })
            .WithName("GetAllCisternIdsAndNumbers")
            .Produces<List<RailwayCisternIdAndNumberDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Search cistern numbers by prefix
        group.MapGet("/numbers/search", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] string prefix) =>
            {
                var query = context.Set<RailwayCistern>()
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(prefix))
                {
                    query = query.Where(rc => rc.Number.StartsWith(prefix));
                }

                var numbers = await query
                    .Select(rc => rc.Number)
                    .OrderBy(n => n)
                    .ToListAsync();

                return Results.Ok(numbers);
            })
            .WithName("SearchCisternNumbersByPrefix")
            .Produces<List<string>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get basic list
        group.MapGet("/", async ([FromServices] ApplicationDbContext context) =>
            {
                var cisterns = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Affiliation)
                    .Select(rc => new RailwayCisternListDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        ManufacturerName = rc.Manufacturer.Name,
                        BuildDate = rc.BuildDate,
                        TypeName = rc.Type.Name,
                        ModelName = rc.Model.Name,
                        OwnerName = rc.Owner.Name,
                        RegistrationNumber = rc.RegistrationNumber,
                        RegistrationDate = rc.RegistrationDate,
                        AffiliationValue = rc.Affiliation.Value
                    })
                    .ToListAsync();
                return Results.Ok(cisterns);
            })
            .WithName("GetRailwayCisterns")
            .Produces<List<RailwayCisternListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get detailed list
        group.MapGet("/detailed", async ([FromServices] ApplicationDbContext context) =>
            {
                var cisterns = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .Select(rc => new RailwayCisternDetailDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        Manufacturer = new ManufacturerDTO
                        {
                            Id = rc.Manufacturer.Id,
                            Name = rc.Manufacturer.Name,
                            Country = rc.Manufacturer.Country,
                            ShortName = rc.Manufacturer.ShortName,
                            Code = rc.Manufacturer.Code
                        },
                        BuildDate = rc.BuildDate,
                        TareWeight = rc.TareWeight,
                        LoadCapacity = rc.LoadCapacity,
                        Length = rc.Length,
                        AxleCount = rc.AxleCount,
                        Volume = rc.Volume,
                        FillingVolume = rc.FillingVolume,
                        InitialTareWeight = rc.InitialTareWeight,
                        Type = new WagonTypeDTO
                        {
                            Id = rc.Type.Id,
                            Name = rc.Type.Name,
                            Type = rc.Type.Type
                        },
                        Model = rc.Model != null
                            ? new WagonModelDTO
                            {
                                Id = rc.Model.Id,
                                Name = rc.Model.Name
                            }
                            : null,
                        CommissioningDate = rc.CommissioningDate,
                        SerialNumber = rc.SerialNumber,
                        RegistrationNumber = rc.RegistrationNumber,
                        RegistrationDate = rc.RegistrationDate,
                        Registrar = rc.Registrar != null
                            ? new RegistrarDTO
                            {
                                Id = rc.Registrar.Id,
                                Name = rc.Registrar.Name
                            }
                            : null,
                        Notes = rc.Notes,
                        Owner = rc.Owner != null
                            ? new OwnerDTO
                            {
                                Id = rc.Owner.Id,
                                Name = rc.Owner.Name,
                                UNP = rc.Owner.UNP,
                                ShortName = rc.Owner.ShortName,
                                Address = rc.Owner.Address,
                                TreatRepairs = rc.Owner.TreatRepairs
                            }
                            : null,
                        TechConditions = rc.TechConditions,
                        Pripiska = rc.Pripiska,
                        ReRegistrationDate = rc.ReRegistrationDate,
                        Pressure = rc.Pressure,
                        TestPressure = rc.TestPressure,
                        Rent = rc.Rent,
                        Affiliation = new AffiliationDTO
                        {
                            Id = rc.Affiliation.Id,
                            Value = rc.Affiliation.Value
                        },
                        ServiceLifeYears = rc.ServiceLifeYears,
                        PeriodMajorRepair = rc.PeriodMajorRepair,
                        PeriodPeriodicTest = rc.PeriodPeriodicTest,
                        PeriodIntermediateTest = rc.PeriodIntermediateTest,
                        PeriodDepotRepair = rc.PeriodDepotRepair,
                        PeriodPPRRepair = rc.PeriodPPRRepair,
                        PeriodPaintRepair = rc.PeriodPaintRepair,
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt,
                        Vessels = rc.Vessels != null
                            ? rc.Vessels.Select(v => new VesselListDTO
                            {
                                Id = v.Id,
                                SerialNumber = v.SerialNumber,
                                BuildDate = v.BuildDate,
                                Manufacturer = v.Manufacturer,
                                WagonModelId = v.WagonModelId,
                                Pressure = v.Pressure,
                                Capacity = v.Capacity
                            }).ToList()
                            : null,
                        RailwayCisternStatus = rc.RailwayCisternStatus.ToRailwayCisternStatusDTO(),
                        ReRegistrationNextDate = rc.ReRegistrationNextDate,
                        ExtensionServiceLifeDate = rc.ExtensionServiceLifeDate,
                        PeriodDetachRepair =rc.PeriodDetachRepair

                    })
                    .ToListAsync();
                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                Guid MajorRepairType  = Guid.Parse("423e276f-4caa-4e58-99a4-28339703f6bf");
                foreach (var cistern in cisterns)
                {

                    WagonModel Model = null;
                    var milage = milageCisterns.Where(m => m.CisternId == cistern.Id).OrderByDescending(m => m.InputDate).FirstOrDefault();
                    
                    var LastMilage = milage == null? null : new MilageCisternDTO
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
                    

                    cistern.LastMilage=LastMilage;
                    if (cistern.Model != null)
                        Model = models.FirstOrDefault(m => m.Id == cistern.Model.Id);
                    var pers = personalCisRepairPeriods.FirstOrDefault(p => p.CisternId == cistern.Id);

                    var periodictest = 8;
                    var IntermediateTest = 4;
                    var PPRRepair = 3;
                    var MajorRep = 10;
                    var DepoRep = 3;
                    if (Model != null)
                    {
                        periodictest = Model.PeriodicTest.HasValue ? Model.PeriodicTest.Value : 8;
                        IntermediateTest = Model.IntermediateTest.HasValue ? Model.IntermediateTest.Value : 4;
                        PPRRepair = Model.PPRRep.HasValue ? Model.PPRRep.Value : 3;
                        MajorRep = Model.MajorRep;
                        DepoRep = Model.DepoRep;
                    }
                    if (pers != null)
                    {
                        if (pers.PeriodicTest.HasValue)
                            periodictest = pers.PeriodicTest.Value;
                        if (pers.IntermediateTest.HasValue)
                            IntermediateTest = pers.IntermediateTest.Value;
                        if (pers.PPRRep.HasValue)
                            PPRRepair = pers.PPRRep.Value;
                        if (pers.MajorRep.HasValue)
                            MajorRep = pers.MajorRep.Value;
                        if (pers.DepoRep.HasValue)
                            DepoRep = pers.DepoRep.Value;
                    }

                    cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest);
                    cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, IntermediateTest);
                    cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, PPRRepair);
                    cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, MajorRep);
                    cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);

                    //???????????????????????????????????
                    if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
                    {
                        cistern.PlanPeriodDepotRepair = milage.RepairDate;
                        if (milage.RepairTypeId == MajorRepairType)
                        {
                            cistern.PlanPeriodMajorRepair = milage.RepairDate;
                        }
                    }

                    if(milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair||milage.RepairTypeId == MajorRepairType)
                    {
                        DateOnly? nextDepot=cistern.PlanPeriodDepotRepair, prevDepot = cistern.PlanPeriodDepotRepair;
                    while (nextDepot < cistern.PlanPeriodMajorRepair)
                    {
                        prevDepot = nextDepot;
                        nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);
                    }

                    int diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
                    if(diff <= 180)
                    {
                        cistern.PlanPeriodMajorRepair = prevDepot;
                    }
                    else
                    {
                        cistern.PlanPeriodMajorRepair = nextDepot;
                    }
                    }
                }

                return Results.Ok(cisterns);
            })
            .WithName("GetDetailedRailwayCisterns")
            .Produces<List<RailwayCisternDetailDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get detailed list with pagination
        group.MapGet("/detailed/paged", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10) =>
            {
                var query = context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .AsQueryable();

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var cisterns = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(rc => new RailwayCisternDetailDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        Manufacturer = new ManufacturerDTO
                        {
                            Id = rc.Manufacturer.Id,
                            Name = rc.Manufacturer.Name,
                            Country = rc.Manufacturer.Country,
                            ShortName = rc.Manufacturer.ShortName,
                            Code = rc.Manufacturer.Code
                        },
                        BuildDate = rc.BuildDate,
                        TareWeight = rc.TareWeight,
                        LoadCapacity = rc.LoadCapacity,
                        Length = rc.Length,
                        AxleCount = rc.AxleCount,
                        Volume = rc.Volume,
                        FillingVolume = rc.FillingVolume,
                        InitialTareWeight = rc.InitialTareWeight,
                        Type = new WagonTypeDTO
                        {
                            Id = rc.Type.Id,
                            Name = rc.Type.Name,
                            Type = rc.Type.Type
                        },
                        Model = rc.Model != null
                            ? new WagonModelDTO
                            {
                                Id = rc.Model.Id,
                                Name = rc.Model.Name
                            }
                            : null,
                        CommissioningDate = rc.CommissioningDate,
                        SerialNumber = rc.SerialNumber,
                        RegistrationNumber = rc.RegistrationNumber,
                        RegistrationDate = rc.RegistrationDate,
                        Registrar = rc.Registrar != null
                            ? new RegistrarDTO
                            {
                                Id = rc.Registrar.Id,
                                Name = rc.Registrar.Name
                            }
                            : null,
                        Notes = rc.Notes,
                        Owner = rc.Owner != null
                            ? new OwnerDTO
                            {
                                Id = rc.Owner.Id,
                                Name = rc.Owner.Name,
                                UNP = rc.Owner.UNP,
                                ShortName = rc.Owner.ShortName,
                                Address = rc.Owner.Address,
                                TreatRepairs = rc.Owner.TreatRepairs
                            }
                            : null,
                        TechConditions = rc.TechConditions,
                        Pripiska = rc.Pripiska,
                        ReRegistrationDate = rc.ReRegistrationDate,
                        Pressure = rc.Pressure,
                        TestPressure = rc.TestPressure,
                        Rent = rc.Rent,
                        Affiliation = new AffiliationDTO
                        {
                            Id = rc.Affiliation.Id,
                            Value = rc.Affiliation.Value
                        },
                        ServiceLifeYears = rc.ServiceLifeYears,
                        PeriodMajorRepair = rc.PeriodMajorRepair,
                        PeriodPeriodicTest = rc.PeriodPeriodicTest,
                        PeriodIntermediateTest = rc.PeriodIntermediateTest,
                        PeriodDepotRepair = rc.PeriodDepotRepair,
                        PeriodPPRRepair = rc.PeriodPPRRepair,
                        PeriodPaintRepair = rc.PeriodPaintRepair,
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt,
                        Vessels = rc.Vessels != null
                            ? rc.Vessels.Select(v => new VesselListDTO
                            {
                                Id = v.Id,
                                SerialNumber = v.SerialNumber,
                                BuildDate = v.BuildDate,
                                Manufacturer = v.Manufacturer,
                                WagonModelId = v.WagonModelId,
                                Pressure = v.Pressure,
                                Capacity = v.Capacity
                            }).ToList()
                            : null,
                        RailwayCisternStatus = rc.RailwayCisternStatus.ToRailwayCisternStatusDTO(),
                           ReRegistrationNextDate = rc.ReRegistrationNextDate,
                        ExtensionServiceLifeDate = rc.ExtensionServiceLifeDate,
                        PeriodDetachRepair = rc.PeriodDetachRepair
                    })
                    .ToListAsync();

                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                Guid MajorRepairType  = Guid.Parse("423e276f-4caa-4e58-99a4-28339703f6bf");
                foreach (var cistern in cisterns)
                {

                    WagonModel Model = null;
                    var milage = milageCisterns.Where(m => m.CisternId == cistern.Id).OrderByDescending(m => m.InputDate).FirstOrDefault();
                    
                    var LastMilage = milage == null? null : new MilageCisternDTO
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
                    

                    cistern.LastMilage=LastMilage;
                    if (cistern.Model != null)
                        Model = models.FirstOrDefault(m => m.Id == cistern.Model.Id);
                    var pers = personalCisRepairPeriods.FirstOrDefault(p => p.CisternId == cistern.Id);

                    var periodictest = 8;
                    var IntermediateTest = 4;
                    var PPRRepair = 3;
                    var MajorRep = 10;
                    var DepoRep = 3;
                    if (Model != null)
                    {
                        periodictest = Model.PeriodicTest.HasValue ? Model.PeriodicTest.Value : 8;
                        IntermediateTest = Model.IntermediateTest.HasValue ? Model.IntermediateTest.Value : 4;
                        PPRRepair = Model.PPRRep.HasValue ? Model.PPRRep.Value : 3;
                        MajorRep = Model.MajorRep;
                        DepoRep = Model.DepoRep;
                    }
                    if (pers != null)
                    {
                        if (pers.PeriodicTest.HasValue)
                            periodictest = pers.PeriodicTest.Value;
                        if (pers.IntermediateTest.HasValue)
                            IntermediateTest = pers.IntermediateTest.Value;
                        if (pers.PPRRep.HasValue)
                            PPRRepair = pers.PPRRep.Value;
                        if (pers.MajorRep.HasValue)
                            MajorRep = pers.MajorRep.Value;
                        if (pers.DepoRep.HasValue)
                            DepoRep = pers.DepoRep.Value;
                    }

                    cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest);
                    cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, IntermediateTest);
                    cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, PPRRepair);
                    cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, MajorRep);
                    cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);

                    //???????????????????????????????????
                    if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
                    {
                        cistern.PlanPeriodDepotRepair = milage.RepairDate;
                        if (milage.RepairTypeId == MajorRepairType)
                        {
                            cistern.PlanPeriodMajorRepair = milage.RepairDate;
                        }
                    }

                    if(milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair||milage.RepairTypeId == MajorRepairType)
                    {
                        DateOnly? nextDepot=cistern.PlanPeriodDepotRepair, prevDepot = cistern.PlanPeriodDepotRepair;
                    while (nextDepot < cistern.PlanPeriodMajorRepair)
                    {
                        prevDepot = nextDepot;
                        nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);
                    }

                    int diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
                    if(diff <= 180)
                    {
                        cistern.PlanPeriodMajorRepair = prevDepot;
                    }
                    else
                    {
                        cistern.PlanPeriodMajorRepair = nextDepot;
                    }
                    }
                }

                var response = new ResponseForPagination(cisterns,
                    totalCount,
                    totalPages,
                    page,
                    pageSize);

                return Results.Ok(response);
            })
            .WithName("GetPagedDetailedRailwayCisterns")
            .Produces<ResponseForPagination>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Search detailed list by number
        group.MapGet("/detailed/search", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] string prefix) =>
            {
                if (string.IsNullOrWhiteSpace(prefix))
                    return Results.BadRequest("Search number is required");

                var cisterns = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .Where(rc => rc.Number.StartsWith(prefix))
                    .Select(rc => new RailwayCisternDetailDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        Manufacturer = new ManufacturerDTO
                        {
                            Id = rc.Manufacturer.Id,
                            Name = rc.Manufacturer.Name,
                            Country = rc.Manufacturer.Country,
                            ShortName = rc.Manufacturer.ShortName,
                            Code = rc.Manufacturer.Code
                        },
                        BuildDate = rc.BuildDate,
                        TareWeight = rc.TareWeight,
                        LoadCapacity = rc.LoadCapacity,
                        Length = rc.Length,
                        AxleCount = rc.AxleCount,
                        Volume = rc.Volume,
                        FillingVolume = rc.FillingVolume,
                        InitialTareWeight = rc.InitialTareWeight,
                        Type = new WagonTypeDTO
                        {
                            Id = rc.Type.Id,
                            Name = rc.Type.Name,
                            Type = rc.Type.Type
                        },
                        Model = rc.Model != null
                            ? new WagonModelDTO
                            {
                                Id = rc.Model.Id,
                                Name = rc.Model.Name
                            }
                            : null,
                        CommissioningDate = rc.CommissioningDate,
                        SerialNumber = rc.SerialNumber,
                        RegistrationNumber = rc.RegistrationNumber,
                        RegistrationDate = rc.RegistrationDate,
                        Registrar = rc.Registrar != null
                            ? new RegistrarDTO
                            {
                                Id = rc.Registrar.Id,
                                Name = rc.Registrar.Name
                            }
                            : null,
                        Notes = rc.Notes,
                        Owner = rc.Owner != null
                            ? new OwnerDTO
                            {
                                Id = rc.Owner.Id,
                                Name = rc.Owner.Name,
                                UNP = rc.Owner.UNP,
                                ShortName = rc.Owner.ShortName,
                                Address = rc.Owner.Address,
                                TreatRepairs = rc.Owner.TreatRepairs
                            }
                            : null,
                        TechConditions = rc.TechConditions,
                        Pripiska = rc.Pripiska,
                        ReRegistrationDate = rc.ReRegistrationDate,
                        Pressure = rc.Pressure,
                        TestPressure = rc.TestPressure,
                        Rent = rc.Rent,
                        Affiliation = new AffiliationDTO
                        {
                            Id = rc.Affiliation.Id,
                            Value = rc.Affiliation.Value
                        },
                        ServiceLifeYears = rc.ServiceLifeYears,
                        PeriodMajorRepair = rc.PeriodMajorRepair,
                        PeriodPeriodicTest = rc.PeriodPeriodicTest,
                        PeriodIntermediateTest = rc.PeriodIntermediateTest,
                        PeriodDepotRepair = rc.PeriodDepotRepair,
                        PeriodPPRRepair = rc.PeriodPPRRepair,
                        PeriodPaintRepair = rc.PeriodPaintRepair,
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt,
                        Vessels = rc.Vessels != null
                            ? rc.Vessels.Select(v => new VesselListDTO
                            {
                                Id = v.Id,
                                SerialNumber = v.SerialNumber,
                                BuildDate = v.BuildDate,
                                Manufacturer = v.Manufacturer,
                                WagonModelId = v.WagonModelId,
                                Pressure = v.Pressure,
                                Capacity = v.Capacity
                            }).ToList()
                            : null,
                        RailwayCisternStatus = rc.RailwayCisternStatus.ToRailwayCisternStatusDTO(),
                           ReRegistrationNextDate = rc.ReRegistrationNextDate,
                        ExtensionServiceLifeDate = rc.ExtensionServiceLifeDate,
                        PeriodDetachRepair = rc.PeriodDetachRepair
                    })
                    .ToListAsync();
                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                Guid MajorRepairType  = Guid.Parse("423e276f-4caa-4e58-99a4-28339703f6bf");
                foreach (var cistern in cisterns)
                {

                    WagonModel Model = null;
                    var milage = milageCisterns.Where(m => m.CisternId == cistern.Id).OrderByDescending(m => m.InputDate).FirstOrDefault();
                    
                    var LastMilage = milage == null? null : new MilageCisternDTO
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
                    

                    cistern.LastMilage=LastMilage;
                    if (cistern.Model != null)
                        Model = models.FirstOrDefault(m => m.Id == cistern.Model.Id);
                    var pers = personalCisRepairPeriods.FirstOrDefault(p => p.CisternId == cistern.Id);

                    var periodictest = 8;
                    var IntermediateTest = 4;
                    var PPRRepair = 3;
                    var MajorRep = 10;
                    var DepoRep = 3;
                    if (Model != null)
                    {
                        periodictest = Model.PeriodicTest.HasValue ? Model.PeriodicTest.Value : 8;
                        IntermediateTest = Model.IntermediateTest.HasValue ? Model.IntermediateTest.Value : 4;
                        PPRRepair = Model.PPRRep.HasValue ? Model.PPRRep.Value : 3;
                        MajorRep = Model.MajorRep;
                        DepoRep = Model.DepoRep;
                    }
                    if (pers != null)
                    {
                        if (pers.PeriodicTest.HasValue)
                            periodictest = pers.PeriodicTest.Value;
                        if (pers.IntermediateTest.HasValue)
                            IntermediateTest = pers.IntermediateTest.Value;
                        if (pers.PPRRep.HasValue)
                            PPRRepair = pers.PPRRep.Value;
                        if (pers.MajorRep.HasValue)
                            MajorRep = pers.MajorRep.Value;
                        if (pers.DepoRep.HasValue)
                            DepoRep = pers.DepoRep.Value;
                    }

                    cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest);
                    cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, IntermediateTest);
                    cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, PPRRepair);
                    cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, MajorRep);
                    cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);

                     //???????????????????????????????????
                    if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
                    {
                        cistern.PlanPeriodDepotRepair = milage.RepairDate;
                        if (milage.RepairTypeId == MajorRepairType)
                        {
                            cistern.PlanPeriodMajorRepair = milage.RepairDate;
                        }
                    }

                    if(milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair||milage.RepairTypeId == MajorRepairType)
                    {
                        DateOnly? nextDepot=cistern.PlanPeriodDepotRepair, prevDepot = cistern.PlanPeriodDepotRepair;
                    while (nextDepot < cistern.PlanPeriodMajorRepair)
                    {
                        prevDepot = nextDepot;
                        nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);
                    }

                    int diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
                    if(diff <= 180)
                    {
                        cistern.PlanPeriodMajorRepair = prevDepot;
                    }
                    else
                    {
                        cistern.PlanPeriodMajorRepair = nextDepot;
                    }
                    }
                }

                return Results.Ok(cisterns);
            })
            .WithName("SearchDetailedRailwayCisterns")
            .Produces<List<RailwayCisternDetailDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        // Search list by number
        group.MapGet("/search", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] string prefix) =>
            {
                if (string.IsNullOrWhiteSpace(prefix))
                    return Results.BadRequest("Search number is required");

                var cisterns = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Affiliation)
                    .Where(rc => rc.Number.StartsWith(prefix))
                    .Select(rc => new RailwayCisternListDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        ManufacturerName = rc.Manufacturer.Name,
                        BuildDate = rc.BuildDate,
                        TypeName = rc.Type.Name,
                        ModelName = rc.Model.Name,
                        OwnerName = rc.Owner.Name,
                        RegistrationNumber = rc.RegistrationNumber,
                        RegistrationDate = rc.RegistrationDate,
                        AffiliationValue = rc.Affiliation.Value
                    })
                    .ToListAsync();

                return Results.Ok(cisterns);
            })
            .WithName("SearchRailwayCisterns")
            .Produces<List<RailwayCisternListDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        // Get by ID with detailed info
        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var cistern = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .Where(rc => rc.Id == id)
                    .Select(rc => new RailwayCisternDetailDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        Manufacturer = new ManufacturerDTO
                        {
                            Id = rc.Manufacturer.Id,
                            Name = rc.Manufacturer.Name,
                            Country = rc.Manufacturer.Country,
                            ShortName = rc.Manufacturer.ShortName,
                            Code = rc.Manufacturer.Code,
                            CreatedAt = rc.Manufacturer.CreatedAt,
                            UpdatedAt = rc.Manufacturer.UpdatedAt
                        },
                        BuildDate = rc.BuildDate,
                        TareWeight = rc.TareWeight,
                        LoadCapacity = rc.LoadCapacity,
                        Length = rc.Length,
                        AxleCount = rc.AxleCount,
                        Volume = rc.Volume,
                        FillingVolume = rc.FillingVolume,
                        InitialTareWeight = rc.InitialTareWeight,
                        Type = new WagonTypeDTO
                        {
                            Id = rc.Type.Id,
                            Name = rc.Type.Name,
                            Type = rc.Type.Type
                        },
                        Model = rc.Model != null
                            ? new WagonModelDTO
                            {
                                Id = rc.Model.Id,
                                Name = rc.Model.Name
                            }
                            : null,
                        CommissioningDate = rc.CommissioningDate,
                        SerialNumber = rc.SerialNumber,
                        RegistrationNumber = rc.RegistrationNumber,
                        RegistrationDate = rc.RegistrationDate,
                        Registrar = rc.Registrar != null
                            ? new RegistrarDTO
                            {
                                Id = rc.Registrar.Id,
                                Name = rc.Registrar.Name
                            }
                            : null,
                        Notes = rc.Notes,
                        Owner = rc.Owner != null
                            ? new OwnerDTO
                            {
                                Id = rc.Owner.Id,
                                Name = rc.Owner.Name,
                                UNP = rc.Owner.UNP,
                                ShortName = rc.Owner.ShortName,
                                Address = rc.Owner.Address,
                                TreatRepairs = rc.Owner.TreatRepairs,
                                CreatedAt = rc.Owner.CreatedAt,
                                UpdatedAt = rc.Owner.UpdatedAt
                            }
                            : null,
                        TechConditions = rc.TechConditions,
                        Pripiska = rc.Pripiska,
                        ReRegistrationDate = rc.ReRegistrationDate,
                        Pressure = rc.Pressure,
                        TestPressure = rc.TestPressure,
                        Rent = rc.Rent,
                        Affiliation = new AffiliationDTO
                        {
                            Id = rc.Affiliation.Id,
                            Value = rc.Affiliation.Value
                        },
                        ServiceLifeYears = rc.ServiceLifeYears,
                        PeriodMajorRepair = rc.PeriodMajorRepair,
                        PeriodPeriodicTest = rc.PeriodPeriodicTest,
                        PeriodIntermediateTest = rc.PeriodIntermediateTest,
                        PeriodDepotRepair = rc.PeriodDepotRepair,
                        PeriodPPRRepair = rc.PeriodPPRRepair,
                        PeriodPaintRepair = rc.PeriodPaintRepair,
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt,
                        Vessels = rc.Vessels != null
                            ? rc.Vessels.Select(v => new VesselListDTO
                            {
                                Id = v.Id,
                                SerialNumber = v.SerialNumber,
                                BuildDate = v.BuildDate,
                                Manufacturer = v.Manufacturer,
                                WagonModelId = v.WagonModelId,
                                Pressure = v.Pressure,
                                Capacity = v.Capacity
                            }).ToList()
                            : null,
                        RailwayCisternStatus = rc.RailwayCisternStatus.ToRailwayCisternStatusDTO(),
                           ReRegistrationNextDate = rc.ReRegistrationNextDate,
                        ExtensionServiceLifeDate = rc.ExtensionServiceLifeDate,
                        PeriodDetachRepair = rc.PeriodDetachRepair
                    })
                    .FirstOrDefaultAsync();
                if (cistern == null)
                {
                    return Results.NotFound();
                }

                WagonModel Model = null;
                var milage = context.MilageCisterns.Where(m => m.CisternId == cistern.Id).OrderByDescending(m => m.InputDate).FirstOrDefault();
                var LastMilage = milage == null? null : new MilageCisternDTO
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
                cistern.LastMilage=LastMilage;

                if (cistern.Model != null)
                    Model = context.WagonModels.FirstOrDefault(m => m.Id == cistern.Model.Id);
                var pers = context.PersonalCisRepairPeriods.FirstOrDefault(p => p.CisternId == cistern.Id);

                var periodictest = 8;
                var IntermediateTest = 4;
                var PPRRepair = 3;
                var MajorRep = 10;
                var DepoRep = 3;
                if (Model != null)
                {
                    periodictest = Model.PeriodicTest.HasValue ? Model.PeriodicTest.Value : 8;
                    IntermediateTest = Model.IntermediateTest.HasValue ? Model.IntermediateTest.Value : 4;
                    PPRRepair = Model.PPRRep.HasValue ? Model.PPRRep.Value : 3;
                    MajorRep = Model.MajorRep;
                    DepoRep = Model.DepoRep;
                }
                if (pers != null)
                {
                    if (pers.PeriodicTest.HasValue)
                        periodictest = pers.PeriodicTest.Value;
                    if (pers.IntermediateTest.HasValue)
                        IntermediateTest = pers.IntermediateTest.Value;
                    if (pers.PPRRep.HasValue)
                        PPRRepair = pers.PPRRep.Value;
                    if (pers.MajorRep.HasValue)
                        MajorRep = pers.MajorRep.Value;
                    if (pers.DepoRep.HasValue)
                        DepoRep = pers.DepoRep.Value;
                }

                cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest);
                cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, IntermediateTest);
                cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, PPRRepair);
                cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, MajorRep);
                cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);

                Guid MajorRepairType  = Guid.Parse("423e276f-4caa-4e58-99a4-28339703f6bf");

                 //???????????????????????????????????
                    if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
                    {
                        cistern.PlanPeriodDepotRepair = milage.RepairDate;
                        if (milage.RepairTypeId == MajorRepairType)
                        {
                            cistern.PlanPeriodMajorRepair = milage.RepairDate;
                        }
                    }

                    if(milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair||milage.RepairTypeId == MajorRepairType)
                    {
                        DateOnly? nextDepot=cistern.PlanPeriodDepotRepair, prevDepot = cistern.PlanPeriodDepotRepair;
                    while (nextDepot < cistern.PlanPeriodMajorRepair)
                    {
                        prevDepot = nextDepot;
                        nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);
                    }

                    int diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
                    if(diff <= 180)
                    {
                        cistern.PlanPeriodMajorRepair = prevDepot;
                    }
                    else
                    {
                        cistern.PlanPeriodMajorRepair = nextDepot;
                    }
                    }


                return Results.Ok(cistern);
            })
            .WithName("GetRailwayCisternById")
            .Produces<RailwayCisternDetailDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapPost("/",
                async ([FromServices] ApplicationDbContext context, [FromBody] CreateRailwayCisternDTO dto,
                    HttpContext httpContext) =>
                {
                    var cistern = new RailwayCistern
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
                        CreatorId = httpContext.User.FindFirstValue("userId"),
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
                        PeriodPPRRepair = dto.PeriodDepotRepair,
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

                    context.Add(cistern);
                    await context.SaveChangesAsync();

                    return Results.Created($"/api/railway-cisterns/{cistern.Id}", cistern.Id);
                })
            .WithName("CreateRailwayCistern")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}",
                async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id,
                    [FromBody] UpdateRailwayCisternDTO dto) =>
                {
                    var cistern = await context.Set<RailwayCistern>().FindAsync(id);
                    if (cistern == null)
                        return Results.NotFound();

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
                    cistern.UpdatedAt = DateTimeOffset.UtcNow;
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
                    cistern.PeriodPPRRepair = dto.PeriodDepotRepair;
                    cistern.PeriodPaintRepair = dto.PeriodPaintRepair;
                    cistern.DangerClass = dto.DangerClass;
                    cistern.Substance = dto.Substance;
                    cistern.TareWeight2 = dto.TareWeight2;
                    cistern.TareWeight3 = dto.TareWeight3;
                    cistern.CisternStatusId = dto.RailwayCisternStatusId;
                    cistern.ReRegistrationNextDate = dto.ReRegistrationNextDate;
                    cistern.ExtensionServiceLifeDate = dto.ExtensionServiceLifeDate;
                    cistern.PeriodDetachRepair = dto.PeriodDetachRepair;

                    await context.SaveChangesAsync();
                    return Results.NoContent();
                })
            .WithName("UpdateRailwayCistern")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var cistern = await context.Set<RailwayCistern>().FindAsync(id);
                if (cistern == null)
                    return Results.NotFound();

                context.Remove(cistern);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteRailwayCistern")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);

        // Search detailed list by number
        group.MapPost("/repairs-filter", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] FilterRepairsCisternsRequestDTO req) =>
            {
                

                var query = context.Set<RailwayCistern>()
                    .Include(rc => rc.Model)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.RailwayCisternStatus)
                    .Where(rc => rc.CisternStatusId == Guid.Parse("6c7f6085-7509-46fd-8ffb-36da4aafd7ee"))
                    .AsQueryable();

                if(req != null)
                {
                    if (req.Numbers != null)
                    {
                        query = query.Where(rc => req.Numbers.Contains(rc.Number));
                    }
                    if (req.WagonModelsNames != null)
                    {
                        query = query.Where(rc => rc.Model!= null&&req.WagonModelsNames.Contains(rc.Model.Name));
                    }
                    if (req.BuildDate != null)
                    {
                        if (req.BuildDate.From.HasValue)
                        {
                            query = query.Where(rc => rc.BuildDate >= req.BuildDate.From.Value);
                        }
                        if (req.BuildDate.To.HasValue)
                        {
                            query = query.Where(rc => rc.BuildDate <= req.BuildDate.To.Value);
                        }
                    }
                    if (req.CommissioningDate != null)
                    {
                        if (req.CommissioningDate.From.HasValue)
                        {
                            query = query.Where(rc => rc.CommissioningDate >= req.CommissioningDate.From.Value);
                        }
                        if (req.CommissioningDate.To.HasValue)
                        {
                            query = query.Where(rc => rc.CommissioningDate <= req.CommissioningDate.To.Value);
                        }
                    }

                    if (req.PeriodMajorRepair != null)
                    {
                        if (req.PeriodMajorRepair.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodMajorRepair >= req.PeriodMajorRepair.From.Value);
                        }
                        if (req.PeriodMajorRepair.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodMajorRepair <= req.PeriodMajorRepair.To.Value);
                        }
                    }

                    if (req.PeriodPeriodicTest != null)
                    {
                        if (req.PeriodPeriodicTest.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodPeriodicTest >= req.PeriodPeriodicTest.From.Value);
                        }
                        if (req.PeriodPeriodicTest.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodPeriodicTest <= req.PeriodPeriodicTest.To.Value);
                        }
                    }

                    if (req.PeriodIntermediateTest != null)
                    {
                        if (req.PeriodIntermediateTest.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodIntermediateTest >= req.PeriodIntermediateTest.From.Value);
                        }
                        if (req.PeriodIntermediateTest.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodIntermediateTest <= req.PeriodIntermediateTest.To.Value);
                        }
                    }

                    if (req.PeriodDepotRepair != null)
                    {
                        if (req.PeriodDepotRepair.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodDepotRepair >= req.PeriodDepotRepair.From.Value);
                        }
                        if (req.PeriodDepotRepair.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodDepotRepair <= req.PeriodDepotRepair.To.Value);
                        }
                    }

                    if (req.PeriodPPRRepair != null)
                    {
                        if (req.PeriodPPRRepair.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodPPRRepair >= req.PeriodPPRRepair.From.Value);
                        }
                        if (req.PeriodPPRRepair.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodPPRRepair <= req.PeriodPPRRepair.To.Value);
                        }
                    }

                    if(req.PeriodPaintRepair != null)
                    {
                        if (req.PeriodPaintRepair.From.HasValue)
                        {
                            query = query.Where(rc=>rc.PeriodPaintRepair >= req.PeriodPaintRepair.From.Value);
                        }
                        if (req.PeriodPaintRepair.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodPaintRepair <= req.PeriodPaintRepair.To.Value);
                        }
                    }

                    if (req.PeriodDetachRepair != null)
                    {
                        if (req.PeriodDetachRepair.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodDetachRepair >= req.PeriodDetachRepair.From.Value);
                        }
                        if (req.PeriodDetachRepair.To.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodDetachRepair <= req.PeriodDetachRepair.To.Value);
                        }
                    }
                }

                var cisterns = await query.Select(rc => new FilterRepairsCisternsResponseDTO
                    {
                        Id = rc.Id,
                        Number = rc.Number,
                        BuildDate = rc.BuildDate,
                        WagonModelId = rc.Model != null
                            ? rc.Model.Id
                            : null,
                        WagonModelName = rc.Model != null
                            ? rc.Model.Name
                            : null,
                        CommissioningDate = rc.CommissioningDate,
                        RegistrationNumber = rc.RegistrationNumber,
                        ServiceLifeYears = rc.ServiceLifeYears,
                        PeriodMajorRepair = rc.PeriodMajorRepair,
                        PeriodPeriodicTest = rc.PeriodPeriodicTest,
                        PeriodIntermediateTest = rc.PeriodIntermediateTest,
                        PeriodDepotRepair = rc.PeriodDepotRepair,
                        PeriodPPRRepair = rc.PeriodPPRRepair,
                        PeriodPaintRepair = rc.PeriodPaintRepair,
                        CommissioningEndDate = rc.BuildDate.AddYears(rc.ServiceLifeYears),
                        ExtensionServiceLifeDate = rc.ExtensionServiceLifeDate,
                        ReRegistrationDate = rc.ReRegistrationDate,
                        ReRegistrationNextDate = rc.ReRegistrationNextDate,
                        PeriodDetachRepair = rc.PeriodDetachRepair
                }).ToListAsync();

                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                Guid MajorRepairType  = Guid.Parse("423e276f-4caa-4e58-99a4-28339703f6bf");
                foreach (var cistern in cisterns)
                {

                    WagonModel? Model = null;
                    var milage = milageCisterns.Where(m => m.CisternId == cistern.Id).OrderByDescending(m => m.InputDate).FirstOrDefault();
                    if (milage != null)
                    {
                        cistern.Milage = milage.Milage;
                        cistern.MilageNorm = milage.MilageNorm;
                        cistern.MilageRemain = cistern.MilageNorm - cistern.Milage;
                    }
                    if (cistern.WagonModelId != null)
                        Model = models.FirstOrDefault(m => m.Id == cistern.WagonModelId.Value);
                    var pers = personalCisRepairPeriods.FirstOrDefault(p => p.CisternId == cistern.Id);

                    var periodictest = 8;
                    cistern.PlanPeriodPeriodicTestStatus = "По умолчанию 8";
                    var IntermediateTest = 4;
                    cistern.PlanPeriodIntermediateTestStatus = "По умолчанию 4";
                    var PPRRepair = 3;
                    cistern.PlanPeriodPPRRepairStatus = "По умолчанию 3";
                    var MajorRep = 10;
                    cistern.PlanPeriodMajorRepairStatus = "По умолчанию 10";
                    var DepoRep = 3;
                    cistern.PlanPeriodDepotRepairStatus = "По умолчанию 3";
                    if (Model != null)
                    {
                        if(Model.PeriodicTest.HasValue){
                            periodictest = Model.PeriodicTest.Value;
                            cistern.PlanPeriodPeriodicTestStatus = "Из модели вагона " + Model.PeriodicTest.Value.ToString();
                        }
                        if(Model.IntermediateTest.HasValue){
                            IntermediateTest = Model.IntermediateTest.Value;
                            cistern.PlanPeriodIntermediateTestStatus = "Из модели вагона " + Model.IntermediateTest.Value.ToString();
                        }
                        if(Model.PPRRep.HasValue ){
                            PPRRepair = Model.PPRRep.Value;
                            cistern.PlanPeriodPPRRepairStatus = "Из модели вагона " + Model.PPRRep.Value.ToString();
                        }
                        MajorRep = Model.MajorRep;
                        cistern.PlanPeriodMajorRepairStatus = "Из модели вагона " + Model.MajorRep.ToString();
                        DepoRep = Model.DepoRep;
                        cistern.PlanPeriodDepotRepairStatus = "Из модели вагона " + Model.DepoRep.ToString();
                    }
                    if (pers != null)
                    {
                        if (pers.PeriodicTest.HasValue)
                        {
                            periodictest = pers.PeriodicTest.Value;
                            cistern.PlanPeriodPeriodicTestStatus = "Из ремонтов для конкретного вагона " + pers.PeriodicTest.Value.ToString();
                        }
                        if (pers.IntermediateTest.HasValue)
                        {
                            IntermediateTest = pers.IntermediateTest.Value;
                            cistern.PlanPeriodIntermediateTestStatus = "Из ремонтов для конкретного вагона " + pers.IntermediateTest.Value.ToString();
                        }
                        if (pers.PPRRep.HasValue)
                        {
                            PPRRepair = pers.PPRRep.Value;
                            cistern.PlanPeriodPPRRepairStatus = "Из ремонтов для конкретного вагона " + pers.PPRRep.Value.ToString();
                        }
                        if (pers.MajorRep.HasValue)
                        {
                            MajorRep = pers.MajorRep.Value;
                            cistern.PlanPeriodMajorRepairStatus = "Из ремонтов для конкретного вагона " + pers.MajorRep.ToString();
                        }
                        if (pers.DepoRep.HasValue)
                        {
                            DepoRep = pers.DepoRep.Value;
                            cistern.PlanPeriodDepotRepairStatus = "Из ремонтов для конкретного вагона " + pers.DepoRep.ToString();
                        }
                    }

                    cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest);
                    cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, IntermediateTest);
                    cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, PPRRepair);
                    cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, MajorRep);
                    cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);

                     //???????????????????????????????????
                    if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
                    {
                        cistern.PlanPeriodDepotRepair = milage.RepairDate;
                        if (milage.RepairTypeId == MajorRepairType)
                        {
                            cistern.PlanPeriodMajorRepair = milage.RepairDate;
                        }
                    }

                    if(milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair||milage.RepairTypeId == MajorRepairType)
                    {
                        DateOnly? nextDepot=cistern.PlanPeriodDepotRepair, prevDepot = cistern.PlanPeriodDepotRepair;
                    while (nextDepot < cistern.PlanPeriodMajorRepair)
                    {
                        prevDepot = nextDepot;
                        nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep);
                    }

                    int diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
                    if(diff <= 180)
                    {
                        cistern.PlanPeriodMajorRepair = prevDepot;
                    }
                    else
                    {
                        cistern.PlanPeriodMajorRepair = nextDepot;
                    }
                    }
                }
                if (req != null)
                {
                    if (req.CommissioningEndDate != null)
                    {
                        if (req.CommissioningEndDate.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.CommissioningEndDate >= req.CommissioningEndDate.From.Value).ToList();
                        }
                        if (req.CommissioningEndDate.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.CommissioningEndDate <= req.CommissioningEndDate.To.Value).ToList();
                        }
                    }

                    if (req.PlanPeriodMajorRepair != null)
                    {
                        if (req.PlanPeriodMajorRepair.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodMajorRepair >= req.PlanPeriodMajorRepair.From.Value).ToList();
                        }
                        if (req.PlanPeriodMajorRepair.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodMajorRepair <= req.PlanPeriodMajorRepair.To.Value).ToList();
                        }
                    }

                    if (req.PlanPeriodPeriodicTest != null)
                    {
                        if (req.PlanPeriodPeriodicTest.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodPeriodicTest >= req.PlanPeriodPeriodicTest.From.Value).ToList();
                        }
                        if (req.PlanPeriodPeriodicTest.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodPeriodicTest <= req.PlanPeriodPeriodicTest.To.Value).ToList();
                        }
                    }

                    if (req.PlanPeriodIntermediateTest != null)
                    {
                        if (req.PlanPeriodIntermediateTest.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodIntermediateTest >= req.PlanPeriodIntermediateTest.From.Value).ToList();
                        }
                        if (req.PlanPeriodIntermediateTest.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodIntermediateTest <= req.PlanPeriodIntermediateTest.To.Value).ToList();
                        }
                    }

                    if (req.PlanPeriodDepotRepair != null)
                    {
                        if (req.PlanPeriodDepotRepair.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodDepotRepair >= req.PlanPeriodDepotRepair.From.Value).ToList();
                        }
                        if (req.PlanPeriodDepotRepair.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodDepotRepair <= req.PlanPeriodDepotRepair.To.Value).ToList();
                        }
                    }

                    if (req.PlanPeriodPPRRepair != null)
                    {
                        if (req.PlanPeriodPPRRepair.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodPPRRepair >= req.PlanPeriodPPRRepair.From.Value).ToList();
                        }
                        if (req.PlanPeriodPPRRepair.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PlanPeriodPPRRepair <= req.PlanPeriodPPRRepair.To.Value).ToList();
                        }
                    }

                    if (req.PeriodPaintRepair != null)
                    {
                        if (req.PeriodPaintRepair.From.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PeriodPaintRepair >= req.PeriodPaintRepair.From.Value).ToList();
                        }
                        if (req.PeriodPaintRepair.To.HasValue)
                        {
                            cisterns = cisterns.Where(rc => rc.PeriodPaintRepair <= req.PeriodPaintRepair.To.Value).ToList();
                        }
                    }
                }
                var cisternsList = cisterns.ToList();
                return Results.Ok(cisternsList);
            })
            .WithName("FilterRepairsCisterns")
            .Produces<List<FilterRepairsCisternsResponseDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

    }

    public static DateOnly PlanDate(DateOnly? repairDate, DateOnly? CommissioningDate, int serviceLifeYears, int years = 4)
    {
        DateOnly date = CommissioningDate.Value;
        if (repairDate.HasValue)
            date = repairDate.Value;
        date = date.AddYears(years);
        var serviceDate = CommissioningDate.Value.AddYears(serviceLifeYears);
        if (serviceDate <= date)
            date = serviceDate;
        return date;
    }
}
