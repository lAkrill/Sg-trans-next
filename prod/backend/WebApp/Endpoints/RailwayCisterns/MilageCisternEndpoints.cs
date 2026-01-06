using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class MilageCisternEndpoints
{
    public static void MapMilageCisternEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/milage-cisterns")
            .RequireAuthorization()
            .WithTags("milage-cisterns");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context) =>
        {
            var milages = await context.Set<MilageCistern>()
                .Select(m => new MilageCisternDTO
                {
                    Id = m.Id,
                    CisternId = m.CisternId,
                    CisternNumber = m.CisternNumber,
                    Milage = m.Milage,
                    MilageNorm = m.MilageNorm,
                    RepairTypeId = m.RepairTypeId,
                    RepairDate = m.RepairDate,
                    InputModeCode = m.InputModeCode,
                    InputDate = m.InputDate
                })
                .ToListAsync();
            return Results.Ok(milages);
        })
        .WithName("GetMilageCisterns")
        .Produces<List<MilageCisternDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var milage = await context.Set<MilageCistern>()
                .Where(m => m.Id == id)
                .Select(m => new MilageCisternDTO
                {
                    Id = m.Id,
                    CisternId = m.CisternId,
                    CisternNumber = m.CisternNumber,
                    Milage = m.Milage,
                    MilageNorm = m.MilageNorm,
                    RepairTypeId = m.RepairTypeId,
                    RepairDate = m.RepairDate,
                    InputModeCode = m.InputModeCode,
                    InputDate = m.InputDate
                })
                .FirstOrDefaultAsync();
            return milage is null ? Results.NotFound() : Results.Ok(milage);
        })
        .WithName("GetLastMilageCisternById")
        .Produces<MilageCisternDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapGet("/by-cistern/{cisternId}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid cisternId) =>
        {
            var milages = await context.Set<MilageCistern>()
                .Where(m => m.CisternId == cisternId)
                .Select(m => new MilageCisternDTO
                {
                    Id = m.Id,
                    CisternId = m.CisternId,
                    CisternNumber = m.CisternNumber,
                    Milage = m.Milage,
                    MilageNorm = m.MilageNorm,
                    RepairTypeId = m.RepairTypeId,
                    RepairDate = m.RepairDate,
                    InputModeCode = m.InputModeCode,
                    InputDate = m.InputDate
                })
                .OrderByDescending(m => m.InputDate)
                .ToListAsync();
            return Results.Ok(milages);
        })
        .WithName("GetMilageCisternsByCisternId")
        .Produces<List<MilageCisternDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
        
        group.MapGet("/last/by-cistern-id/{cisternId}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid cisternId) =>
        {
            var milage = await context.Set<MilageCistern>()
                .Where(m => m.CisternId == cisternId)
                .Select(m => new MilageCisternDTO
                {
                    Id = m.Id,
                    CisternId = m.CisternId,
                    CisternNumber = m.CisternNumber,
                    Milage = m.Milage,
                    MilageNorm = m.MilageNorm,
                    RepairTypeId = m.RepairTypeId,
                    RepairDate = m.RepairDate,
                    InputModeCode = m.InputModeCode,
                    InputDate = m.InputDate
                })
                .OrderByDescending(m => m.InputDate)
                .FirstOrDefaultAsync();
            return Results.Ok(milage);
        })
        .WithName("GetLastMilageCisternsByCisternId")
        .Produces<MilageCisternDTO>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
        
        group.MapGet("/by-cistern-number/{cisternNumber}", async ([FromServices] ApplicationDbContext context, [FromRoute] string cisternNumber) =>
        {
            var milages = await context.Set<MilageCistern>()
                .Include(m => m.Cistern)
                .Where(m => m.Cistern.Number == cisternNumber)
                .Select(m => new MilageCisternDTO
                {
                    Id = m.Id,
                    CisternId = m.CisternId,
                    CisternNumber = m.CisternNumber,
                    Milage = m.Milage,
                    MilageNorm = m.MilageNorm,
                    RepairTypeId = m.RepairTypeId,
                    RepairDate = m.RepairDate,
                    InputModeCode = m.InputModeCode,
                    InputDate = m.InputDate
                })
                .OrderByDescending(m => m.InputDate)
                .ToListAsync();
            return Results.Ok(milages);
        })
        .WithName("GetMilageCisternsByCisternNumber")
        .Produces<List<MilageCisternDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read); 
        
        group.MapGet("/last/by-cistern-number/{cisternNumber}", async ([FromServices] ApplicationDbContext context, [FromRoute] string cisternNumber) =>
        {
            var milages = await context.Set<MilageCistern>()
                .Include(m => m.Cistern)
                .Where(m => m.Cistern.Number == cisternNumber)
                .Select(m => new MilageCisternDTO
                {
                    Id = m.Id,
                    CisternId = m.CisternId,
                    CisternNumber = m.CisternNumber,
                    Milage = m.Milage,
                    MilageNorm = m.MilageNorm,
                    RepairTypeId = m.RepairTypeId,
                    RepairDate = m.RepairDate,
                    InputModeCode = m.InputModeCode,
                    InputDate = m.InputDate
                })
                .OrderByDescending(m => m.InputDate)
                .FirstOrDefaultAsync();
            return Results.Ok(milages);
        })
        .WithName("GetLastMilageCisternsByCisternNumber")
        .Produces<List<MilageCisternDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateMilageCisternDTO dto) =>
        {
            var milage = new MilageCistern
            {
                CisternId = dto.CisternId,
                CisternNumber = dto.CisternNumber,
                Milage = dto.Milage,
                MilageNorm = dto.MilageNorm,
                RepairTypeId = dto.RepairTypeId,
                RepairDate = dto.RepairDate,
                InputModeCode = dto.InputModeCode,
                InputDate = dto.InputDate
            };

            context.Add(milage);
            await context.SaveChangesAsync();

            return Results.Created($"/api/milage-cisterns/{milage.Id}", new MilageCisternDTO
            {
                Id = milage.Id,
                CisternId = milage.CisternId,
                CisternNumber = milage.CisternNumber,
                Milage = milage.Milage,
                MilageNorm = milage.MilageNorm,
                RepairTypeId = milage.RepairTypeId,
                RepairDate = milage.RepairDate,
                InputModeCode = milage.InputModeCode,
                InputDate = milage.InputDate
            });
        })
        .WithName("CreateMilageCistern")
        .Produces<MilageCisternDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateMilageCisternDTO dto) =>
        {
            var milage = await context.Set<MilageCistern>().FindAsync(id);
            if (milage == null)
                return Results.NotFound();

            milage.Milage = dto.Milage;
            milage.MilageNorm = dto.MilageNorm;
            milage.RepairTypeId = dto.RepairTypeId;
            milage.RepairDate = dto.RepairDate;
            milage.InputModeCode = dto.InputModeCode;
            milage.InputDate = dto.InputDate;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateMilageCistern")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var milage = await context.Set<MilageCistern>().FindAsync(id);
            if (milage == null)
                return Results.NotFound();

            context.Remove(milage);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteMilageCistern")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
