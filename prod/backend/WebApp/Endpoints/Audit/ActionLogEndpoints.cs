using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.DTO.Audit;
using WebApp.Extensions;

namespace WebApp.Endpoints.Audit;

public record ActionLogPagedResponse(
    List<ActionLogDTO> Items,
    int TotalCount,
    int TotalPages,
    int CurrentPage,
    int PageSize);

public static class ActionLogEndpoints
{
    public static void MapActionLogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ActionLog")
            .RequireAuthorization()
            .WithTags("ActionLog");

        group.MapGet("/", async (
            [FromServices] ApplicationDbContext context,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50) =>
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;

            var query = context.Set<WebApp.Data.Entities.Audit.ActionLog>()
                .AsNoTracking()
                .OrderByDescending(a => a.DateTime);

            var totalCount = await query.CountAsync();
            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)pageSize));
            if (page > totalPages) page = totalPages;

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => a.ToActionLogDTO())
                .ToListAsync();

            return Results.Ok(new ActionLogPagedResponse(
                items,
                totalCount,
                totalPages,
                page,
                pageSize));
        })
        .RequirePermissions(WebApp.Data.Enums.Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
        {
            var item = await context.Set<WebApp.Data.Entities.Audit.ActionLog>()
                .AsNoTracking()
                .Where(a => a.Id == id)
                .Select(a => a.ToActionLogDTO())
                .FirstOrDefaultAsync();
            return item is null ? Results.NotFound() : Results.Ok(item);
        })
        .RequirePermissions(WebApp.Data.Enums.Permission.Read);
    }
}
