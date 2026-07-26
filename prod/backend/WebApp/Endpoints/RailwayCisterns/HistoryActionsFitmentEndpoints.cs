using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Security.Claims;

namespace WebApp.Endpoints.RailwayCisterns;

public static class HistoryActionsFitmentEndpoints
{
    public static void MapHistoryActionsFitmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/history-actions-fitment")
            .RequireAuthorization()
            .WithTags("history-actions-fitment");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var items = await context.HistoryActionsFitments
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Select(h => h.ToHistoryActionsFitmentDTO())
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetHistoryActionsFitment")
            .Produces<List<HistoryActionsFitmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var item = await context.HistoryActionsFitments
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Where(h => h.Id == id)
                    .Select(h => h.ToHistoryActionsFitmentDTO())
                    .FirstOrDefaultAsync();

                return item is null ? Results.NotFound() : Results.Ok(item);
            })
            .WithName("GetHistoryActionsFitmentById")
            .Produces<HistoryActionsFitmentDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapGet("/byFitmentId/{fitmentId}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid fitmentId) =>
            {
                var items = await context.HistoryActionsFitments
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .AsSplitQuery()
                    .Where(h => h.FitmentId == fitmentId)
                    .OrderByDescending(h => h.Date)
                    .Select(h => h.ToHistoryActionsFitmentDTO())
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetHistoryActionsFitmentByFitmentId")
            .Produces<List<HistoryActionsFitmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateHistoryActionsFitmentDTO dto,
                HttpContext httpContext) =>
            {
                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                var history = dto.ToHistoryActionsFitment(creatorId);

                context.HistoryActionsFitments.Add(history);
                await context.SaveChangesAsync();

                var result = await context.HistoryActionsFitments
                    .AsNoTracking()
                    .Include(h => h.Creator)
                    .Where(h => h.Id == history.Id)
                    .Select(h => h.ToHistoryActionsFitmentDTO())
                    .FirstOrDefaultAsync();

                return Results.Created($"/api/history-actions-fitment/{history.Id}", result);
            })
            .WithName("CreateHistoryActionsFitment")
            .Produces<HistoryActionsFitmentDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateHistoryActionsFitmentDTO dto,
                HttpContext httpContext) =>
            {
                var history = await context.HistoryActionsFitments.FindAsync(id);
                if (history is null)
                    return Results.NotFound();

                var userIdString = httpContext.User.FindFirstValue("userId");
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                history.UpdateHistoryActionsFitment(dto, creatorId);

                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateHistoryActionsFitment")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var history = await context.HistoryActionsFitments.FindAsync(id);
                if (history is null)
                    return Results.NotFound();

                context.HistoryActionsFitments.Remove(history);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteHistoryActionsFitment")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
