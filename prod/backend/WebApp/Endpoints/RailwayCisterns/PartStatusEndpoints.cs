using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class PartStatusEndpoints
{
    public static void MapPartStatusEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/part-statuses")
            .RequireAuthorization()
            .WithTags("part-statuses");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var statuses = await context.Set<PartStatus>()
                .Select(s => new PartStatusDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code
                })
                .ToListAsync();
            return Results.Ok(statuses);
        })
        .WithName("GetPartStatuses")
        .Produces<List<PartStatusDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var status = await context.Set<PartStatus>()
                .Where(s => s.Id == id)
                .Select(s => new PartStatusDTO
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code
                })
                .FirstOrDefaultAsync();
            return status is null ? Results.NotFound() : Results.Ok(status);
        })
        .WithName("GetPartStatusById")
        .Produces<PartStatusDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreatePartStatusDTO dto) =>
        {
            var status = new PartStatus
            {
                Name = dto.Name,
                Code = dto.Code
            };

            context.Add(status);
            await context.SaveChangesAsync();

            return Results.Created($"/api/part-statuses/{status.Id}", new PartStatusDTO
            {
                Id = status.Id,
                Name = status.Name,
                Code = status.Code
            });
        })
        .WithName("CreatePartStatus")
        .Produces<PartStatusDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdatePartStatusDTO dto) =>
        {
            var status = await context.Set<PartStatus>().FindAsync(id);
            if (status == null)
                return Results.NotFound();

            status.Name = dto.Name;
            status.Code = dto.Code;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdatePartStatus")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var status = await context.Set<PartStatus>().FindAsync(id);
            if (status == null)
                return Results.NotFound();

            context.Remove(status);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeletePartStatus")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
