using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.DTO.Audit;
using WebApp.Extensions;

namespace WebApp.Endpoints.Audit;

public static class ActionLogEndpoints
{
    public static void MapActionLogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ActionLog")
            .RequireAuthorization()
            .WithTags("ActionLog");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
        {
            var items = await context.Set<WebApp.Data.Entities.Audit.ActionLog>()
                .AsNoTracking()
                .OrderByDescending(a => a.DateTime)
                .Skip(skip).Take(take)
                .Select(a => a.ToActionLogDTO())
                .ToListAsync();
            return Results.Ok(items);
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
