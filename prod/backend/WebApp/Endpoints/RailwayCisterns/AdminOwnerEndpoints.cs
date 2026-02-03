using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class AdminOwnerEndpoints
{
    public static void MapAdminOwnerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin-owner")
            .RequireAuthorization()
            .WithTags("AdminOwner");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context) =>
            {
                var adminOwners = await context.AdminOwners
                    .Select(a => a.ToAdminOwnerDTO())
                    .ToListAsync();
                return Results.Ok(adminOwners);
            })
            .WithName("GetAdminOwners")
            .Produces<List<AdminOwnerDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context,
                int id) =>
            {
                var adminOwner = context.AdminOwners
                    .Where(a => a.Id == id)
                    .Select(a => a.ToAdminOwnerDTO())
                    .FirstOrDefault();

                return adminOwner is null ? Results.NotFound() : Results.Ok(adminOwner);
            })
            .WithName("GetAdminOwnerById")
            .Produces<AdminOwnerDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateAdminOwnerDTO dto) =>
            {
                var adminOwner = dto.ToAdminOwner();

                context.AdminOwners.Add(adminOwner);
                await context.SaveChangesAsync();
                return Results.Created($"/api/admin-owners/{adminOwner.Id}", adminOwner.ToAdminOwnerDTO()); 
            })
        .WithName("CreateAdminOwner")
        .Produces<AdminOwnerDTO>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .RequirePermissions(Permission.Create);
        
        group.MapPut("/{id}", async (
            [FromServices] ApplicationDbContext context,
            int id,
            [FromBody] UpdateAdminOwnerDTO dto) =>
        {
            var adminOwner = await context.AdminOwners.FindAsync(id);
            if (adminOwner is null)
                return Results.NotFound();
            
            adminOwner.UpdateAdminOwner(dto);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateAdminOwner")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);
        
        group.MapDelete("/{id}", async (
            [FromServices] ApplicationDbContext context,
            int id) =>
        {
            var adminOwner = await context.AdminOwners.FindAsync(id);
            if (adminOwner is null)
                return Results.NotFound();
            
            context.AdminOwners.Remove(adminOwner);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteAdminOwner")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}