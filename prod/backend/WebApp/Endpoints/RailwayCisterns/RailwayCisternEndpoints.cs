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
                            : null
                    })
                    .ToListAsync();
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
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt
                    })
                    .ToListAsync();

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
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt
                    })
                    .ToListAsync();

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
                        DangerClass = rc.DangerClass,
                        Substance = rc.Substance,
                        TareWeight2 = rc.TareWeight2,
                        TareWeight3 = rc.TareWeight3,
                        CreatedAt = rc.CreatedAt,
                        UpdatedAt = rc.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                return cistern is null ? Results.NotFound() : Results.Ok(cistern);
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
                        DangerClass = dto.DangerClass,
                        Substance = dto.Substance,
                        TareWeight2 = dto.TareWeight2,
                        TareWeight3 = dto.TareWeight3
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
                    cistern.DangerClass = dto.DangerClass;
                    cistern.Substance = dto.Substance;
                    cistern.TareWeight2 = dto.TareWeight2;
                    cistern.TareWeight3 = dto.TareWeight3;

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

        
    }
}
