using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RoadEndpoints
{
    public static void MapRoadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/roads")
            .RequireAuthorization()
            .WithTags("Road");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var roads = await context.Roads
                    .Select(d => d.ToRoadDTO())
                    .ToListAsync();
                return Results.Ok(roads);
            })
            .WithName("GetRoads")
            .Produces<List<RoadDTO>>(StatusCodes.Status200OK)
            .RequireAuthorization();

        group.MapGet("/{id}", async (
                [FromServices] ApplicationDbContext context,
                int id) =>
            {
                var road = context.Roads
                    .Where(d => d.Id == id)
                    .Select(d => d.ToRoadDTO())
                    .FirstOrDefault();

                return road is null ? Results.NotFound() : Results.Ok(road);
            })
            .WithName("GetRoadById")
            .Produces<RoadDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateRoadDTO dto) =>
            {
                var road = dto.ToRoad();

                context.Roads.Add(road);
                await context.SaveChangesAsync();
                return Results.Created($"/api/roads/{road.Id}", road.ToRoadDTO());
            })
            .WithName("CreateRoad")
            .Produces(StatusCodes.Status201Created)
            .RequireAuthorization();

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                int id,
                [FromBody] UpdateRoadDTO dto) =>
            {
                var road = await context.Roads.FindAsync(id);
                if (road is null)
                {
                    return Results.NotFound();
                }

                road.UpdateRoad(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateRoad")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);
        
        group.MapDelete("/{id}", async (
            [FromServices] ApplicationDbContext context,
            int id) =>
        {
            var road = await context.Roads.FindAsync(id);
            if (road is null)
            {
                return Results.NotFound();
            }
            
            context.Roads.Remove(road);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteRoad")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}