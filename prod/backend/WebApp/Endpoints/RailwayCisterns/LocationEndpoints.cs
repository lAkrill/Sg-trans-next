using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/locations")
            .RequireAuthorization()
            .WithTags("locations");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var locations = await context.Set<Location>()
                .Select(l => new LocationDTO
                {
                    Id = l.Id,
                    Name = l.Name,
                    Type = l.Type,
                    Description = l.Description,
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync();
            return Results.Ok(locations);
        })
        .WithName("GetLocations")
        .Produces<List<LocationDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var location = await context.Set<Location>()
                .Where(l => l.Id == id)
                .Select(l => new LocationDTO
                {
                    Id = l.Id,
                    Name = l.Name,
                    Type = l.Type,
                    Description = l.Description,
                    CreatedAt = l.CreatedAt
                })
                .FirstOrDefaultAsync();
            return location is null ? Results.NotFound() : Results.Ok(location);
        })
        .WithName("GetLocationById")
        .Produces<LocationDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapGet("/by-type/{type}", async ([FromServices] ApplicationDbContext context, [FromRoute] LocationType type) =>
        {
            var locations = await context.Set<Location>()
                .Where(l => l.Type == type)
                .Select(l => new LocationDTO
                {
                    Id = l.Id,
                    Name = l.Name,
                    Type = l.Type,
                    Description = l.Description,
                    CreatedAt = l.CreatedAt
                })
                .ToListAsync();
            return Results.Ok(locations);
        })
        .WithName("GetLocationsByType")
        .Produces<List<LocationDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateLocationDTO dto, HttpContext httpContext) =>
        {
            var location = new Location
            {
                Name = dto.Name,
                Type = dto.Type,
                Description = dto.Description,
                CreatedAt = DateTime.Now,
                CreatorId = httpContext.User.FindFirstValue("userId")
            };

            context.Add(location);
            await context.SaveChangesAsync();

            return Results.Created($"/api/locations/{location.Id}", new LocationDTO
            {
                Id = location.Id,
                Name = location.Name,
                Type = location.Type,
                Description = location.Description,
                CreatedAt = location.CreatedAt
            });
        })
        .WithName("CreateLocation")
        .Produces<LocationDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateLocationDTO dto) =>
        {
            var location = await context.Set<Location>().FindAsync(id);
            if (location == null)
                return Results.NotFound();

            location.Name = dto.Name;
            location.Type = dto.Type;
            location.Description = dto.Description;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateLocation")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var location = await context.Set<Location>().FindAsync(id);
            if (location == null)
                return Results.NotFound();

            context.Remove(location);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteLocation")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
