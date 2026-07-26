using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class ScrapmetalEndpoints
{
    public static void MapScrapmetalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/scrapmetal")
            .RequireAuthorization()
            .WithTags("scrapmetal");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var items = await context.Scrapmetals
                .AsNoTracking()
                .Select(x => x.ToScrapmetalDto())
                .ToListAsync();

            return Results.Ok(items);
        })
        .WithName("GetScrapmetals")
        .Produces<List<ScrapmetalDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var item = await context.Scrapmetals
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => x.ToScrapmetalDto())
                .FirstOrDefaultAsync();

            return item is null ? Results.NotFound() : Results.Ok(item);
        })
        .WithName("GetScrapmetalById")
        .Produces<ScrapmetalDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapGet("/by-document/{documentId}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid documentId) =>
        {
            var items = await context.Scrapmetals
                .AsNoTracking()
                .Where(x => x.DocumentId == documentId)
                .Select(x => x.ToScrapmetalDto())
                .ToListAsync();

            return Results.Ok(items);
        })
        .WithName("GetScrapmetalByDocumentId")
        .Produces<List<ScrapmetalDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateScrapmetalDTO dto, HttpContext httpContext) =>
        {
            var userIdString = httpContext.User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                return Results.BadRequest();

            var item = dto.ToScrapmetal(creatorId);
            context.Scrapmetals.Add(item);
            await context.SaveChangesAsync();

            return Results.Created($"/api/scrapmetal/{item.Id}", item.ToScrapmetalDto());
        })
        .WithName("CreateScrapmetal")
        .Produces<ScrapmetalDTO>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateScrapmetalDTO dto) =>
        {
            var item = await context.Scrapmetals.FindAsync(id);
            if (item is null)
                return Results.NotFound();

            item.UpdateScrapmetal(dto);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateScrapmetal")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var item = await context.Scrapmetals.FindAsync(id);
            if (item is null)
                return Results.NotFound();

            context.Scrapmetals.Remove(item);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteScrapmetal")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
