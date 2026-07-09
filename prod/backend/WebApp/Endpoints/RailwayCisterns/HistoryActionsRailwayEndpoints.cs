using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Security.Claims;

namespace WebApp.Endpoints.RailwayCisterns;

public static class HistoryActionsRailwayEndpoints
{
    public static void MapHistoryActionsRailwayEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/history-actions-railway")
            .RequireAuthorization()
            .WithTags("history-actions-railway");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context) =>
            {
                var items = await context.HistoryActionsRailways
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Select(h => h.ToHistoryActionsRailwayDTO())
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetHistoryActionsRailway")
            .Produces<List<HistoryActionsRailwayDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var item = await context.HistoryActionsRailways
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Where(h => h.Id == id)
                    .Select(h => h.ToHistoryActionsRailwayDTO())
                    .FirstOrDefaultAsync();

                return item is null ? Results.NotFound() : Results.Ok(item);
            })
            .WithName("GetHistoryActionsRailwayById")
            .Produces<HistoryActionsRailwayDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapGet("/byCisternId/{cisternId}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid cisternId) =>
            {
                var items = await context.HistoryActionsRailways
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .AsSplitQuery()
                    .Where(h => h.CisternId == cisternId)
                    .OrderByDescending(h => h.Date)
                    .Select(h => h.ToHistoryActionsRailwayDTO())
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetHistoryActionsRailwayByCisternId")
            .Produces<List<HistoryActionsRailwayDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateHistoryActionsRailwayDTO dto,
                HttpContext httpContext) =>
            {
                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                var history = dto.ToHistoryActionsRailway(creatorId);

                context.HistoryActionsRailways.Add(history);
                await context.SaveChangesAsync();

                var result = await context.HistoryActionsRailways
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Where(h => h.Id == history.Id)
                    .Select(h => h.ToHistoryActionsRailwayDTO())
                    .FirstOrDefaultAsync();

                return Results.Created($"/api/history-actions-railway/{history.Id}", result);
            })
            .WithName("CreateHistoryActionsRailway")
            .Produces<HistoryActionsRailwayDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateHistoryActionsRailwayDTO dto,
                HttpContext httpContext) =>
            {
                var history = await context.HistoryActionsRailways.FindAsync(id);
                if (history is null)
                    return Results.NotFound();

                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                history.UpdateHistoryActionsRailway(dto, creatorId);

                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateHistoryActionsRailway")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var history = await context.HistoryActionsRailways.FindAsync(id);
                if (history is null)
                    return Results.NotFound();

                context.HistoryActionsRailways.Remove(history);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteHistoryActionsRailway")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
