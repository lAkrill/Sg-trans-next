using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Security.Claims;
using DocumentFormat.OpenXml.Office2010.Excel;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RailwayCisternStatusEndpoints
{
    public static void MapRailwayCistrenStatusEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/railway-cistern-status")
            .RequireAuthorization()
            .WithTags("railway-cistern-status");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var statuses = await context.RailwayCisternStatuses
                .Include(s => s.Creator)
                .Select(s => s.ToRailwayCisternStatusDTO())
                .ToListAsync();
            return Results.Ok(statuses);
        })
        .WithName("GetRailwayCisternStatuses")
        .Produces<List<RailwayCisternStatusDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
             var status = await context.RailwayCisternStatuses
                .Where(m => m.Id == id)
                .Include(s => s.Creator)
                .Select(s => s.ToRailwayCisternStatusDTO())
                .FirstOrDefaultAsync();
            return status is null ? Results.NotFound() : Results.Ok(status);
        })
        .WithName("GetRailwayCisternStatusById")
        .Produces<RailwayCisternStatusDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateRailwayCisternStatusDTO dto, HttpContext httpContext) =>
        {
            Guid creator = Guid.Parse(httpContext.User.FindFirstValue("userId"));
            var status = dto.ToRailwayCisternStatus(creator);

            context.Add(status);
            await context.SaveChangesAsync();

            var result = await context.RailwayCisternStatuses
                .Where(m => m.Id == status.Id)
                .Include(s => s.Creator)
                .Select(s => s.ToRailwayCisternStatusDTO())
                .FirstOrDefaultAsync();

            return Results.Created($"/api/railway-cistern-status/{status.Id}", result);
        })
        .WithName("CreateRailwayCisternStatus")
        .Produces<RailwayCisternStatusDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateRailwayCisternStatusDTO dto,
                                    HttpContext httpContext) =>
        {
            var status = await context.RailwayCisternStatuses.FindAsync(id);
            if (status == null)
                return Results.NotFound();
            Guid creator = Guid.Parse(httpContext.User.FindFirstValue("userId"));
            status.UpdateRailwayCisternStatus(dto, creator);

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateRailwayCisternStatus")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var status = await context.RailwayCisternStatuses.FindAsync(id);
            if (status == null)
                return Results.NotFound();

            context.Remove(status);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteRailwayCisternStatus")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
