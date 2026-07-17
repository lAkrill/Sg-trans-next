using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RegistrarEndpoints
{
    public static void MapRegistrarEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/registrars")
            .RequireAuthorization()
            .WithTags("registrars");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var registrars = await context.Set<Registrar>()
                .Select(r => new RegistrarDTO
                {
                    Id = r.Id,
                    Name = r.Name
                })
                .ToListAsync();
            return Results.Ok(registrars);
        })
        .WithName("GetRegistrars")
        .Produces<List<RegistrarDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var registrar = await context.Set<Registrar>()
                .Where(r => r.Id == id)
                .Select(r => new RegistrarDTO
                {
                    Id = r.Id,
                    Name = r.Name
                })
                .FirstOrDefaultAsync();
            return registrar is null ? Results.NotFound() : Results.Ok(registrar);
        })
        .WithName("GetRegistrarById")
        .Produces<RegistrarDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateRegistrarDTO dto) =>
        {
            var registrar = new Registrar
            {
                Name = dto.Name
            };

            context.Add(registrar);
            await context.SaveChangesAsync();

            return Results.Created($"/api/registrars/{registrar.Id}", new RegistrarDTO
            {
                Id = registrar.Id,
                Name = registrar.Name
            });
        })
        .WithName("CreateRegistrar")
        .Produces<RegistrarDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateRegistrarDTO dto) =>
        {
            var registrar = await context.Set<Registrar>().FindAsync(id);
            if (registrar == null)
                return Results.NotFound();

            registrar.Name = dto.Name;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateRegistrar")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var registrar = await context.Set<Registrar>().FindAsync(id);
            if (registrar == null)
                return Results.NotFound();

            context.Remove(registrar);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteRegistrar")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
