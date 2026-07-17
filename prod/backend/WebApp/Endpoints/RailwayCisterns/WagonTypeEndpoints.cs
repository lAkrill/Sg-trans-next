using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class WagonTypeEndpoints
{
    public static void MapWagonTypeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/wagon-types")
            .RequireAuthorization()
            .WithTags("wagon-types");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var types = await context.Set<WagonType>()
                .Select(w => new WagonTypeDTO
                {
                    Id = w.Id,
                    Name = w.Name,
                    Type = w.Type
                })
                .ToListAsync();
            return Results.Ok(types);
        })
        .WithName("GetWagonTypes")
        .Produces<List<WagonTypeDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var type = await context.Set<WagonType>()
                .Where(w => w.Id == id)
                .Select(w => new WagonTypeDTO
                {
                    Id = w.Id,
                    Name = w.Name,
                    Type = w.Type
                })
                .FirstOrDefaultAsync();
            return type is null ? Results.NotFound() : Results.Ok(type);
        })
        .WithName("GetWagonTypeById")
        .Produces<WagonTypeDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateWagonTypeDTO dto) =>
        {
            var wagonType = new WagonType
            {
                Name = dto.Name,
                Type = dto.Type
            };

            context.Add(wagonType);
            await context.SaveChangesAsync();

            return Results.Created($"/api/wagon-types/{wagonType.Id}", new WagonTypeDTO
            {
                Id = wagonType.Id,
                Name = wagonType.Name,
                Type = wagonType.Type
            });
        })
        .WithName("CreateWagonType")
        .Produces<WagonTypeDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateWagonTypeDTO dto) =>
        {
            var wagonType = await context.Set<WagonType>().FindAsync(id);
            if (wagonType == null)
                return Results.NotFound();

            wagonType.Name = dto.Name;
            wagonType.Type = dto.Type;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateWagonType")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var wagonType = await context.Set<WagonType>().FindAsync(id);
            if (wagonType == null)
                return Results.NotFound();

            context.Remove(wagonType);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteWagonType")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
