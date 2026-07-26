using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class DocumentEndpoints
{
    public static void MapDocumentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/documents")
            .RequireAuthorization()
            .WithTags("documents");

        // Получение списка документов с пагинацией
        group.MapGet("/", async (
            [FromServices] ApplicationDbContext context,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10) =>
        {
            var parameters = new PaginationParameters
            {
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var query = context.Documents.AsQueryable();

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize);

            var documents = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .Select(d => new DocumentDTO
                {
                    Id = d.Id,
                    Number = d.Number,
                    Type = d.Type,
                    Date = d.Date,
                    Author = d.Author,
                    Price = d.Price,
                    Note = d.Note
                })
                .ToListAsync();

            var result = new PaginatedList<DocumentDTO>
            {
                Items = documents,
                PageNumber = parameters.PageNumber,
                TotalPages = totalPages,
                TotalCount = totalCount,
                PageSize = parameters.PageSize
            };

            return Results.Ok(result);
        })
        .Produces<PaginatedList<DocumentDTO>>()
        .RequirePermissions(Permission.Read);

        // Получение списка документов
        group.MapGet("/all/", async (
            [FromServices] ApplicationDbContext context) =>
        {
            var query = context.Documents.AsQueryable();

            var documents = await query
                .Select(d => new DocumentDTO
                {
                    Id = d.Id,
                    Number = d.Number,
                    Type = d.Type,
                    Date = d.Date,
                    Author = d.Author,
                    Price = d.Price,
                    Note = d.Note
                })
                .ToListAsync();

            return Results.Ok(documents);
        })
        .Produces<List<DocumentDTO>>()
        .RequirePermissions(Permission.Read);

        // Получение документа по ID
        group.MapGet("/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id) =>
        {
            var document = await context.Documents
                .Where(d => d.Id == id)
                .Select(d => new DocumentDTO
                {
                    Id = d.Id,
                    Number = d.Number,
                    Type = d.Type,
                    Date = d.Date,
                    Author = d.Author,
                    Price = d.Price,
                    Note = d.Note
                })
                .FirstOrDefaultAsync();

            return document is null ? Results.NotFound() : Results.Ok(document);
        })
        .Produces<DocumentDTO>()
        .RequirePermissions(Permission.Read);

        // Создание документа
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateDocumentDTO dto) =>
        {
            var document = new Document
            {
                Id = Guid.NewGuid(),
                Number = dto.Number,
                Type = dto.Type,
                Date = dto.Date,
                Author = dto.Author,
                Price = dto.Price,
                Note = dto.Note,
                File = dto.File
            };

            context.Documents.Add(document);
            await context.SaveChangesAsync();

            return Results.Created($"/api/documents/{document.Id}", document.Id);
        })
        .RequirePermissions(Permission.Create);

        // Обновление документа
        group.MapPut("/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdateDocumentDTO dto) =>
        {
            var document = await context.Documents.FindAsync(id);
            if (document is null)
                return Results.NotFound();

            document.Number = dto.Number;
            document.Type = dto.Type;
            document.Date = dto.Date;
            document.Author = dto.Author;
            document.Price = dto.Price;
            document.Note = dto.Note;
            document.File = dto.File;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Update);

        // Удаление документа
        group.MapDelete("/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id) =>
        {
            var document = await context.Documents.FindAsync(id);
            if (document is null)
                return Results.NotFound();

            context.Documents.Remove(document);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Delete);
    }
}
