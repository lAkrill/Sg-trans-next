using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsOutEndpoints
{
    public static void MapRepairsOutEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/RepairsOut")
            .RequireAuthorization()
            .WithTags("RepairsOut");
        
        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
        {
            var repairsOut = await context.RepairsOuts
                .AsNoTracking()
                .Include(r=> r.Cistern)
                    .ThenInclude(c=>c.Type)
                .Include(r => r.Cistern)
                    .ThenInclude(c => c.Manufacturer)
                .Include(r=> r.Cistern)
                    .ThenInclude(c=>c.Model)
                .Include(r=> r.Cistern)
                    .ThenInclude(c=>c.Owner)
                .Include(r=> r.Cistern)
                    .ThenInclude(r=>r.Affiliation)
                .Include(r=>r.RepairType)
                .Include(r=> r.Depot)
                .AsSplitQuery()
                .Skip(skip)
                .Take(Math.Min(take, 100))
                .Select(r => r.ToRepairsOutDTO())
                .ToListAsync();
            return Results.Ok(repairsOut);
        })
        .WithName("GetRepairsOut")
        .Produces<List<RepairsOutDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
        
        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context,
            Guid id) =>
        {
            var repairsOut = await context.RepairsOuts
                .AsNoTracking()
                .Include(r=> r.Cistern)
                    .ThenInclude(c=>c.Type)
                .Include(r => r.Cistern)
                    .ThenInclude(c => c.Manufacturer)
                .Include(r=> r.Cistern)
                    .ThenInclude(c=>c.Model)
                .Include(r=> r.Cistern)
                    .ThenInclude(c=>c.Owner)
                .Include(r=> r.Cistern)
                    .ThenInclude(r=>r.Affiliation)
                .Include(r=>r.RepairType)
                .Include(r=> r.Depot)
                .AsSplitQuery()
                .Where(r => r.Id == id)
                .Select(r => r.ToRepairsOutDTO())
                .FirstOrDefaultAsync();
            
            return repairsOut is null ? Results.NotFound() : Results.Ok(repairsOut);
        })
        .WithName("GetRepairsOutById")
        .Produces<RepairsInDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);
           
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateRepairsOutDTO dto) =>
        {
            var repairsOut = dto.ToRepairsOut();
            context.RepairsOuts.Add(repairsOut);
            await context.SaveChangesAsync();
            return Results.Created($"/api/RepairsOuts/{repairsOut.Id}", repairsOut.ToRepairsOutDTO());
        })
        .WithName("CreateRepairsOut")
        .Produces<CreateRepairsOutDTO>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .RequirePermissions(Permission.Create);
        
        group.MapPut("/{id}", async (
            [FromServices] ApplicationDbContext context,
            [FromRoute] Guid id,
            [FromBody] UpdateRepairsOutDTO dto) =>
        {
            var repairsOut = await context.RepairsOuts.FindAsync(id);
            if(repairsOut is null)
                return Results.NotFound();
            
            repairsOut.UpdateRepairsOut(dto);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateRepairsOut")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var repairsOut = await context.RepairsOuts.FindAsync(id);
                if(repairsOut is null)
                    return Results.NotFound();
                context.Remove(repairsOut);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteRepairsOut")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapGet("/byCisternNumber/{cisternNumber}", async ([FromServices] ApplicationDbContext context,
                [FromRoute] string cisternNumber,
                [FromQuery] int skip = 0,
                [FromQuery] int take = 50) =>
            {
                var repairsOut = await context.RepairsOuts
                    .AsNoTracking()
                    .Where(r => r.CisternNumber == cisternNumber)
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
                    .AsSplitQuery()
                    .OrderByDescending(r => r.DateIn)
                    .Skip(skip)
                    .Take(Math.Min(take, 100))
                    .Select(r => r.ToRepairsOutDTO())
                    .ToListAsync();
                return Results.Ok(repairsOut);
            })
            .WithName("GetRepairsOutByCisternNumber")
            .Produces<List<RepairsOutDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/latest/byCisternNumber/{cisternNumber}", async ([FromServices] ApplicationDbContext context,
                [FromRoute] string cisternNumber) =>
            {
                var repairsOut = await context.RepairsOuts
                    .AsNoTracking()
                    .Where(r => r.CisternNumber == cisternNumber)
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
                    .AsSplitQuery()
                    .OrderByDescending(r => r.DateIn)
                    .Select(r => r.ToRepairsOutDTO())
                    .FirstOrDefaultAsync();

                return repairsOut is null ? Results.NotFound() : Results.Ok(repairsOut);
            })
            .WithName("GetLatestRepairsOutByCisternNumber")
            .Produces<RepairsOutDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);
    }
}