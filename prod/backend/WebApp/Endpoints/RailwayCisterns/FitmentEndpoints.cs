using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
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
                    .Include(f => f.Model)
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
                    .Include(f => f.Model)
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
                    .Include(f => f.Model)
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
                    .Include(f => f.Model)
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
                    .Include(f => f.Model)
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
                var creatorId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
                var fitment = dto.ToFitment(creatorId);
                context.Fitments.Add(fitment);
                await context.SaveChangesAsync();

                // Reload with relations
                await context.Entry(fitment).Reference(f => f.FitmentType).LoadAsync();
                await context.Entry(fitment).Reference(f => f.Model).LoadAsync();

                return Results.Created($"/api/Fitments/{fitment.Id}", fitment.ToFitmentDTO());
            })
            .WithName("CreateFitment")
            .Produces<FitmentDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateFitmentDTO dto) =>
            {
                var fitment = await context.Fitments.FindAsync(id);
                if (fitment is null)
                    return Results.NotFound();

                fitment.UpdateFitment(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateFitment")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var fitment = await context.Fitments.FindAsync(id);
                if (fitment is null)
                    return Results.NotFound();
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
