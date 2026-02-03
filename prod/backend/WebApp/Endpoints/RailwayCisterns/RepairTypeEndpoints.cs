using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairTypeEndpoints
{
    public static void MapRepairTypeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repair-types")
            .RequireAuthorization()
            .WithTags("repair-types");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context) =>
        {
            var repairTypes = await context.Set<RepairType>()
                .Select(rt => rt.ToRepairTypeDto())
                .ToListAsync();
            return Results.Ok(repairTypes);
        })
        .WithName("GetRepairTypes")
        .Produces<List<RepairTypeDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var repairType = await context.Set<RepairType>()
                .Where(rt => rt.Id == id)
                .Select(rt => rt.ToRepairTypeDto())
                .FirstOrDefaultAsync();
            return repairType is null ? Results.NotFound() : Results.Ok(repairType);
        })
        .WithName("GetRepairTypeById")
        .Produces<RepairTypeDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateRepairTypeDTO dto) =>
        {
            var repairType = dto.ToRepairType();

            context.Add(repairType);
            await context.SaveChangesAsync();

            return Results.Created($"/api/repair-types/{repairType.Id}", new RepairTypeDTO
            {
                Id = repairType.Id,
                Name = repairType.Name,
                Code = repairType.Code,
                Description = repairType.Description
            });
        })
        .WithName("CreateRepairType")
        .Produces<RepairTypeDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateRepairTypeDTO dto) =>
        {
            var repairType = await context.Set<RepairType>().FindAsync(id);
            if (repairType == null)
                return Results.NotFound();

            repairType.UpdateRepairType(dto);

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateRepairType")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var repairType = await context.Set<RepairType>().FindAsync(id);
            if (repairType == null)
                return Results.NotFound();

            context.Remove(repairType);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteRepairType")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
