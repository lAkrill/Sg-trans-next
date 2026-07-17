using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class FilterTypeEndpoints
{
    public static void MapFilterTypeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/filter-types")
            .RequireAuthorization()
            .WithTags("filter-types");

        // Get all filter types
        group.MapGet("/all/", async (
                [FromServices] ApplicationDbContext context) =>
            {
                var types = await context.Set<FilterType>()
                    .Select(t => new FilterTypeDTO
                    {
                        Id = t.Id,
                        Name = t.Name
                    })
                    .ToListAsync();
                    
                return Results.Ok(types);
            })
            .WithName("GetFilterTypes")
            .Produces<List<FilterTypeDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get filter type by ID
        group.MapGet("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id) =>
            {
                var type = await context.Set<FilterType>()
                    .Where(t => t.Id == id)
                    .Select(t => new FilterTypeDTO
                    {
                        Id = t.Id,
                        Name = t.Name
                    })
                    .FirstOrDefaultAsync();

                if (type == null)
                    return Results.NotFound();

                return Results.Ok(type);
            })
            .WithName("GetFilterTypeById")
            .Produces<FilterTypeDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        // Create filter type
        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateFilterTypeDTO dto) =>
            {
                var type = new FilterType
                {
                    Id = Guid.NewGuid(),
                    Name = dto.Name
                };

                context.Add(type);
                await context.SaveChangesAsync();

                var result = new FilterTypeDTO
                {
                    Id = type.Id,
                    Name = type.Name
                };

                return Results.Created($"/api/filter-types/{type.Id}", result);
            })
            .WithName("CreateFilterType")
            .Produces<FilterTypeDTO>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Create);

        // Update filter type
        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateFilterTypeDTO dto) =>
            {
                var type = await context.Set<FilterType>()
                    .FindAsync(id);

                if (type == null)
                    return Results.NotFound();

                type.Name = dto.Name;

                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateFilterType")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Update);

        // Delete filter type
        group.MapDelete("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id) =>
            {
                var type = await context.Set<FilterType>()
                    .FindAsync(id);

                if (type == null)
                    return Results.NotFound();

                context.Remove(type);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteFilterType")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
