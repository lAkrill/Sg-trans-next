using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class PartTypeEndpoints
{
    public static void MapPartTypeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/part-types")
            .RequireAuthorization()
            .WithTags("part-types");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var types = await context.Set<PartType>()
                .Where(t => !t.Name.ToLower().Contains("эластомер"))
                .Select(t => new PartTypeDTO
                {
                    Id = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    Weight = t.Weight
                })
                .ToListAsync();
            return Results.Ok(types);
        })
        .WithName("GetPartTypes")
        .Produces<List<PartTypeDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var type = await context.Set<PartType>()
                .Where(t => t.Id == id)
                .Select(t => new PartTypeDTO
                {
                    Id = t.Id,
                    Name = t.Name,
                    Code = t.Code,
                    Weight = t.Weight
                })
                .FirstOrDefaultAsync();
            return type is null ? Results.NotFound() : Results.Ok(type);
        })
        .WithName("GetPartTypeById")
        .Produces<PartTypeDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreatePartTypeDTO dto) =>
        {
            var type = new PartType
            {
                Name = dto.Name,
                Code = dto.Code,
                Weight = dto.Weight
            };

            context.Add(type);
            await context.SaveChangesAsync();

            return Results.Created($"/api/part-types/{type.Id}", new PartTypeDTO
            {
                Id = type.Id,
                Name = type.Name,
                Code = type.Code,
                Weight = type.Weight
            });
        })
        .WithName("CreatePartType")
        .Produces<PartTypeDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdatePartTypeDTO dto) =>
        {
            var type = await context.Set<PartType>().FindAsync(id);
            if (type == null)
                return Results.NotFound();

            type.Name = dto.Name;
            type.Code = dto.Code;
            type.Weight = dto.Weight;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdatePartType")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var type = await context.Set<PartType>().FindAsync(id);
            if (type == null)
                return Results.NotFound();

            context.Remove(type);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeletePartType")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
