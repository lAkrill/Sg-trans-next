using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class OwnerEndpoints
{
    public static void MapOwnerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/owners")
            .RequireAuthorization()
            .WithTags("owners");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var owners = await context.Set<Owner>()
                .Select(o => new OwnerDTO
                {
                    Id = o.Id,
                    Name = o.Name,
                    UNP = o.UNP,
                    ShortName = o.ShortName,
                    Address = o.Address,
                    TreatRepairs = o.TreatRepairs,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt
                })
                .ToListAsync();
            return Results.Ok(owners);
        })
        .WithName("GetOwners")
        .Produces<List<OwnerDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var owner = await context.Set<Owner>()
                .Where(o => o.Id == id)
                .Select(o => new OwnerDTO
                {
                    Id = o.Id,
                    Name = o.Name,
                    UNP = o.UNP,
                    ShortName = o.ShortName,
                    Address = o.Address,
                    TreatRepairs = o.TreatRepairs,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt
                })
                .FirstOrDefaultAsync();
            return owner is null ? Results.NotFound() : Results.Ok(owner);
        })
        .WithName("GetOwnerById")
        .Produces<OwnerDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapGet("/with-cisterns", async ([FromServices] ApplicationDbContext context) =>
        {
            var owners = await context.Set<Owner>()
                .Include(o => o.RailwayCisterns)
                .Select(o => new OwnerWithCisternsDTO
                {
                    Id = o.Id,
                    Name = o.Name,
                    UNP = o.UNP,
                    ShortName = o.ShortName,
                    Address = o.Address,
                    TreatRepairs = o.TreatRepairs,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    CisternCount = o.RailwayCisterns.Count
                })
                .ToListAsync();
            return Results.Ok(owners);
        })
        .WithName("GetOwnersWithCisterns")
        .Produces<List<OwnerWithCisternsDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateOwnerDTO dto, HttpContext httpContext) =>
        {
            var owner = new Owner
            {
                Name = dto.Name,
                UNP = dto.UNP,
                ShortName = dto.ShortName,
                Address = dto.Address,
                TreatRepairs = dto.TreatRepairs,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                CreatorId = httpContext.User.FindFirstValue("userId")
            };

            context.Add(owner);
            await context.SaveChangesAsync();

            return Results.Created($"/api/owners/{owner.Id}", new OwnerDTO
            {
                Id = owner.Id,
                Name = owner.Name,
                UNP = owner.UNP,
                ShortName = owner.ShortName,
                Address = owner.Address,
                TreatRepairs = owner.TreatRepairs,
                CreatedAt = owner.CreatedAt,
                UpdatedAt = owner.UpdatedAt
            });
        })
        .WithName("CreateOwner")
        .Produces<OwnerDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateOwnerDTO dto) =>
        {
            var owner = await context.Set<Owner>().FindAsync(id);
            if (owner == null)
                return Results.NotFound();

            owner.Name = dto.Name;
            owner.UNP = dto.UNP;
            owner.ShortName = dto.ShortName;
            owner.Address = dto.Address;
            owner.TreatRepairs = dto.TreatRepairs;
            owner.UpdatedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateOwner")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var owner = await context.Set<Owner>().FindAsync(id);
            if (owner == null)
                return Results.NotFound();

            context.Remove(owner);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteOwner")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
