using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsInEndpoints
{
    public static void MapRepairsInEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/RepairsIn")
            .RequireAuthorization()
            .WithTags("RepairsIn");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
            {
                var repairsIn = await context.RepairsIns
                    .AsNoTracking()
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Type)
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Manufacturer)
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Model)
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Owner)
                    .Include(r => r.Cistern)
                        .ThenInclude(r => r.Affiliation)
                    .Include(r => r.RepairType)
                    .Include(r => r.Depot)
                    .Include(r => r.Station)
                    .AsSplitQuery()
                    .Skip(skip)
                    .Take(Math.Min(take, 100))
                    .Select(r => r.ToRepairsInDTO())
                    .ToListAsync();
                return Results.Ok(repairsIn);
            })
            .WithName("GetRepairsIn")
            .Produces<List<RepairsInDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context,
                Guid id) =>
            {
                var repairsIn = await context.RepairsIns
                    .AsNoTracking()
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Type)
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Manufacturer)
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Model)
                    .Include(r => r.Cistern)
                        .ThenInclude(c => c.Owner)
                    .Include(r => r.Cistern)
                        .ThenInclude(r => r.Affiliation)
                    .Include(r => r.RepairType)
                    .Include(r => r.Depot)
                    .Include(r => r.Station)
                    .AsSplitQuery()
                    .Where(r => r.Id == id)
                    .Select(r => r.ToRepairsInDTO())
                    .FirstOrDefaultAsync();

                return repairsIn is null ? Results.NotFound() : Results.Ok(repairsIn);
            })
            .WithName("GetRepairsInById")
            .Produces<RepairsInDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateRepairsInDTO dto) =>
            {
                var repairsIn = dto.ToRepairsIn();
                context.RepairsIns.Add(repairsIn);
                await context.SaveChangesAsync();
                return Results.Created($"/api/RepairsIns/{repairsIn.Id}", repairsIn.ToRepairsInDTO());
            })
            .WithName("CreateRepairsIn")
            .Produces<CreateRepairsInDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateRepairsInDTO dto) =>
            {
                var repairsIn = await context.RepairsIns.FindAsync(id);
                if (repairsIn is null)
                    return Results.NotFound();

                repairsIn.UpdateRepairsIn(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateRepairsIn")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var repairsIn = await context.RepairsIns.FindAsync(id);
                if (repairsIn is null)
                    return Results.NotFound();
                context.Remove(repairsIn);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteRepairsIn")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);
    }
}