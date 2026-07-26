using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class DepotEndpoints
{
    public static void MapDepotEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/depots")
            .RequireAuthorization()
            .WithTags("depots");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var depots = await context.Set<Depot>()
                .Select(d => new DepotDTO
                {
                    Id = d.Id,
                    Name = d.Name,
                    Code = d.Code,
                    Location = d.Location,
                    ShortName = d.ShortName,
                    CreatedAt = d.CreatedAt
                })
                .ToListAsync();
            return Results.Ok(depots);
        })
        .WithName("GetDepots")
        .Produces<List<DepotDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var depot = await context.Set<Depot>()
                .Where(d => d.Id == id)
                .Select(d => new DepotDTO
                {
                    Id = d.Id,
                    Name = d.Name,
                    Code = d.Code,
                    Location = d.Location,
                    ShortName = d.ShortName,
                    CreatedAt = d.CreatedAt
                })
                .FirstOrDefaultAsync();
            return depot is null ? Results.NotFound() : Results.Ok(depot);
        })
        .WithName("GetDepotById")
        .Produces<DepotDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateDepotDTO dto, HttpContext httpContext) =>
        {
            var depot = new Depot
            {
                Name = dto.Name,
                Code = dto.Code,
                Location = dto.Location,
                ShortName = dto.ShortName,
                CreatedAt = DateTime.Now,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId"))
            };

            context.Add(depot);
            await context.SaveChangesAsync();

            return Results.Created($"/api/depots/{depot.Id}", new DepotDTO
            {
                Id = depot.Id,
                Name = depot.Name,
                Code = depot.Code,
                Location = depot.Location,
                ShortName = depot.ShortName,
                CreatedAt = depot.CreatedAt
            });
        })
        .WithName("CreateDepot")
        .Produces<DepotDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateDepotDTO dto) =>
        {
            var depot = await context.Set<Depot>().FindAsync(id);
            if (depot == null)
                return Results.NotFound();

            depot.Name = dto.Name;
            depot.Code = dto.Code;
            depot.Location = dto.Location;
            depot.ShortName = dto.ShortName;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateDepot")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var depot = await context.Set<Depot>().FindAsync(id);
            if (depot == null)
                return Results.NotFound();

            context.Remove(depot);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteDepot")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);

        group.MapGet("/search", async ([FromServices] ApplicationDbContext context, [FromQuery] string? searchTerm) =>
        {
            var query = context.Set<Depot>().AsQueryable();
            
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(d => d.ShortName.ToLower().Contains(searchTerm.ToLower()));
            }

            var result = await query
                .Select(d => new
                {
                    Id = d.Id,
                    ShortName = d.ShortName
                })
                .ToListAsync();
            return Results.Ok(result);
        })
        .WithName("SearchDepotsByName")
        .WithOpenApi(operation => 
        {
            operation.Parameters[0].Description = "Поиск по части короткого имени депо (без учета регистра). При пустой строке или отсутствии параметра возвращает все записи.";
            return operation;
        })
        .Produces<List<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
    }
}
