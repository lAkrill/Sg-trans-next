using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
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
                var cisternEntities = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Affiliation)
                    .ToListAsync();

                var cisterns = cisternEntities
                    .Select(rc => rc.ToRailwayCisternListDTO())
                    .ToList();

                return Results.Ok(cisterns);
            })
            .WithName("GetRailwayCisterns")
            .Produces<List<RailwayCisternListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get detailed list
        group.MapGet("/detailed", async ([FromServices] ApplicationDbContext context) =>
            {
                var cisternEntities = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                        .ThenInclude(m => m!.Creator)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.Vessels)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .ToListAsync();

                var cisterns = cisternEntities
                    .Select(rc => rc.ToRailwayCisternDetailDTO())
                    .ToList();

                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                foreach (var cistern in cisterns)
                {
                    ApplyComputedRepairFields(cistern, models, personalCisRepairPeriods, milageCisterns);
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
                        .ThenInclude(m => m!.Creator)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.Vessels)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .AsQueryable();

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var cisternEntities = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var cisterns = cisternEntities
                    .Select(rc => rc.ToRailwayCisternDetailDTO())
                    .ToList();

                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                foreach (var cistern in cisterns)
                {
                    ApplyComputedRepairFields(cistern, models, personalCisRepairPeriods, milageCisterns);
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

                var cisternEntities = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                        .ThenInclude(m => m!.Creator)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.MilageCisterns)
                    .Include(rc => rc.Vessels)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .Where(rc => rc.Number.StartsWith(prefix))
                    .ToListAsync();

                var cisterns = cisternEntities
                    .Select(rc => rc.ToRailwayCisternDetailDTO())
                    .ToList();

                var models = await context.WagonModels.ToListAsync();
                var personalCisRepairPeriods = await context.PersonalCisRepairPeriods.ToListAsync();
                var milageCisterns = await context.MilageCisterns.ToListAsync();
                foreach (var cistern in cisterns)
                {
                    ApplyComputedRepairFields(cistern, models, personalCisRepairPeriods, milageCisterns);
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

                var cisternEntities = await context.Set<RailwayCistern>()
                    .Include(rc => rc.Manufacturer)
                    .Include(rc => rc.Type)
                    .Include(rc => rc.Model)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Affiliation)
                    .Where(rc => rc.Number.StartsWith(prefix))
                    .ToListAsync();

                var cisterns = cisternEntities
                    .Select(rc => rc.ToRailwayCisternListDTO())
                    .ToList();

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
                        .ThenInclude(m => m.Creator)
                    .Include(rc => rc.Owner)
                    .Include(rc => rc.Registrar)
                    .Include(rc => rc.Affiliation)
                    .Include(rc => rc.Vessels)
                    .Include(rc => rc.RailwayCisternStatus)
                        .ThenInclude(st => st.Creator)
                    .Where(rc => rc.Id == id)
                    .FirstOrDefaultAsync();
                if (cistern == null)
                {
                    return Results.NotFound();
                }

                var dto = cistern.ToRailwayCisternDetailDTO();
                var model = cistern.Model != null ? await context.WagonModels.FirstOrDefaultAsync(m => m.Id == cistern.Model.Id) : null;
                var pers = await context.PersonalCisRepairPeriods.FirstOrDefaultAsync(p => p.CisternId == cistern.Id);
                var milage = await context.MilageCisterns.Where(m => m.CisternId == cistern.Id).OrderByDescending(m => m.InputDate).FirstOrDefaultAsync();

                ApplyComputedRepairFields(dto, model, pers, milage);

                return Results.Ok(dto);
            })
            .WithName("GetRailwayCisternById")
            .Produces<RailwayCisternDetailDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapPost("/",
                async ([FromServices] ApplicationDbContext context, [FromBody] CreateRailwayCisternDTO dto,
                    HttpContext httpContext) =>
                {
                    var userIdString = httpContext.User.FindFirstValue("userId");
                    if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                        return Results.BadRequest();

                    var cistern = dto.ToRailwayCistern(httpContext.User.FindFirstValue("userId") ?? string.Empty);

                    context.Add(cistern);
                    context.HistoryActionsRailways.Add(new HistoryActionsRailway
                    {
                        Id = Guid.NewGuid(),
                        CisternId = cistern.Id,
                        Date = DateTime.Now,
                        CreatorId = creatorId,
                        Note = $"Создан вагон №{cistern.Number}."
                    });

                    await context.SaveChangesAsync();

                    return Results.Created($"/api/railway-cisterns/{cistern.Id}", cistern.Id);
                })
            .WithName("CreateRailwayCistern")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}",
                async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id,
                    [FromBody] UpdateRailwayCisternDTO dto,
                    HttpContext httpContext) =>
                {
                    var cistern = await context.Set<RailwayCistern>().FindAsync(id);
                    if (cistern == null)
                        return Results.NotFound();

                    var userIdString = httpContext.User.FindFirstValue("userId");
                    if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                        return Results.BadRequest();

                    var note = await BuildHistoryNoteForRailwayCisternUpdateAsync(context, cistern, dto);

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

                    if (!string.IsNullOrEmpty(note))
                    {
                        context.HistoryActionsRailways.Add(new HistoryActionsRailway
                        {
                            Id = Guid.NewGuid(),
                            CisternId = cistern.Id,
                            Date = DateTime.Now,
                            CreatorId = creatorId,
                            Note = note
                        });
                    }

                    await context.SaveChangesAsync();
                    return Results.NoContent();
                })
            .WithName("UpdateRailwayCistern")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id,
                HttpContext httpContext) =>
            {
                var cistern = await context.Set<RailwayCistern>().FindAsync(id);
                if (cistern == null)
                    return Results.NotFound();

                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                    return Results.BadRequest();

                context.HistoryActionsRailways.Add(new HistoryActionsRailway
                {
                    Id = Guid.NewGuid(),
                    CisternId = cistern.Id,
                    Date = DateTime.Now,
                    CreatorId = creatorId,
                    Note = $"Удален вагон №{cistern.Number}, регистрационный номер {cistern.RegistrationNumber}."
                });

                context.Remove(cistern);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteRailwayCistern")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);

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
                var isAnd = req?.IsAnd ?? true;

                if (req != null && isAnd)
                {
                    if (req.Numbers != null)
                    {
                        query = query.Where(rc => req.Numbers.Contains(rc.Number));
                    }
                    if (req.WagonModelsNames != null)
                    {
                        query = query.Where(rc => rc.Model != null && req.WagonModelsNames.Contains(rc.Model.Name));
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

                    if (req.PeriodPaintRepair != null)
                    {
                        if (req.PeriodPaintRepair.From.HasValue)
                        {
                            query = query.Where(rc => rc.PeriodPaintRepair >= req.PeriodPaintRepair.From.Value);
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

                    if (req.ExtensionServiceLifeDate != null)
                    {
                        if (req.ExtensionServiceLifeDate.From.HasValue)
                        {
                            query = query.Where(rc => rc.ExtensionServiceLifeDate >= req.ExtensionServiceLifeDate.From.Value);
                        }
                        if (req.ExtensionServiceLifeDate.To.HasValue)
                        {
                            query = query.Where(rc => rc.ExtensionServiceLifeDate <= req.ExtensionServiceLifeDate.To.Value);
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

                    cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest, cistern.ExtensionServiceLifeDate);
                    cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, IntermediateTest, cistern.ExtensionServiceLifeDate);
                    cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, PPRRepair, cistern.ExtensionServiceLifeDate);
                    cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, MajorRep, cistern.ExtensionServiceLifeDate);
                    if (cistern.PeriodDepotRepair < cistern.PeriodMajorRepair)
                    {
                        cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep, cistern.ExtensionServiceLifeDate);
                        cistern.PlanPeriodDepotRepairStatus += "  (от капитального)";
                    }
                    else
                    {
                        cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep, cistern.ExtensionServiceLifeDate);
                    }

                    //???????????????????????????????????
                    if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
                    {
                        cistern.PlanPeriodDepotRepair = milage.RepairDate;
                        if (milage.RepairTypeId == MajorRepairType)
                        {
                            cistern.PlanPeriodMajorRepair = milage.RepairDate;
                        }
                    }

                    if (milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair || milage.RepairTypeId == MajorRepairType)
                    {
                        DateOnly? nextDepot = cistern.PlanPeriodDepotRepair, prevDepot = cistern.PlanPeriodDepotRepair;
                        while (nextDepot < cistern.PlanPeriodMajorRepair)
                        {
                            prevDepot = nextDepot;
                            nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, DepoRep, cistern.ExtensionServiceLifeDate);
                        }

                        int diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
                        if (diff <= 180)
                        {
                            cistern.PlanPeriodMajorRepair = prevDepot;
                        }
                        else
                        {
                            cistern.PlanPeriodMajorRepair = nextDepot;
                        }
                    }
                    if (cistern.PlanPeriodIntermediateTest > cistern.PlanPeriodPeriodicTest)
                    {
                        cistern.PlanPeriodIntermediateTest = cistern.PlanPeriodPeriodicTest.Value.AddYears(4);
                    }
                }
                if (req != null)
                {
                    if (!isAnd)
                    {
                        cisterns = cisterns.Where(rc =>
                        {
                            bool match = false;
                            if (!match && req.Numbers != null && req.Numbers.Contains(rc.Number)) match = true;
                            if (!match && req.WagonModelsNames != null && rc.WagonModelName != null && req.WagonModelsNames.Contains(rc.WagonModelName)) match = true;
                            if (!match && req.BuildDate != null)
                            {
                                match = MatchesDateRange(rc.BuildDate, req.BuildDate);
                            }
                            if (!match && req.CommissioningDate != null)
                            {
                                match = MatchesDateRange(rc.CommissioningDate, req.CommissioningDate);
                            }

                            if (!match && req.PeriodMajorRepair != null)
                            {
                                match = MatchesDateRange(rc.PeriodMajorRepair, req.PeriodMajorRepair);
                            }
                            if (!match && req.PeriodPeriodicTest != null)
                            {
                                match = MatchesDateRange(rc.PeriodPeriodicTest, req.PeriodPeriodicTest);
                            }
                            if (!match && req.PeriodIntermediateTest != null)
                            {
                                match = MatchesDateRange(rc.PeriodIntermediateTest, req.PeriodIntermediateTest);
                            }
                            if (!match && req.PeriodDepotRepair != null)
                            {
                                match = MatchesDateRange(rc.PeriodDepotRepair, req.PeriodDepotRepair);
                            }
                            if (!match && req.PeriodPPRRepair != null)
                            {
                                match = MatchesDateRange(rc.PeriodPPRRepair, req.PeriodPPRRepair);
                            }
                            if (!match && req.PeriodPaintRepair != null)
                            {
                                match = MatchesDateTimeRange(rc.PeriodPaintRepair, req.PeriodPaintRepair);
                            }
                            if (!match && req.PeriodDetachRepair != null)
                            {
                                match = MatchesDateRange(rc.PeriodDetachRepair, req.PeriodDetachRepair);
                            }
                            if (!match && req.ExtensionServiceLifeDate != null)
                            {
                                match = MatchesDateRange(rc.ExtensionServiceLifeDate, req.ExtensionServiceLifeDate);
                            }

                            if (!match && req.CommissioningEndDate != null)
                            {
                                match = MatchesDateRange(rc.CommissioningEndDate, req.CommissioningEndDate);
                            }

                            if (!match && req.PlanPeriodMajorRepair != null)
                            {
                                match = MatchesDateRange(rc.PlanPeriodMajorRepair, req.PlanPeriodMajorRepair);
                            }
                            if (!match && req.PlanPeriodPeriodicTest != null)
                            {
                                match = MatchesDateRange(rc.PlanPeriodPeriodicTest, req.PlanPeriodPeriodicTest);
                            }
                            if (!match && req.PlanPeriodIntermediateTest != null)
                            {
                                match = MatchesDateRange(rc.PlanPeriodIntermediateTest, req.PlanPeriodIntermediateTest);
                            }
                            if (!match && req.PlanPeriodDepotRepair != null)
                            {
                                match = MatchesDateRange(rc.PlanPeriodDepotRepair, req.PlanPeriodDepotRepair);
                            }
                            if (!match && req.PlanPeriodPPRRepair != null)
                            {
                                match = MatchesDateRange(rc.PlanPeriodPPRRepair, req.PlanPeriodPPRRepair);
                            }

                            return match;
                        }).ToList();
                    }
                    else
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

                        if (req.ExtensionServiceLifeDate != null)
                        {
                            if (req.ExtensionServiceLifeDate.From.HasValue)
                            {
                                cisterns = cisterns.Where(rc => rc.ExtensionServiceLifeDate >= req.ExtensionServiceLifeDate.From.Value).ToList();
                            }
                            if (req.ExtensionServiceLifeDate.To.HasValue)
                            {
                                cisterns = cisterns.Where(rc => rc.ExtensionServiceLifeDate <= req.ExtensionServiceLifeDate.To.Value).ToList();
                            }
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

    private static readonly Guid MajorRepairType = new Guid("423e276f-4caa-4e58-99a4-28339703f6bf");

    private static void ApplyComputedRepairFields(
        RailwayCisternDetailDTO cistern,
        List<WagonModel> models,
        List<PersonalCisRepairPeriod> personalCisRepairPeriods,
        List<MilageCistern> milageCisterns)
    {
        var model = cistern.Model != null ? models.FirstOrDefault(m => m.Id == cistern.Model.Id) : null;
        var pers = personalCisRepairPeriods.FirstOrDefault(p => p.CisternId == cistern.Id);
        var milage = milageCisterns
            .Where(m => m.CisternId == cistern.Id)
            .OrderByDescending(m => m.InputDate)
            .FirstOrDefault();

        ApplyComputedRepairFields(cistern, model, pers, milage);
    }

    private static void ApplyComputedRepairFields(
        RailwayCisternDetailDTO cistern,
        WagonModel? model,
        PersonalCisRepairPeriod? pers,
        MilageCistern? milage)
    {
        cistern.LastMilage = milage?.ToMilageCisternDTO();

        var periodictest = 8;
        var intermediateTest = 4;
        var pprRepair = 3;
        var majorRep = 10;
        var depoRep = 3;

        if (model != null)
        {
            periodictest = model.PeriodicTest ?? 8;
            intermediateTest = model.IntermediateTest ?? 4;
            pprRepair = model.PPRRep ?? 3;
            majorRep = model.MajorRep;
            depoRep = model.DepoRep;
        }

        if (pers != null)
        {
            if (pers.PeriodicTest.HasValue)
                periodictest = pers.PeriodicTest.Value;
            if (pers.IntermediateTest.HasValue)
                intermediateTest = pers.IntermediateTest.Value;
            if (pers.PPRRep.HasValue)
                pprRepair = pers.PPRRep.Value;
            if (pers.MajorRep.HasValue)
                majorRep = pers.MajorRep.Value;
            if (pers.DepoRep.HasValue)
                depoRep = pers.DepoRep.Value;
        }

        cistern.PlanPeriodPeriodicTest = PlanDate(cistern.PeriodPeriodicTest, cistern.BuildDate, cistern.ServiceLifeYears, periodictest, cistern.ExtensionServiceLifeDate);
        cistern.PlanPeriodIntermediateTest = PlanDate(cistern.PeriodIntermediateTest, cistern.BuildDate, cistern.ServiceLifeYears, intermediateTest, cistern.ExtensionServiceLifeDate);
        cistern.PlanPeriodPPRRepair = PlanDate(cistern.PeriodPPRRepair, cistern.BuildDate, cistern.ServiceLifeYears, pprRepair, cistern.ExtensionServiceLifeDate);
        cistern.PlanPeriodMajorRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, majorRep, cistern.ExtensionServiceLifeDate);
        if (cistern.PeriodDepotRepair < cistern.PeriodMajorRepair)
        {
            cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodMajorRepair, cistern.BuildDate, cistern.ServiceLifeYears, depoRep, cistern.ExtensionServiceLifeDate);
        }
        else
        {
            cistern.PlanPeriodDepotRepair = PlanDate(cistern.PeriodDepotRepair, cistern.BuildDate, cistern.ServiceLifeYears, depoRep, cistern.ExtensionServiceLifeDate);
        }


        if (milage != null && milage.RepairDate < cistern.PlanPeriodDepotRepair)
        {
            cistern.PlanPeriodDepotRepair = milage.RepairDate;
            if (milage.RepairTypeId == MajorRepairType)
            {
                cistern.PlanPeriodMajorRepair = milage.RepairDate;
            }
        }

        if (cistern.PlanPeriodMajorRepair.HasValue &&
            (milage == null || milage.RepairDate < cistern.PlanPeriodDepotRepair || milage.RepairTypeId == MajorRepairType))
        {
            var nextDepot = cistern.PlanPeriodDepotRepair;
            var prevDepot = cistern.PlanPeriodDepotRepair;
            while (nextDepot < cistern.PlanPeriodMajorRepair)
            {
                prevDepot = nextDepot;
                nextDepot = PlanDate(nextDepot, cistern.BuildDate, cistern.ServiceLifeYears, depoRep);
            }

            var diff = cistern.PlanPeriodMajorRepair.Value.DayNumber - prevDepot.Value.DayNumber;
            cistern.PlanPeriodMajorRepair = diff <= 180 ? prevDepot : nextDepot;
        }

        if(cistern.PlanPeriodIntermediateTest > cistern.PlanPeriodPeriodicTest)
        {
            cistern.PlanPeriodIntermediateTest = cistern.PlanPeriodPeriodicTest.Value.AddYears(4);
        }
    }

    public static DateOnly PlanDate(DateOnly? repairDate, DateOnly CommissioningDate, int serviceLifeYears, int years = 4, DateOnly? extensionServiceLifeDate = null)
    {
        DateOnly date = CommissioningDate;
        if (repairDate.HasValue)
            date = repairDate.Value;
        date = date.AddYears(years);

        var serviceDate = CommissioningDate.AddYears(serviceLifeYears);

        if (extensionServiceLifeDate.HasValue)
        {
           serviceDate =  extensionServiceLifeDate.Value;
        }

        if (serviceDate <= date)
            date = serviceDate;
            
        return date;
    }

    private static bool MatchesDateRange(DateOnly? value, DateRange? range)
    {
        if (range == null)
            return true;

        if (!range.From.HasValue && !range.To.HasValue)
            return true;

        if (range.From.HasValue && value < range.From.Value)
            return false;

        if (range.To.HasValue && value > range.To.Value)
            return false;

        return true;
    }

    private static bool MatchesDateTimeRange(DateTime? value, DateTimeWithoutOffsetRange? range)
    {
        if (range == null)
            return true;

        if (!range.From.HasValue && !range.To.HasValue)
            return true;

        if (range.From.HasValue && value < range.From.Value)
            return false;

        if (range.To.HasValue && value > range.To.Value)
            return false;

        return true;
    }

    private static async Task<string> BuildHistoryNoteForRailwayCisternUpdateAsync(
        ApplicationDbContext context,
        RailwayCistern existing,
        UpdateRailwayCisternDTO dto)
    {
        var changes = new List<string>();

        var oldManufacturer = await context.Manufacturers.FindAsync(existing.ManufacturerId);
        var newManufacturer = await context.Manufacturers.FindAsync(dto.ManufacturerId);
        var oldType = await context.WagonTypes.FindAsync(existing.TypeId);
        var newType = await context.WagonTypes.FindAsync(dto.TypeId);
        var oldModel = existing.ModelId.HasValue ? await context.WagonModels.FindAsync(existing.ModelId.Value) : null;
        var newModel = dto.ModelId.HasValue ? await context.WagonModels.FindAsync(dto.ModelId.Value) : null;
        var oldRegistrar = existing.RegistrarId.HasValue ? await context.Registrars.FindAsync(existing.RegistrarId.Value) : null;
        var newRegistrar = dto.RegistrarId.HasValue ? await context.Registrars.FindAsync(dto.RegistrarId.Value) : null;
        var oldOwner = existing.OwnerId.HasValue ? await context.Owners.FindAsync(existing.OwnerId.Value) : null;
        var newOwner = dto.OwnerId.HasValue ? await context.Owners.FindAsync(dto.OwnerId.Value) : null;
        var oldAffiliation = await context.Affiliations.FindAsync(existing.AffiliationId);
        var newAffiliation = await context.Affiliations.FindAsync(dto.AffiliationId);
        var oldStatus = await context.RailwayCisternStatuses.FindAsync(existing.CisternStatusId);
        var newStatus = await context.RailwayCisternStatuses.FindAsync(dto.RailwayCisternStatusId);

        static string FormatValue(object? value)
        {
            return value switch
            {
                null => "null",
                DateOnly d => d.ToString("yyyy-MM-dd"),
                DateTime dt => dt.ToString("yyyy-MM-dd HH:mm:ss"),
                DateTimeOffset dto => dto.ToString("yyyy-MM-dd HH:mm:ss"),
                bool b => b.ToString(),
                _ => value.ToString() ?? string.Empty,
            };
        }

        static string ResolveDisplayValue<T>(Guid? id, T? entity, Func<T, string> selector) where T : class
        {
            if (!id.HasValue)
                return "null";

            return entity is null ? id.Value.ToString() : selector(entity);
        }

        void AddChange(string field, object? oldValue, object? newValue)
        {
            if (oldValue == null && newValue == null)
                return;
            if (oldValue != null && oldValue.Equals(newValue))
                return;

            changes.Add($"{field}: {FormatValue(oldValue)} -> {FormatValue(newValue)}");
        }

        AddChange("Номер", existing.Number, dto.Number);
        AddChange("Производитель", ResolveDisplayValue(existing.ManufacturerId, oldManufacturer, m => m.Name), ResolveDisplayValue(dto.ManufacturerId, newManufacturer, m => m.Name));
        AddChange("Дата постройки", existing.BuildDate, dto.BuildDate);
        AddChange("Тара", existing.TareWeight, dto.TareWeight);
        AddChange("Грузоподъемность", existing.LoadCapacity, dto.LoadCapacity);
        AddChange("Длина", existing.Length, dto.Length);
        AddChange("Число осей", existing.AxleCount, dto.AxleCount);
        AddChange("Объем", existing.Volume, dto.Volume);
        AddChange("Объем заполнения", existing.FillingVolume, dto.FillingVolume);
        AddChange("Начальная тара", existing.InitialTareWeight, dto.InitialTareWeight);
        AddChange("Тип", ResolveDisplayValue(existing.TypeId, oldType, t => t.Name), ResolveDisplayValue(dto.TypeId, newType, t => t.Name));
        AddChange("Модель", ResolveDisplayValue(existing.ModelId, oldModel, m => m.Name), ResolveDisplayValue(dto.ModelId, newModel, m => m.Name));
        AddChange("Дата ввода в эксплуатацию", existing.CommissioningDate, dto.CommissioningDate);
        AddChange("Серийный номер", existing.SerialNumber, dto.SerialNumber);
        AddChange("Рег. номер", existing.RegistrationNumber, dto.RegistrationNumber);
        AddChange("Дата регистрации", existing.RegistrationDate, dto.RegistrationDate);
        AddChange("Регистратор", ResolveDisplayValue(existing.RegistrarId, oldRegistrar, r => r.Name), ResolveDisplayValue(dto.RegistrarId, newRegistrar, r => r.Name));
        AddChange("Примечания", existing.Notes, dto.Notes);
        AddChange("Владелец", ResolveDisplayValue(existing.OwnerId, oldOwner, o => o.Name), ResolveDisplayValue(dto.OwnerId, newOwner, o => o.Name));
        AddChange("Техусловия", existing.TechConditions, dto.TechConditions);
        AddChange("Приписка", existing.Pripiska, dto.Pripiska);
        AddChange("Дата перерегистрации", existing.ReRegistrationDate, dto.ReRegistrationDate);
        AddChange("Давление", existing.Pressure, dto.Pressure);
        AddChange("Испытательное давление", existing.TestPressure, dto.TestPressure);
        AddChange("Аренда", existing.Rent, dto.Rent);
        AddChange("Принадлежность", ResolveDisplayValue(existing.AffiliationId, oldAffiliation, a => a.Value), ResolveDisplayValue(dto.AffiliationId, newAffiliation, a => a.Value));
        AddChange("Срок службы", existing.ServiceLifeYears, dto.ServiceLifeYears);
        AddChange("Капитальный ремонт", existing.PeriodMajorRepair, dto.PeriodMajorRepair);
        AddChange("Периодический осмотр", existing.PeriodPeriodicTest, dto.PeriodPeriodicTest);
        AddChange("Промежуточный осмотр", existing.PeriodIntermediateTest, dto.PeriodIntermediateTest);
        AddChange("Деповский ремонт", existing.PeriodDepotRepair, dto.PeriodDepotRepair);
        AddChange("ППР", existing.PeriodPPRRepair, dto.PeriodPPRRepair);
        AddChange("Покрасочный ремонт", existing.PeriodPaintRepair, dto.PeriodPaintRepair);
        AddChange("Класс опасности", existing.DangerClass, dto.DangerClass);
        AddChange("Вещество", existing.Substance, dto.Substance);
        AddChange("Тара 2", existing.TareWeight2, dto.TareWeight2);
        AddChange("Тара 3", existing.TareWeight3, dto.TareWeight3);
        AddChange("Статус цистерны", ResolveDisplayValue(existing.CisternStatusId, oldStatus, s => s.Name), ResolveDisplayValue(dto.RailwayCisternStatusId, newStatus, s => s.Name));
        AddChange("Дата следующей перерегистрации", existing.ReRegistrationNextDate, dto.ReRegistrationNextDate);
        AddChange("Дата продления срока службы", existing.ExtensionServiceLifeDate, dto.ExtensionServiceLifeDate);
        AddChange("Дата отцепки ремонта", existing.PeriodDetachRepair, dto.PeriodDetachRepair);

        return changes.Count == 0 ? string.Empty : string.Join("; ", changes);
    }
}
