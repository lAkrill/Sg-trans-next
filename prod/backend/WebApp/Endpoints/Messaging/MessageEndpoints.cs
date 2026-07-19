using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.Messaging;
using WebApp.Data.Enums;
using WebApp.DTO.Messaging;
using WebApp.Extensions;

namespace WebApp.Endpoints.Messaging;

public static class MessageEndpoints
{
    public static void MapMessageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/Messages")
            .RequireAuthorization()
            .WithTags("Messages");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
        {
            if (take < 0) return Results.BadRequest();
            var msgs = await context.Set<Message>()
                .AsNoTracking()
                .OrderByDescending(m => m.CreationDate)
                .Skip(skip).Take(take)
                .Select(m => m.ToMessageDTO())
                .ToListAsync();
            return Results.Ok(msgs);
        })
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
        {
            var msg = await context.Set<Message>()
                .AsNoTracking()
                .Where(m => m.Id == id)
                .Select(m => m.ToMessageDTO())
                .FirstOrDefaultAsync();
            return msg is null ? Results.NotFound() : Results.Ok(msg);
        })
        .RequirePermissions(Permission.Read);

        group.MapGet("/byUser/{userId}", async ([FromServices] ApplicationDbContext context, Guid userId, [FromQuery] int skip = 0, [FromQuery] int take = 50) =>
        {
            if (take < 0) return Results.BadRequest();
            var msgs = await context.Set<Message>()
                .AsNoTracking()
                .Where(m => m.ToUserId == userId || m.FromUserId == userId)
                .OrderByDescending(m => m.CreationDate)
                .Skip(skip).Take(take)
                .Select(m => m.ToMessageDTO())
                .ToListAsync();
            return Results.Ok(msgs);
        })
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateMessageDTO dto) =>
        {
            var msg = dto.ToMessage();
            context.Set<Message>().Add(msg);
            await context.SaveChangesAsync();
            return Results.Created($"/api/Messages/{msg.Id}", msg.ToMessageDTO());
        })
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, Guid id, [FromBody] UpdateMessageDTO dto) =>
        {
            var msg = await context.Set<Message>().FindAsync(id);
            if (msg is null) return Results.NotFound();
            msg.UpdateMessage(dto);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Update);

        group.MapPatch("/{id}/status", async ([FromServices] ApplicationDbContext context, Guid id, [FromBody] int status) =>
        {
            var msg = await context.Set<Message>().FindAsync(id);
            if (msg is null) return Results.NotFound();
            msg.Status = status;
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Update);

        group.MapPatch("/{id}/priority", async ([FromServices] ApplicationDbContext context, Guid id, [FromBody] int priority) =>
        {
            var msg = await context.Set<Message>().FindAsync(id);
            if (msg is null) return Results.NotFound();
            msg.Priority = priority;
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Update);

        group.MapPatch("/{id}/text", async ([FromServices] ApplicationDbContext context, Guid id, [FromBody] string text) =>
        {
            var msg = await context.Set<Message>().FindAsync(id);
            if (msg is null) return Results.NotFound();
            msg.Text = text;
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
        {
            var msg = await context.Set<Message>().FindAsync(id);
            if (msg is null) return Results.NotFound();
            context.Remove(msg);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequirePermissions(Permission.Delete);
    }
}
