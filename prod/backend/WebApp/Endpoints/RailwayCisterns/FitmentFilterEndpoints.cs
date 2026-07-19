using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class FitmentFilterEndpoints
{
    public static void MapFitmentFilterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/fitments/filter")
            .RequireAuthorization()
            .WithTags("fitments-filter");

        // Фильтрация с пагинацией
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] FitmentFilterSortDTO request) =>
        {
            var query = BuildFilterQuery(context, request.Filters);

            if (request.SortFields != null && request.SortFields.Any())
            {
                var firstSort = request.SortFields.First();
                var orderedQuery = ApplySort(query, firstSort);

                foreach (var sortField in request.SortFields.Skip(1))
                {
                    orderedQuery = ApplyThenBy(orderedQuery, sortField);
                }

                query = orderedQuery;
            }
            else
            {
                query = query.OrderByDescending(f => f.UpdatedAt);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            var fitments = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(f => MapFitmentToDto(f))
                .ToListAsync();

            var result = new PaginatedList<FitmentDTO>
            {
                Items = fitments,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalPages = totalPages,
                TotalCount = totalCount
            };

            return Results.Ok(result);
        })
        .WithName("FilterFitments")
        .Produces<PaginatedList<FitmentDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Фильтрация без пагинации
        group.MapPost("/all", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] FitmentFilterSortWithoutPaginationDTO request) =>
        {
            var query = BuildFilterQuery(context, request.Filters);

            if (request.SortFields != null && request.SortFields.Any())
            {
                var firstSort = request.SortFields.First();
                var orderedQuery = ApplySort(query, firstSort);

                foreach (var sortField in request.SortFields.Skip(1))
                {
                    orderedQuery = ApplyThenBy(orderedQuery, sortField);
                }

                query = orderedQuery;
            }
            else
            {
                query = query.OrderByDescending(f => f.UpdatedAt);
            }

            var fitments = await query
                .Select(f => MapFitmentToDto(f))
                .ToListAsync();

            return Results.Ok(fitments);
        })
        .WithName("FilterAllFitments")
        .Produces<List<FitmentDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
    }

    private static FitmentDTO MapFitmentToDto(Fitment f)
    {
        return new FitmentDTO
        {
            Id = f.Id,
            FitmentTypeId = f.FitmentTypeId,
            SerialNumber = f.SerialNumber,
            PassportNumber = f.PassportNumber,
            BuildDate = f.BuildDate,
            LastRepairDate = f.LastRepairDate,
            PeriodRep = f.PeriodRep,
            ServiceLifeYears = f.ServiceLifeYears,
            ModelId = f.ModelId,
            DepotId = f.DepotId,
            UpdatedAt = f.UpdatedAt,
            CreatorId = f.CreatorId,
            FitmentType = new FitmentTypeDTO
            {
                Id = f.FitmentType.Id,
                Name = f.FitmentType.Name,
                Code = f.FitmentType.Code,
                UpdatedAt = f.FitmentType.UpdatedAt,
                CreatorId = f.FitmentType.CreatorId
            },
            Model = new FitmentModelDTO
            {
                Id = f.Model.Id,
                Name = f.Model.Name,
                UpdatedAt = f.Model.UpdatedAt,
                CreatorId = f.Model.CreatorId
            },
            Depot = new DepotDTO
            {
                Id = f.Depot.Id,
                Name = f.Depot.Name,
                Code = f.Depot.Code,
                ShortName = f.Depot.ShortName,
                Location = f.Depot.Location
            }
        };
    }

    private static IQueryable<Fitment> BuildFilterQuery(ApplicationDbContext context, FitmentFilterCriteria? filters)
    {
        var query = context.Fitments
            .Include(f => f.FitmentType)
            .Include(f => f.Model)
            .Include(f => f.Depot)
            .AsQueryable();

        if (filters == null)
            return query;

        if (filters.FitmentTypeIds != null && filters.FitmentTypeIds.Any())
            query = query.Where(f => filters.FitmentTypeIds.Contains(f.FitmentTypeId));

        if (filters.SerialNumbers != null && filters.SerialNumbers.Any())
            query = query.Where(f => filters.SerialNumbers.Contains(f.SerialNumber));

        if (filters.PassportNumbers != null && filters.PassportNumbers.Any())
            query = query.Where(f => filters.PassportNumbers.Contains(f.PassportNumber));

        if (filters.BuildDate != null)
        {
            if (filters.BuildDate.From.HasValue)
                query = query.Where(f => DateOnly.FromDateTime(f.BuildDate) >= filters.BuildDate.From.Value);
            if (filters.BuildDate.To.HasValue)
                query = query.Where(f => DateOnly.FromDateTime(f.BuildDate) <= filters.BuildDate.To.Value);
        }

        if (filters.LastRepairDate != null)
        {
            if (filters.LastRepairDate.From.HasValue)
                query = query.Where(f => f.LastRepairDate.HasValue && DateOnly.FromDateTime(f.LastRepairDate.Value) >= filters.LastRepairDate.From.Value);
            if (filters.LastRepairDate.To.HasValue)
                query = query.Where(f => f.LastRepairDate.HasValue && DateOnly.FromDateTime(f.LastRepairDate.Value) <= filters.LastRepairDate.To.Value);
        }

        if (filters.PeriodRep != null)
        {
            if (filters.PeriodRep.From.HasValue)
                query = query.Where(f => f.PeriodRep >= filters.PeriodRep.From);
            if (filters.PeriodRep.To.HasValue)
                query = query.Where(f => f.PeriodRep <= filters.PeriodRep.To);
        }

        if (filters.ServiceLifeYears != null)
        {
            if (filters.ServiceLifeYears.From.HasValue)
                query = query.Where(f => f.ServiceLifeYears >= filters.ServiceLifeYears.From);
            if (filters.ServiceLifeYears.To.HasValue)
                query = query.Where(f => f.ServiceLifeYears <= filters.ServiceLifeYears.To);
        }

        if (filters.ModelIds != null && filters.ModelIds.Any())
            query = query.Where(f => filters.ModelIds.Contains(f.ModelId));

        if (filters.DepotIds != null && filters.DepotIds.Any())
            query = query.Where(f => filters.DepotIds.Contains(f.DepotId));

        if (filters.CreatorIds != null && filters.CreatorIds.Any())
            query = query.Where(f => filters.CreatorIds.Contains(f.CreatorId));

        if (filters.UpdatedAt != null)
        {
            if (filters.UpdatedAt.From.HasValue)
                query = query.Where(f => f.UpdatedAt >= filters.UpdatedAt.From);
            if (filters.UpdatedAt.To.HasValue)
                query = query.Where(f => f.UpdatedAt <= filters.UpdatedAt.To);
        }

        return query;
    }

    private static IOrderedQueryable<Fitment> ApplySort(IQueryable<Fitment> query, SortCriteria sort)
    {
        var fieldName = sort.FieldName?.Trim().ToLowerInvariant() ?? string.Empty;

        return fieldName switch
        {
            "fitmententype" or "fitmententypename" => sort.Descending ? query.OrderByDescending(f => f.FitmentType.Name) : query.OrderBy(f => f.FitmentType.Name),
            "serialnumber" => sort.Descending ? query.OrderByDescending(f => f.SerialNumber) : query.OrderBy(f => f.SerialNumber),
            "passportnumber" => sort.Descending ? query.OrderByDescending(f => f.PassportNumber) : query.OrderBy(f => f.PassportNumber),
            "builddate" => sort.Descending ? query.OrderByDescending(f => f.BuildDate) : query.OrderBy(f => f.BuildDate),
            "lastrepairdate" => sort.Descending ? query.OrderByDescending(f => f.LastRepairDate) : query.OrderBy(f => f.LastRepairDate),
            "periodrep" => sort.Descending ? query.OrderByDescending(f => f.PeriodRep) : query.OrderBy(f => f.PeriodRep),
            "servicelifeyears" => sort.Descending ? query.OrderByDescending(f => f.ServiceLifeYears) : query.OrderBy(f => f.ServiceLifeYears),
            "model" or "modelname" => sort.Descending ? query.OrderByDescending(f => f.Model.Name) : query.OrderBy(f => f.Model.Name),
            "depot" or "depotname" => sort.Descending ? query.OrderByDescending(f => f.Depot.Name) : query.OrderBy(f => f.Depot.Name),
            "updatedat" => sort.Descending ? query.OrderByDescending(f => f.UpdatedAt) : query.OrderBy(f => f.UpdatedAt),
            "creatorid" => sort.Descending ? query.OrderByDescending(f => f.CreatorId) : query.OrderBy(f => f.CreatorId),
            _ => query.OrderByDescending(f => f.UpdatedAt)
        };
    }

    private static IOrderedQueryable<Fitment> ApplyThenBy(IOrderedQueryable<Fitment> query, SortCriteria sort)
    {
        var fieldName = sort.FieldName?.Trim().ToLowerInvariant() ?? string.Empty;

        return fieldName switch
        {
            "fitmententype" or "fitmententypename" => sort.Descending ? query.ThenByDescending(f => f.FitmentType.Name) : query.ThenBy(f => f.FitmentType.Name),
            "serialnumber" => sort.Descending ? query.ThenByDescending(f => f.SerialNumber) : query.ThenBy(f => f.SerialNumber),
            "passportnumber" => sort.Descending ? query.ThenByDescending(f => f.PassportNumber) : query.ThenBy(f => f.PassportNumber),
            "builddate" => sort.Descending ? query.ThenByDescending(f => f.BuildDate) : query.ThenBy(f => f.BuildDate),
            "lastrepairdate" => sort.Descending ? query.ThenByDescending(f => f.LastRepairDate) : query.ThenBy(f => f.LastRepairDate),
            "periodrep" => sort.Descending ? query.ThenByDescending(f => f.PeriodRep) : query.ThenBy(f => f.PeriodRep),
            "servicelifeyears" => sort.Descending ? query.ThenByDescending(f => f.ServiceLifeYears) : query.ThenBy(f => f.ServiceLifeYears),
            "model" or "modelname" => sort.Descending ? query.ThenByDescending(f => f.Model.Name) : query.ThenBy(f => f.Model.Name),
            "depot" or "depotname" => sort.Descending ? query.ThenByDescending(f => f.Depot.Name) : query.ThenBy(f => f.Depot.Name),
            "updatedat" => sort.Descending ? query.ThenByDescending(f => f.UpdatedAt) : query.ThenBy(f => f.UpdatedAt),
            "creatorid" => sort.Descending ? query.ThenByDescending(f => f.CreatorId) : query.ThenBy(f => f.CreatorId),
            _ => query
        };
    }
}
