using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class AffiliationEndpoints
{
    public static void MapAffiliationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/affiliations")
            .RequireAuthorization()
            .WithTags("affiliations");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var affiliations = await context.Set<Affiliation>()
                .Select(a => new AffiliationDTO
                {
                    Id = a.Id,
                    Value = a.Value
                })
                .ToListAsync();
            return Results.Ok(affiliations);
        })
        .WithName("GetAffiliations")
        .Produces<List<AffiliationDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var affiliation = await context.Set<Affiliation>()
                .Where(a => a.Id == id)
                .Select(a => new AffiliationDTO
                {
                    Id = a.Id,
                    Value = a.Value
                })
                .FirstOrDefaultAsync();
            return affiliation is null ? Results.NotFound() : Results.Ok(affiliation);
        })
        .WithName("GetAffiliationById")
        .Produces<AffiliationDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateAffiliationDTO dto) =>
        {
            var affiliation = new Affiliation
            {
                Value = dto.Value
            };

            context.Add(affiliation);
            await context.SaveChangesAsync();

            return Results.Created($"/api/affiliations/{affiliation.Id}", new AffiliationDTO
            {
                Id = affiliation.Id,
                Value = affiliation.Value
            });
        })
        .WithName("CreateAffiliation")
        .Produces<AffiliationDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateAffiliationDTO dto) =>
        {
            var affiliation = await context.Set<Affiliation>().FindAsync(id);
            if (affiliation == null)
                return Results.NotFound();

            affiliation.Value = dto.Value;
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateAffiliation")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var affiliation = await context.Set<Affiliation>().FindAsync(id);
            if (affiliation == null)
                return Results.NotFound();

            context.Remove(affiliation);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteAffiliation")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
