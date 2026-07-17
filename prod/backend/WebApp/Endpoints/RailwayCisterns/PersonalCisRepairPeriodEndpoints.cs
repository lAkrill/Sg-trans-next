using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Security.Claims;

namespace WebApp.Endpoints.RailwayCisterns;

public static class PersonalCisRepairPeriodEndpoints
{
    public static void MapPersonalCisRepairPeriodEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/personal-cis-repair-periods")
            .RequireAuthorization()
            .WithTags("personal-cis-repair-periods");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var periods = await context.PersonalCisRepairPeriods
                .Select(p => p.ToPersonalCisRepairPeriodDTO())
                .ToListAsync();
            return Results.Ok(periods);
        })
        .WithName("GetPersonalCisRepairPeriods")
        .Produces<List<PersonalCisRepairPeriodDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var period = await context.PersonalCisRepairPeriods
                .Where(p => p.Id == id)
                .Select(p => p.ToPersonalCisRepairPeriodDTO())
                .FirstOrDefaultAsync();
            return period is null ? Results.NotFound() : Results.Ok(period);
        })
        .WithName("GetPersonalCisRepairPeriodById")
        .Produces<PersonalCisRepairPeriodDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreatePersonalCisRepairPeriodDTO dto, HttpContext httpContext) =>
        {
            Guid creator = Guid.Parse(httpContext.User.FindFirstValue("userId"));
            var period = dto.ToPersonalCisRepairPeriod(creator);

            context.Add(period);
            await context.SaveChangesAsync();

            return Results.Created($"/api/personal-cis-repair-periods/{period.Id}", period.ToPersonalCisRepairPeriodDTO());
        })
        .WithName("CreatePersonalCisRepairPeriod")
        .Produces<PersonalCisRepairPeriodDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdatePersonalCisRepairPeriodDTO dto) =>
        {
            var period = await context.PersonalCisRepairPeriods.FindAsync(id);
            if (period == null)
                return Results.NotFound();

            period.UpdatePersonalCisRepairPeriod(dto);

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdatePersonalCisRepairPeriod")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var period = await context.PersonalCisRepairPeriods.FindAsync(id);
            if (period == null)
                return Results.NotFound();

            context.Remove(period);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeletePersonalCisRepairPeriod")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
