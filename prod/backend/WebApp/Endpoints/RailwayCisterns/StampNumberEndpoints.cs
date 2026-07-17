using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class StampNumberEndpoints
{
    public static void MapStampNumberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/stamp-numbers")
            .RequireAuthorization()
            .WithTags("stamp-numbers");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var numbers = await context.Set<StampNumber>()
                .Select(s => new StampNumberDTO
                {
                    Id = s.Id,
                    Value = s.Value
                })
                .ToListAsync();
            return Results.Ok(numbers);
        })
        .WithName("GetStampNumbers")
        .Produces<List<StampNumberDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var number = await context.Set<StampNumber>()
                .Where(s => s.Id == id)
                .Select(s => new StampNumberDTO
                {
                    Id = s.Id,
                    Value = s.Value
                })
                .FirstOrDefaultAsync();
            return number is null ? Results.NotFound() : Results.Ok(number);
        })
        .WithName("GetStampNumberById")
        .Produces<StampNumberDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateStampNumberDTO dto) =>
        {
            var number = new StampNumber
            {
                Value = dto.Value
            };

            context.Add(number);
            await context.SaveChangesAsync();

            return Results.Created($"/api/stamp-numbers/{number.Id}", new StampNumberDTO
            {
                Id = number.Id,
                Value = number.Value
            });
        })
        .WithName("CreateStampNumber")
        .Produces<StampNumberDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateStampNumberDTO dto) =>
        {
            var number = await context.Set<StampNumber>().FindAsync(id);
            if (number == null)
                return Results.NotFound();

            number.Value = dto.Value;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateStampNumber")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var number = await context.Set<StampNumber>().FindAsync(id);
            if (number == null)
                return Results.NotFound();

            context.Remove(number);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteStampNumber")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
