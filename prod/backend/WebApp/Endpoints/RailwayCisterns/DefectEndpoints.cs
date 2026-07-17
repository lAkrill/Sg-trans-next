using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class DefectEndpoints
{
    public static void MapDefectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/defects")
            .RequireAuthorization()
            .WithTags("Defect");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
            {
                var defects = await context.Defects
                    .Select(d => d.ToDefectDTO())
                    .ToListAsync();
                return Results.Ok(defects);
            })
            .WithName("GetDefects")
            .Produces<List<DefectDTO>>(StatusCodes.Status200OK)
            .RequireAuthorization();

        group.MapGet("/{id}", async (
                [FromServices] ApplicationDbContext context,
                int id) =>
            {
                var defect = context.Defects
                    .Where(d => d.Id == id)
                    .Select(d => d.ToDefectDTO())
                    .FirstOrDefault();

                return defect is null ? Results.NotFound() : Results.Ok(defect);
            })
            .WithName("GetDefectById")
            .Produces<DefectDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization();

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateDefectDTO dto) =>
            {
                var defect = dto.ToDefect();

                context.Defects.Add(defect);
                await context.SaveChangesAsync();
                return Results.Created($"/api/defects/{defect.Id}", defect.ToDefectDTO());
            })
            .WithName("CreateDefect")
            .Produces(StatusCodes.Status201Created)
            .RequireAuthorization();

        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                int id,
                [FromBody] UpdateDefectDTO dto) =>
            {
                var defect = await context.Defects.FindAsync(id);
                if (defect is null)
                {
                    return Results.NotFound();
                }

                defect.UpdateDefect(dto);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateDefect")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);
        
        group.MapDelete("/{id}", async (
            [FromServices] ApplicationDbContext context,
            int id) =>
        {
            var defect = await context.Defects.FindAsync(id);
            if (defect is null)
            {
                return Results.NotFound();
            }
            
            context.Defects.Remove(defect);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteDefect")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}