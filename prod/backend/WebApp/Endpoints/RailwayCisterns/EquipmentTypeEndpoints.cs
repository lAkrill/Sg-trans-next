using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class EquipmentTypeEndpoints
{
    public static void MapEquipmentTypeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/equipment-types")
            .RequireAuthorization()
            .WithTags("equipment-types");

        // Получение всех типов оборудования
        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var types = await context.EquipmentTypes
                .Include(e => e.PartType)
                .Select(e => new EquipmentTypeDTO
                {
                    Id = e.Id,
                    Name = e.Name,
                    Code = e.Code,
                    PartTypeId = e.PartTypeId,
                    PartTypeName = e.PartType.Name
                })
                .ToListAsync();

            return Results.Ok(types);
        })
        .WithName("GetEquipmentTypes")
        .Produces<List<EquipmentTypeDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Получение типа оборудования по ID
        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
        {
            var type = await context.EquipmentTypes
                .Include(e => e.PartType)
                .Where(e => e.Id == id)
                .Select(e => new EquipmentTypeDTO
                {
                    Id = e.Id,
                    Name = e.Name,
                    Code = e.Code,
                    PartTypeId = e.PartTypeId,
                    PartTypeName = e.PartType.Name
                })
                .FirstOrDefaultAsync();

            return type is null ? Results.NotFound() : Results.Ok(type);
        })
        .WithName("GetEquipmentTypeById")
        .Produces<EquipmentTypeDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        // Получение типов оборудования по типу детали
        group.MapGet("/by-part-type/{partTypeId}", async (
            [FromServices] ApplicationDbContext context,
            Guid partTypeId) =>
        {
            var types = await context.EquipmentTypes
                .Include(e => e.PartType)
                .Where(e => e.PartTypeId == partTypeId)
                .Select(e => new EquipmentTypeDTO
                {
                    Id = e.Id,
                    Name = e.Name,
                    Code = e.Code,
                    PartTypeId = e.PartTypeId,
                    PartTypeName = e.PartType.Name
                })
                .ToListAsync();

            return Results.Ok(types);
        })
        .WithName("GetEquipmentTypesByPartType")
        .Produces<List<EquipmentTypeDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
    }
}
