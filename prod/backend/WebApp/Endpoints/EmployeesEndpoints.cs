using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.Users;
using WebApp.Data.Enums;
using WebApp.DTO.Employees;
using WebApp.Extensions;

namespace WebApp.Endpoints;

public static class EmployeesEndpoints
{
    public static void MapEmployeeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/employees")
            .RequireAuthorization()
            .WithTags("employees");

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var employees = await context.Employees
                .Select(e => e.ToEmployeeDTO())
                .ToListAsync();
            return Results.Ok(employees);
        })
        .WithName("GetEmployees")
        .Produces<List<EmployeeDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var employee = await context.Employees
                .Where(e => e.Id == id)
                .Select(e => e.ToEmployeeDTO())
                .FirstOrDefaultAsync();

            return employee is null ? Results.NotFound() : Results.Ok(employee);
        })
        .WithName("GetEmployeeById")
        .Produces<EmployeeDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context, [FromBody] CreateEmployeeDTO dto, HttpContext httpContext) =>
        {
            var employee = new Employee
            {
                Id = Guid.NewGuid(),
                LastName = dto.LastName,
                FirstName = dto.FirstName,
                Patronymic = dto.Patronymic,
                Initials = dto.Initials,
                Position = dto.Position,
                UpdatedAt = DateTime.Now,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId") ?? Guid.Empty.ToString())
            };

            context.Add(employee);
            await context.SaveChangesAsync();

            return Results.Created($"/api/employees/{employee.Id}", employee.ToEmployeeDTO());
        })
        .WithName("CreateEmployee")
        .Produces<EmployeeDTO>(StatusCodes.Status201Created)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id, [FromBody] UpdateEmployeeDTO dto) =>
        {
            var employee = await context.Employees.FindAsync(id);
            if (employee is null)
                return Results.NotFound();

            employee.UpdateEmployee(dto);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateEmployee")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem()
        .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] Guid id) =>
        {
            var employee = await context.Employees.FindAsync(id);
            if (employee is null)
                return Results.NotFound();

            context.Remove(employee);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeleteEmployee")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Delete);
    }
}
