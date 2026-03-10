using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsMatchingFilterEndpoints
{
    public static void MapRepairsMatchingFilterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repairs-matching/filter")
            .RequireAuthorization()
            .WithTags("repairs-matching-filter");

        // Фильтрация с пагинацией
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] RepairsMatchingFilterSortDTO request) =>
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
                query = query.OrderByDescending(r => r.DateTime);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            var repairs = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => SelectColumns(r, request.SelectedColumns))
                .ToListAsync();

            var result = new PaginatedList<object>
            {
                Items = repairs,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalPages = totalPages,
                TotalCount = totalCount
            };

            return Results.Ok(result);
        })
        .WithName("FilterRepairsMatching")
        .Produces<PaginatedList<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Фильтрация без пагинации
        group.MapPost("/all", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] RepairsMatchingFilterSortWithoutPaginationDTO request) =>
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
                query = query.OrderByDescending(r => r.DateTime);
            }

            var repairs = await query
                .Select(r => SelectColumns(r, request.SelectedColumns))
                .ToListAsync();

            return Results.Ok(repairs);
        })
        .WithName("FilterAllRepairsMatching")
        .Produces<List<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
    }

    private static dynamic SelectColumns(RepairsMatching r, List<string>? selectedColumns)
    {
        if (selectedColumns == null || !selectedColumns.Any())
        {
            return new
            {
                r.Id,
                r.CisternId,
                r.RepairInId,
                r.RepairOutId,
                r.DateTime,
                Cistern = r.Cistern != null ? new { r.Cistern.Id, r.Cistern.Number } : null,
                RepairIn = r.RepairIn != null ? new { r.RepairIn.Id, r.RepairIn.VU23, r.RepairIn.DateIn } : null,
                RepairOut = r.RepairOut != null ? new { r.RepairOut.Id, r.RepairOut.VU36, r.RepairOut.DateOut } : null
            };
        }

        var selectedProperties = new System.Dynamic.ExpandoObject() as IDictionary<string, object>;
        
        // ID всегда добавляется
        selectedProperties["id"] = r.Id;
        
        foreach (var column in selectedColumns)
        {
            var normalizedColumn = column.ToLower();
            switch (normalizedColumn)
            {
                case "id":
                    break;
                case "cisternid":
                    selectedProperties["cisternId"] = r.CisternId;
                    break;
                case "repairinid":
                    selectedProperties["repairInId"] = r.RepairInId;
                    break;
                case "repairoutid":
                    selectedProperties["repairOutId"] = r.RepairOutId;
                    break;
                case "datetime":
                    selectedProperties["dateTime"] = r.DateTime;
                    break;
                case "cistern.id":
                    selectedProperties["cisternId"] = r.Cistern?.Id ?? Guid.Empty;
                    break;
                case "cistern.number":
                    selectedProperties["cisternNumber"] = r.Cistern?.Number ?? "";
                    break;
                case "repairin.id":
                    selectedProperties["repairInId"] = r.RepairIn?.Id ?? Guid.Empty;
                    break;
                case "repairin.vu23":
                    selectedProperties["repairInVu23"] = r.RepairIn?.VU23 ?? "";
                    break;
                case "repairin.datein":
                    selectedProperties["repairInDateIn"] = r.RepairIn?.DateIn ?? default(DateTime);
                    break;
                case "repairout.id":
                    selectedProperties["repairOutId"] = r.RepairOut?.Id ?? Guid.Empty;
                    break;
                case "repairout.vu36":
                    selectedProperties["repairOutVu36"] = r.RepairOut?.VU36 ?? "";
                    break;
                case "repairout.dateout":
                    selectedProperties["repairOutDateOut"] = r.RepairOut?.DateOut ?? default(DateTime);
                    break;
            }
        }

        return selectedProperties;
    }

    private static IQueryable<RepairsMatching> BuildFilterQuery(ApplicationDbContext context, RepairsMatchingFilterCriteria? filters)
    {
        var query = context.RepairsMatchings
            .Include(r => r.Cistern)
            .Include(r => r.RepairIn)
            .Include(r => r.RepairOut)
            .AsQueryable();

        if (filters == null)
            return query;

        if (filters.CisternIds != null && filters.CisternIds.Any())
            query = query.Where(r => filters.CisternIds.Contains(r.CisternId));

        if (filters.RepairInIds != null && filters.RepairInIds.Any())
            query = query.Where(r => filters.RepairInIds.Contains(r.RepairInId));

        if (filters.RepairOutIds != null && filters.RepairOutIds.Any())
            query = query.Where(r => filters.RepairOutIds.Contains(r.RepairOutId));

        if (filters.DateTime != null)
        {
            if (filters.DateTime.From.HasValue)
                query = query.Where(r => r.DateTime >= filters.DateTime.From.Value.ToUniversalTime());
            if (filters.DateTime.To.HasValue)
                query = query.Where(r => r.DateTime <= filters.DateTime.To.Value.ToUniversalTime());
        }

        return query;
    }

    private static IOrderedQueryable<RepairsMatching> ApplySort(IQueryable<RepairsMatching> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "datetime" => sort.Descending 
                ? query.OrderByDescending(r => r.DateTime) 
                : query.OrderBy(r => r.DateTime),
            _ => query.OrderByDescending(r => r.DateTime)
        };
    }

    private static IOrderedQueryable<RepairsMatching> ApplyThenBy(IOrderedQueryable<RepairsMatching> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "datetime" => sort.Descending 
                ? query.ThenByDescending(r => r.DateTime) 
                : query.ThenBy(r => r.DateTime),
            _ => query
        };
    }
}
