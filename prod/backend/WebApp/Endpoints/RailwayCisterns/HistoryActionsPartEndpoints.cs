using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Security.Claims;

namespace WebApp.Endpoints.RailwayCisterns;

public static class HistoryActionsPartEndpoints
{
    public static void MapHistoryActionsPartEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/history-actions-part")
            .RequireAuthorization()
            .WithTags("history-actions-part");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var items = await context.HistoryActionsParts
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Select(h => h.ToHistoryActionsPartDTO())
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetHistoryActionsPart")
            .Produces<List<HistoryActionsPartDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var item = await context.HistoryActionsParts
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Where(h => h.Id == id)
                    .Select(h => h.ToHistoryActionsPartDTO())
                    .FirstOrDefaultAsync();

                return item is null ? Results.NotFound() : Results.Ok(item);
            })
            .WithName("GetHistoryActionsPartById")
            .Produces<HistoryActionsPartDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapGet("/byPartId/{partId}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid partId) =>
            {
                var items = await context.HistoryActionsParts
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .AsSplitQuery()
                    .Where(h => h.PartId == partId)
                    .OrderByDescending(h => h.Date)
                    .Select(h => h.ToHistoryActionsPartDTO())
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetHistoryActionsPartByPartId")
            .Produces<List<HistoryActionsPartDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateHistoryActionsPartDTO dto,
                HttpContext httpContext) =>
            {
                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                var history = dto.ToHistoryActionsPart(creatorId);

                context.HistoryActionsParts.Add(history);
                await context.SaveChangesAsync();

                var result = await context.HistoryActionsParts
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Where(h => h.Id == history.Id)
                    .Select(h => h.ToHistoryActionsPartDTO())
                    .FirstOrDefaultAsync();

                return Results.Created($"/api/history-actions-part/{history.Id}", result);
            })
            .WithName("CreateHistoryActionsPart")
            .Produces<HistoryActionsPartDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateHistoryActionsPartDTO dto,
                HttpContext httpContext) =>
            {
                var history = await context.HistoryActionsParts.FindAsync(id);
                if (history is null)
                    return Results.NotFound();

                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                history.UpdateHistoryActionsPart(dto, creatorId);

                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateHistoryActionsPart")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var history = await context.HistoryActionsParts.FindAsync(id);
                if (history is null)
                    return Results.NotFound();

                context.HistoryActionsParts.Remove(history);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteHistoryActionsPart")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
