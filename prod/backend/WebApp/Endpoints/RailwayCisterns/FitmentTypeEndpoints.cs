using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class FitmentTypeEndpoints
{
    public static void MapFitmentTypeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/FitmentTypes")
            .RequireAuthorization()
            .WithTags("FitmentTypes");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
            {
                if (take < 0)
                {
                    return Results.BadRequest();
                }
                var fitmentTypes = await context.FitmentTypes
                    .AsNoTracking()
                    .Skip(skip)
                    .Take(take)
                    .Select(ft => ft.ToFitmentTypeDTO())
                    .ToListAsync();
                return Results.Ok(fitmentTypes);
            })
            .WithName("GetFitmentTypes")
            .Produces<List<FitmentTypeDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var fitmentTypes = await context.FitmentTypes
                    .AsNoTracking()
                    .OrderBy(ft => ft.Name)
                    .Select(ft => ft.ToFitmentTypeDTO())
                    .ToListAsync();
                return Results.Ok(fitmentTypes);
            })
            .WithName("GetAllFitmentTypes")
            .Produces<List<FitmentTypeDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
            {
                var fitmentType = await context.FitmentTypes
                    .AsNoTracking()
                    .Where(ft => ft.Id == id)
                    .Select(ft => ft.ToFitmentTypeDTO())
                    .FirstOrDefaultAsync();

                return fitmentType is null ? Results.NotFound() : Results.Ok(fitmentType);
            })
            .WithName("GetFitmentTypeById")
            .Produces<FitmentTypeDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                HttpContext httpContext,
                [FromBody] CreateFitmentTypeDTO dto) =>
            {
                var creatorId = Guid.Parse(httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.Empty.ToString());
                var fitmentType = dto.ToFitmentType(creatorId);
                context.FitmentTypes.Add(fitmentType);
                await context.SaveChangesAsync();
                return Results.Created($"/api/FitmentTypes/{fitmentType.Id}", fitmentType.ToFitmentTypeDTO());
            })
            .WithName("CreateFitmentType")
            .Produces<FitmentTypeDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateFitmentTypeDTO dto) =>
            {
                var fitmentType = await context.FitmentTypes.FindAsync(id);
                if (fitmentType is null)
                    return Results.NotFound();

                fitmentType.UpdateFitmentType(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateFitmentType")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var fitmentType = await context.FitmentTypes.FindAsync(id);
                if (fitmentType is null)
                    return Results.NotFound();
                context.Remove(fitmentType);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteFitmentType")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
