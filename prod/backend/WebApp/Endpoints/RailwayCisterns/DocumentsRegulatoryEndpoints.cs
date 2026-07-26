using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class DocumentsRegulatoryEndpoints
{
    public static void MapDocumentsRegulatoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/documents-regulatory")
            .RequireAuthorization()
            .WithTags("documents-regulatory");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var items = await context.DocumentsRegulatory
                .AsNoTracking()
                .Select(x => x.ToDocumentsRegulatoryDto())
                .ToListAsync();

            return Results.Ok(items);
        })
        .WithName("GetDocumentsRegulatory")
        .Produces<List<DocumentsRegulatoryDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var item = await context.DocumentsRegulatory
                .AsNoTracking()
                .Where(x => x.Id == id)
                .Select(x => x.ToDocumentsRegulatoryDto())
                .FirstOrDefaultAsync();

            return item is null ? Results.NotFound() : Results.Ok(item);
        })
        .WithName("GetDocumentsRegulatoryById")
        .Produces<DocumentsRegulatoryDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateDocumentsRegulatoryDTO dto, HttpContext httpContext) =>
        {
            var userIdString = httpContext.User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var creatorId))
                return Results.BadRequest();

            var item = dto.ToDocumentsRegulatory(creatorId);
            context.DocumentsRegulatory.Add(item);
            await context.SaveChangesAsync();

            return Results.Created($"/api/documents-regulatory/{item.Id}", item.ToDocumentsRegulatoryDto());
        })
        .WithName("CreateDocumentsRegulatory")
        .Produces<DocumentsRegulatoryDTO>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateDocumentsRegulatoryDTO dto) =>
        {
            var item = await context.DocumentsRegulatory.FindAsync(id);
            if (item is null)
                return Results.NotFound();

            item.UpdateDocumentsRegulatory(dto);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateDocumentsRegulatory")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var item = await context.DocumentsRegulatory.FindAsync(id);
            if (item is null)
                return Results.NotFound();

            context.DocumentsRegulatory.Remove(item);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteDocumentsRegulatory")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
