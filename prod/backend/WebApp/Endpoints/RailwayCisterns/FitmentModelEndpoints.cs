using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class FitmentModelEndpoints
{
    public static void MapFitmentModelEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/FitmentModels")
            .RequireAuthorization()
            .WithTags("FitmentModels");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
            {
                if (take < 0)
                {
                    return Results.BadRequest();
                }
                var fitmentModels = await context.FitmentModels
                    .AsNoTracking()
                    .Skip(skip)
                    .Take(take)
                    .Select(fm => fm.ToFitmentModelDTO())
                    .ToListAsync();
                return Results.Ok(fitmentModels);
            })
            .WithName("GetFitmentModels")
            .Produces<List<FitmentModelDTO>>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Read);

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var fitmentModels = await context.FitmentModels
                    .AsNoTracking()
                    .OrderBy(fm => fm.Name)
                    .Select(fm => fm.ToFitmentModelDTO())
                    .ToListAsync();
                return Results.Ok(fitmentModels);
            })
            .WithName("GetAllFitmentModels")
            .Produces<List<FitmentModelDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
            {
                var fitmentModel = await context.FitmentModels
                    .AsNoTracking()
                    .Where(fm => fm.Id == id)
                    .Select(fm => fm.ToFitmentModelDTO())
                    .FirstOrDefaultAsync();

                return fitmentModel is null ? Results.NotFound() : Results.Ok(fitmentModel);
            })
            .WithName("GetFitmentModelById")
            .Produces<FitmentModelDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                HttpContext httpContext,
                [FromBody] CreateFitmentModelDTO dto) =>
            {
                var userIdString = httpContext.User.FindFirst("userId")?.Value;
                if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                {
                    return Results.BadRequest();
                }

                var fitmentModel = dto.ToFitmentModel(creatorId);
                context.FitmentModels.Add(fitmentModel);
                await context.SaveChangesAsync();
                return Results.Created($"/api/FitmentModels/{fitmentModel.Id}", fitmentModel.ToFitmentModelDTO());
            })
            .WithName("CreateFitmentModel")
            .Produces<FitmentModelDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateFitmentModelDTO dto) =>
            {
                var fitmentModel = await context.FitmentModels.FindAsync(id);
                if (fitmentModel is null)
                    return Results.NotFound();

                fitmentModel.UpdateFitmentModel(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateFitmentModel")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
            {
                var fitmentModel = await context.FitmentModels.FindAsync(id);
                if (fitmentModel is null)
                    return Results.NotFound();
                context.Remove(fitmentModel);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteFitmentModel")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
