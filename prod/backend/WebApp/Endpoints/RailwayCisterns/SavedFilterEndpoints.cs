using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using System.Text.Json.Serialization;

namespace WebApp.Endpoints.RailwayCisterns;

public static class SavedFilterEndpoints
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    public static void MapSavedFilterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/saved-filters")
            .RequireAuthorization()
            .WithTags("saved-filters");

        // Get all filters for current user
        group.MapGet("/", async (
                [FromServices] ApplicationDbContext context,
                HttpContext httpContext) =>
            {
                var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
                var filters = await context.Set<SavedFilter>()
                    .Include(f => f.FilterType)
                    .Where(f => f.UserId == userId)
                    .ToListAsync();

                var result = new List<SavedFilterDTO>();
                foreach (var f in filters)
                {
                    var dto = new SavedFilterDTO
                    {
                        Id = f.Id,
                        Name = f.Name,
                        UserId = f.UserId,
                        FilterTypeId = f.FilterTypeId,
                        FilterType = new FilterTypeDTO 
                        { 
                            Id = f.FilterType.Id, 
                            Name = f.FilterType.Name 
                        },
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    };

                    if (!string.IsNullOrEmpty(f.FilterJson))
                    {
                        // Support for all filter types: RailwayCisterns, Parts, RepairsIn, RepairsOut, RepairsMatching
                        dto.Filters = JsonSerializer.Deserialize<Dictionary<string, object>>(f.FilterJson, JsonOptions);
                    }

                    if (!string.IsNullOrEmpty(f.SortFieldsJson))
                    {
                        dto.SortFields = JsonSerializer.Deserialize<List<SortCriteria>>(f.SortFieldsJson, JsonOptions);
                    }

                    if (!string.IsNullOrEmpty(f.SelectedColumnsJson))
                    {
                        dto.SelectedColumns = JsonSerializer.Deserialize<List<string>>(f.SelectedColumnsJson, JsonOptions);
                    }

                    result.Add(dto);
                }

                return Results.Ok(result);
            })
            .WithName("GetSavedFilters")
            .Produces<List<SavedFilterDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get filter by ID
        group.MapGet("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                HttpContext httpContext) =>
            {
                var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
                var filter = await context.Set<SavedFilter>()
                    .Include(f => f.FilterType)
                    .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

                if (filter == null)
                    return Results.NotFound();

                var result = new SavedFilterDTO
                {
                    Id = filter.Id,
                    Name = filter.Name,
                    UserId = filter.UserId,
                    FilterTypeId = filter.FilterTypeId,
                    FilterType = new FilterTypeDTO 
                    { 
                        Id = filter.FilterType.Id, 
                        Name = filter.FilterType.Name 
                    },
                    CreatedAt = filter.CreatedAt,
                    UpdatedAt = filter.UpdatedAt
                };

                if (!string.IsNullOrEmpty(filter.FilterJson))
                {
                    result.Filters = JsonSerializer.Deserialize<Dictionary<string, object>>(filter.FilterJson, JsonOptions);
                }

                if (!string.IsNullOrEmpty(filter.SortFieldsJson))
                {
                    result.SortFields = JsonSerializer.Deserialize<List<SortCriteria>>(filter.SortFieldsJson, JsonOptions);
                }

                if (!string.IsNullOrEmpty(filter.SelectedColumnsJson))
                {
                    result.SelectedColumns = JsonSerializer.Deserialize<List<string>>(filter.SelectedColumnsJson, JsonOptions);
                }

                return Results.Ok(result);
            })
            .WithName("GetSavedFilterById")
            .Produces<SavedFilterDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        // Create new filter
        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateSavedFilterDTO dto,
                HttpContext httpContext) =>
            {
                var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
                
                var filterType = await context.Set<FilterType>()
                    .FirstOrDefaultAsync(ft => ft.Id == dto.FilterTypeId);
                    
                if (filterType == null)
                    return Results.NotFound("Filter type not found");

                var filter = new SavedFilter
                {
                    Id = Guid.NewGuid(),
                    Name = dto.Name,
                    FilterJson = JsonSerializer.Serialize(dto.Filters),
                    SortFieldsJson = JsonSerializer.Serialize(dto.SortFields),
                    SelectedColumnsJson = JsonSerializer.Serialize(dto.SelectedColumns),
                    UserId = userId,
                    FilterTypeId = dto.FilterTypeId,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                };

                context.Add(filter);
                await context.SaveChangesAsync();

                var result = new SavedFilterDTO
                {
                    Id = filter.Id,
                    Name = filter.Name,
                    Filters = dto.Filters,
                    SortFields = dto.SortFields,
                    SelectedColumns = dto.SelectedColumns,
                    UserId = filter.UserId,
                    FilterTypeId = filter.FilterTypeId,
                    FilterType = new FilterTypeDTO 
                    { 
                        Id = filterType.Id, 
                        Name = filterType.Name 
                    },
                    CreatedAt = filter.CreatedAt,
                    UpdatedAt = filter.UpdatedAt
                };

                return Results.Created($"/api/saved-filters/{filter.Id}", result);
            })
            .WithName("CreateSavedFilter")
            .Produces<SavedFilterDTO>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Create);

        // Update filter
        group.MapPut("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                [FromBody] UpdateSavedFilterDTO dto,
                HttpContext httpContext) =>
            {
                var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
                var filter = await context.Set<SavedFilter>()
                    .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

                if (filter == null)
                    return Results.NotFound();

                var filterType = await context.Set<FilterType>()
                    .FirstOrDefaultAsync(ft => ft.Id == dto.FilterTypeId);
                    
                if (filterType == null)
                    return Results.NotFound("Filter type not found");

                filter.Name = dto.Name;
                filter.FilterJson = JsonSerializer.Serialize(dto.Filters);
                filter.SortFieldsJson = JsonSerializer.Serialize(dto.SortFields);
                filter.SelectedColumnsJson = JsonSerializer.Serialize(dto.SelectedColumns);
                filter.FilterTypeId = dto.FilterTypeId;
                filter.UpdatedAt = DateTimeOffset.UtcNow;

                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("UpdateSavedFilter")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Update);

        // Get filters by type
        group.MapGet("/by-type/{typeId}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid typeId,
                HttpContext httpContext) =>
            {
                var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
                var filters = await context.Set<SavedFilter>()
                    .Include(f => f.FilterType)
                    .Where(f => f.UserId == userId && f.FilterTypeId == typeId)
                    .ToListAsync();

                var result = new List<SavedFilterDTO>();
                foreach (var f in filters)
                {
                    var dto = new SavedFilterDTO
                    {
                        Id = f.Id,
                        Name = f.Name,
                        UserId = f.UserId,
                        FilterTypeId = f.FilterTypeId,
                        FilterType = new FilterTypeDTO 
                        { 
                            Id = f.FilterType.Id, 
                            Name = f.FilterType.Name 
                        },
                        CreatedAt = f.CreatedAt,
                        UpdatedAt = f.UpdatedAt
                    };

                    if (!string.IsNullOrEmpty(f.FilterJson))
                    {
                        // Support for all filter types: RailwayCisterns, Parts, RepairsIn, RepairsOut, RepairsMatching
                        dto.Filters = JsonSerializer.Deserialize<Dictionary<string, object>>(f.FilterJson, JsonOptions);
                    }

                    if (!string.IsNullOrEmpty(f.SortFieldsJson))
                    {
                        dto.SortFields = JsonSerializer.Deserialize<List<SortCriteria>>(f.SortFieldsJson, JsonOptions);
                    }

                    if (!string.IsNullOrEmpty(f.SelectedColumnsJson))
                    {
                        dto.SelectedColumns = JsonSerializer.Deserialize<List<string>>(f.SelectedColumnsJson, JsonOptions);
                    }

                    result.Add(dto);
                }

                return Results.Ok(result);
            })
            .WithName("GetFiltersByType")
            .Produces<List<SavedFilterDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Delete filter
        group.MapDelete("/{id}", async (
                [FromServices] ApplicationDbContext context,
                [FromRoute] Guid id,
                HttpContext httpContext) =>
            {
                var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
                var filter = await context.Set<SavedFilter>()
                    .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

                if (filter == null)
                    return Results.NotFound();

                context.Remove(filter);
                await context.SaveChangesAsync();
                return Results.NoContent();
            })
            .WithName("DeleteSavedFilter")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}
