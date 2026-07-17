using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class ManufacturerEndpoints
{
    public static void MapManufacturerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/manufacturers")
            .RequireAuthorization()
            .WithTags("manufacturers");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var manufacturers = await context.Set<Manufacturer>()
                .Select(m => new ManufacturerDTO
                {
                    Id = m.Id,
                    Name = m.Name,
                    Country = m.Country,
                    ShortName = m.ShortName,
                    Code = m.Code,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt
                })
                .ToListAsync();
            return Results.Ok(manufacturers);
        })
        .WithName("GetManufacturers")
        .Produces<List<ManufacturerDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var manufacturer = await context.Set<Manufacturer>()
                .Where(m => m.Id == id)
                .Select(m => new ManufacturerDTO
                {
                    Id = m.Id,
                    Name = m.Name,
                    Country = m.Country,
                    ShortName = m.ShortName,
                    Code = m.Code,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt
                })
                .FirstOrDefaultAsync();
            return manufacturer is null ? Results.NotFound() : Results.Ok(manufacturer);
        })
        .WithName("GetManufacturerById")
        .Produces<ManufacturerDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateManufacturerDTO dto, HttpContext httpContext) =>
        {
            var manufacturer = new Manufacturer
            {
                Name = dto.Name,
                Country = dto.Country,
                ShortName = dto.ShortName,
                Code = dto.Code,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                CreatorId = httpContext.User.FindFirstValue("userId")
            };

            context.Add(manufacturer);
            await context.SaveChangesAsync();

            return Results.Created($"/api/manufacturers/{manufacturer.Id}", new ManufacturerDTO
            {
                Id = manufacturer.Id,
                Name = manufacturer.Name,
                Country = manufacturer.Country,
                ShortName = manufacturer.ShortName,
                Code = manufacturer.Code,
                CreatedAt = manufacturer.CreatedAt,
                UpdatedAt = manufacturer.UpdatedAt
            });
        })
        .WithName("CreateManufacturer")
        .Produces<ManufacturerDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateManufacturerDTO dto) =>
        {
            var manufacturer = await context.Set<Manufacturer>().FindAsync(id);
            if (manufacturer == null)
                return Results.NotFound();

            manufacturer.Name = dto.Name;
            manufacturer.Country = dto.Country;
            manufacturer.ShortName = dto.ShortName;
            manufacturer.Code = dto.Code;
            manufacturer.UpdatedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateManufacturer")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var manufacturer = await context.Set<Manufacturer>().FindAsync(id);
            if (manufacturer == null)
                return Results.NotFound();

            context.Remove(manufacturer);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteManufacturer")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
