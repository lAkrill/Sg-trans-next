using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class UpdateEndpoints
{
    public static void MapUpdateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/updates")
            .RequireAuthorization()
            .WithTags("Update");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var updates = await context.Updates
                    .Select(d => d.ToUpdateDTO())
                    .ToListAsync();
                return Results.Ok(updates);
            })
            .WithName("GetUpdates")
            .Produces<List<UpdateDTO>>(StatusCodes.Status200OK)
            .RequireAuthorization();

        group.MapGet("/{id}", async (
                [FromServices] ApplicationDbContext context,
                int id) =>
            {
                var update = context.Updates
                    .Where(d => d.Id == id)
                    .Select(d => d.ToUpdateDTO())
                    .FirstOrDefault();

                return update is null ? Results.NotFound() : Results.Ok(update);
            })
            .WithName("GetUpdateById")
            .Produces<UpdateDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateUpdateDTO dto) =>
            {
                var update = dto.ToUpdate();

                context.Updates.Add(update);
                await context.SaveChangesAsync();
                return Results.Created($"/api/updates/{update.Id}", update.ToUpdateDTO());
            })
            .WithName("CreateUpdate")
            .Produces(StatusCodes.Status201Created)
            .RequireAuthorization();

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                int id,
                [FromBody] UpdateUpdateDTO dto) =>
            {
                var update = await context.Updates.FindAsync(id);
                if (update is null)
                {
                    return Results.NotFound();
                }

                update.UpdateUpdate(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateUpdate")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);
        
        group.MapDelete("/{id}", async (
            [FromServices] ApplicationDbContext context,
            int id) =>
        {
            var update = await context.Updates.FindAsync(id);
            if (update is null)
            {
                return Results.NotFound();
            }
            
            context.Updates.Remove(update);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteUpdate")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}