using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsMatchingEndpoints
{
    public static void MapRepairsMatchingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/RepairsMatching")
            .RequireAuthorization()
            .WithTags("RepairsMatching");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var repairsMatching = await context.RepairsMatchings
                    .AsNoTracking()
                    .Include(r => r.RepairIn)
                        .ThenInclude(ri => ri.RepairType)
                    .Include(r => r.RepairOut)
                        .ThenInclude(ro => ro.RepairType)
                    .OrderByDescending(r => r.RepairIn.DateIn)
                    .AsSplitQuery()
                    .Select(r => r.ToRepairsMatchingDTO())
                    .ToListAsync();
                return Results.Ok(repairsMatching);
            })
            .WithName("GetAllRepairsMatching")
            .Produces<List<RepairsMatchingDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/byCisternId/{cisternId}", async ([FromServices] ApplicationDbContext context,
                [FromRoute] Guid cisternId) =>
            {
                var repairsMatching = await context.RepairsMatchings
                    .AsNoTracking()
                    .Where(r => r.CisternId == cisternId)
                    .Include(r => r.RepairIn)
                        .ThenInclude(ri => ri.RepairType)
                    .Include(r => r.RepairOut)
                        .ThenInclude(ro => ro.RepairType)
                    .AsSplitQuery()
                    .OrderByDescending(r => r.DateTime)
                    .Select(r => r.ToRepairsMatchingDTO())
                    .ToListAsync();
                return Results.Ok(repairsMatching);
            })
            .WithName("GetRepairsMatchingByCisternId")
            .Produces<List<RepairsMatchingDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateRepairsMatchingDTO dto) =>
            {
                var repairsMatching = await context.RepairsMatchings.FindAsync(id);
                if (repairsMatching is null)
                    return Results.NotFound();

                repairsMatching.UpdateRepairsMatching(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateRepairsMatching")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);
    }
}
