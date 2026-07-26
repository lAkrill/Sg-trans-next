using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Exceptions;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class FitmentEndpoints
{
    public static void MapFitmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/Fitments")
            .RequireAuthorization()
            .WithTags("Fitments");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
            {
                if (take < 0)
                {
                    return Results.BadRequest();
                }
                var fitments = await context.Fitments
                    .AsNoTracking()
                    .Include(f => f.FitmentType)
                    .Include(f => f.Depot)
                    .Include(f => f.Model)
                    .Include(f => f.LocationDepo)
                    .Include(f => f.LocationCistern)
                    .AsSplitQuery()
                    .Skip(skip)
                    .Take(take)
                    .Select(f => f.ToFitmentDTO())
                    .ToListAsync();
                return Results.Ok(fitments);
            })
            .WithName("GetFitments")
            .Produces<List<FitmentDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var fitments = await context.Fitments
                    .AsNoTracking()
                    .Include(f => f.FitmentType)
                    .Include(f => f.Depot)
                    .Include(f => f.Model)
                    .Include(f => f.LocationDepo)
                    .Include(f => f.LocationCistern)
                    .AsSplitQuery()
                    .OrderBy(f => f.SerialNumber)
                    .Select(f => f.ToFitmentDTO())
                    .ToListAsync();
                return Results.Ok(fitments);
            })
            .WithName("GetAllFitments")
            .Produces<List<FitmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
            {
                var fitment = await context.Fitments
                    .AsNoTracking()
                    .Include(f => f.FitmentType)
                    .Include(f => f.Depot)
                    .Include(f => f.Model)
                    .Include(f => f.LocationDepo)
                    .Include(f => f.LocationCistern)
                    .AsSplitQuery()
                    .Where(f => f.Id == id)
                    .Select(f => f.ToFitmentDTO())
                    .FirstOrDefaultAsync();

                return fitment is null ? Results.NotFound() : Results.Ok(fitment);
            })
            .WithName("GetFitmentById")
            .Produces<FitmentDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapGet("/bySerialNumber/{serialNumber}", async ([FromServices] ApplicationDbContext context,
                [FromRoute] string serialNumber,
                [FromQuery] int skip = 0,
                [FromQuery] int take = 50) =>
            {
                if (take < 0)
                {
                    return Results.BadRequest();
                }
                var fitments = await context.Fitments
                    .AsNoTracking()
                    .Where(f => f.SerialNumber == serialNumber)
                    .Include(f => f.FitmentType)
                    .Include(f => f.Depot)
                    .Include(f => f.Model)
                    .Include(f => f.LocationDepo)
                    .Include(f => f.LocationCistern)
                    .AsSplitQuery()
                    .Skip(skip)
                    .Take(take)
                    .Select(f => f.ToFitmentDTO())
                    .ToListAsync();
                return Results.Ok(fitments);
            })
            .WithName("GetFitmentsBySerialNumber")
            .Produces<List<FitmentDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        group.MapGet("/byType/{fitmentTypeId}", async ([FromServices] ApplicationDbContext context,
                [FromRoute] Guid fitmentTypeId,
                [FromQuery] int skip = 0,
                [FromQuery] int take = 50) =>
            {
                if (take < 0)
                {
                    return Results.BadRequest();
                }
                var fitments = await context.Fitments
                    .AsNoTracking()
                    .Where(f => f.FitmentTypeId == fitmentTypeId)
                    .Include(f => f.FitmentType)
                    .Include(f => f.Depot)
                    .Include(f => f.Model)
                    .Include(f => f.LocationDepo)
                    .Include(f => f.LocationCistern)
                    .AsSplitQuery()
                    .Skip(skip)
                    .Take(take)
                    .Select(f => f.ToFitmentDTO())
                    .ToListAsync();
                return Results.Ok(fitments);
            })
            .WithName("GetFitmentsByType")
            .Produces<List<FitmentDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            HttpContext httpContext,
            [FromBody] CreateFitmentDTO dto) =>
            {
                var userIdString = httpContext.User.FindFirst("userId")?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                // Предпроверка: существует ли уже запись с такими FitmentTypeId, SerialNumber, BuildDate, ModelId
                var exists = await context.Fitments.AnyAsync(f =>
                    f.FitmentTypeId == dto.FitmentTypeId &&
                    f.SerialNumber == dto.SerialNumber &&
                    f.BuildDate == dto.BuildDate &&
                    f.ModelId == dto.ModelId);

                if (exists)
                {
                    throw new ApiException("Арматура с таким типом, серийным номером, датой сборки и моделью уже существует.", 409);
                }

                var fitment = dto.ToFitment(creatorId);
                context.Fitments.Add(fitment);

                // create history entry for create (creatorId parsed above)
                var fitmentType = await context.FitmentTypes.FindAsync(fitment.FitmentTypeId);
                var model = await context.FitmentModels.FindAsync(fitment.ModelId);
                var depot = await context.Depots.FindAsync(fitment.DepotId);
                var note = $"Создана арматура: Тип={fitmentType?.Name ?? fitment.FitmentTypeId.ToString()}, Модель={model?.Name ?? fitment.ModelId.ToString()}, Депо={depot?.Name ?? fitment.DepotId.ToString()}, Серийный номер={fitment.SerialNumber}";
                context.HistoryActionsFitments.Add(new WebApp.Data.Entities.RailwayCisterns.HistoryActionsFitment
                {
                    Id = Guid.NewGuid(),
                    FitmentId = fitment.Id,
                    Date = DateTime.Now,
                    CreatorId = creatorId,
                    Note = note
                });

                await context.SaveChangesAsync();

                // Reload with relations
                await context.Entry(fitment).Reference(f => f.FitmentType).LoadAsync();
                await context.Entry(fitment).Reference(f => f.Model).LoadAsync();
                await context.Entry(fitment).Reference(f => f.Depot).LoadAsync();

                return Results.Created($"/api/Fitments/{fitment.Id}", fitment.ToFitmentDTO());
            })
            .WithName("CreateFitment")
            .Produces<FitmentDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
            [FromServices] ApplicationDbContext context,
            [FromRoute] Guid id,
            [FromBody] UpdateFitmentDTO dto,
            HttpContext httpContext) =>
            {
                var fitment = await context.Fitments.FindAsync(id);
                if (fitment is null)
                    return Results.NotFound();

                // Предпроверка при обновлении: убедиться, что не создаём дубликат
                var exists = await context.Fitments.AnyAsync(f =>
                    f.FitmentTypeId == dto.FitmentTypeId &&
                    f.SerialNumber == dto.SerialNumber &&
                    f.BuildDate == dto.BuildDate &&
                    f.ModelId == dto.ModelId &&
                    f.Id != id);

                if (exists)
                {
                    throw new ApiException("Арматура с таким типом, серийным номером, датой сборки и моделью уже существует.", 409);
                }

                // build human-readable change note
                var userIdStringUpd = httpContext.User.FindFirst("userId")?.Value;
                if (Guid.TryParse(userIdStringUpd, out var creatorIdUpd))
                {
                    var oldFitmentType = await context.FitmentTypes.FindAsync(fitment.FitmentTypeId);
                    var oldModel = await context.FitmentModels.FindAsync(fitment.ModelId);
                    var oldDepot = await context.Depots.FindAsync(fitment.DepotId);

                    var newFitmentType = await context.FitmentTypes.FindAsync(dto.FitmentTypeId);
                    var newModel = await context.FitmentModels.FindAsync(dto.ModelId);
                    var newDepot = await context.Depots.FindAsync(dto.DepotId);

                    var changes = new List<string>();
                    void AddChange(string field, object? oldV, object? newV)
                    {
                        if (oldV == null && newV == null) return;
                        if (oldV != null && oldV.Equals(newV)) return;
                        changes.Add($"{field}: {oldV} -> {newV}");
                    }

                    AddChange("Type", oldFitmentType?.Name ?? fitment.FitmentTypeId.ToString(), newFitmentType?.Name ?? dto.FitmentTypeId.ToString());
                    AddChange("Model", oldModel?.Name ?? fitment.ModelId.ToString(), newModel?.Name ?? dto.ModelId.ToString());
                    AddChange("Depot", oldDepot?.Name ?? fitment.DepotId.ToString(), newDepot?.Name ?? dto.DepotId.ToString());
                    AddChange("SerialNumber", fitment.SerialNumber, dto.SerialNumber);
                    AddChange("BuildDate", fitment.BuildDate, dto.BuildDate);
                    AddChange("LastRepairDate", fitment.LastRepairDate, dto.LastRepairDate);

                    // apply changes
                    fitment.UpdateFitment(dto);

                    var note = changes.Count == 0 ? string.Empty : string.Join("; ", changes);
                    if (!string.IsNullOrEmpty(note))
                    {
                        context.HistoryActionsFitments.Add(new WebApp.Data.Entities.RailwayCisterns.HistoryActionsFitment
                        {
                            Id = Guid.NewGuid(),
                            FitmentId = fitment.Id,
                            Date = DateTime.Now,
                            CreatorId = creatorIdUpd,
                            Note = note
                        });
                    }
                }

                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateFitment")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, HttpContext httpContext) =>
            {
                var fitment = await context.Fitments.FindAsync(id);
                if (fitment is null)
                    return Results.NotFound();

                var userIdStringDel = httpContext.User.FindFirst("userId")?.Value;
                if (Guid.TryParse(userIdStringDel, out var creatorIdDel))
                {
                    var model = await context.FitmentModels.FindAsync(fitment.ModelId);
                    var type = await context.FitmentTypes.FindAsync(fitment.FitmentTypeId);
                    var note = $"Удалена арматура: Серийный номер={fitment.SerialNumber}, Тип={type?.Name ?? fitment.FitmentTypeId.ToString()}, Модель={model?.Name ?? fitment.ModelId.ToString()}";
                    context.HistoryActionsFitments.Add(new WebApp.Data.Entities.RailwayCisterns.HistoryActionsFitment
                    {
                        Id = Guid.NewGuid(),
                        FitmentId = fitment.Id,
                        Date = DateTime.Now,
                        CreatorId = creatorIdDel,
                        Note = note
                    });
                }

                context.Remove(fitment);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteFitment")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
