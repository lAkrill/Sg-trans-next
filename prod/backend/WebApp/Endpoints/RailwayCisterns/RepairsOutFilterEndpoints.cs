using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsOutFilterEndpoints
{
    public static void MapRepairsOutFilterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repairs-out/filter")
            .RequireAuthorization()
            .WithTags("repairs-out-filter");

        // Фильтрация с пагинацией
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] RepairsOutFilterSortDTO request) =>
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
                query = query.OrderByDescending(r => r.DateOut);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            var repairs = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(r => SelectColumns(r, request.SelectedColumns, 
                    context.RepairsMatchings.Any(rm => rm.RepairOutId == r.Id)))
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
        .WithName("FilterRepairsOut")
        .Produces<PaginatedList<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Фильтрация без пагинации
        group.MapPost("/all", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] RepairsOutFilterSortWithoutPaginationDTO request) =>
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
                query = query.OrderByDescending(r => r.DateOut);
            }

            var repairs = await query
                .Select(r => SelectColumns(r, request.SelectedColumns, 
                    context.RepairsMatchings.Any(rm => rm.RepairOutId == r.Id)))
                .ToListAsync();

            return Results.Ok(repairs);
        })
        .WithName("FilterAllRepairsOut")
        .Produces<List<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
    }

    private static dynamic SelectColumns(RepairsOut r, List<string>? selectedColumns, bool isMatching)
    {
        if (selectedColumns == null || !selectedColumns.Any())
        {
            return new
            {
                r.Id,
                r.CisternNumber,
                r.CisternId,
                r.TypeRepairId,
                r.VU36,
                r.DepotName,
                r.DepotCode,
                r.DepotId,
                r.DateIn,
                r.DateOut,
                r.ModernCode,
                r.RoadCode,
                r.RoadName,
                r.ModernName,
                isMatching,
                Cistern = r.Cistern != null ? new { r.Cistern.Id, r.Cistern.Number } : null,
                RepairType = r.RepairType != null ? new { r.RepairType.Id, r.RepairType.Name } : null,
                Depot = r.Depot != null ? new { r.Depot.Id, r.Depot.Name, r.Depot.Code } : null
            };
        }

        var selectedProperties = new System.Dynamic.ExpandoObject() as IDictionary<string, object>;
        
        // ID и isMatching всегда добавляются
        selectedProperties["id"] = r.Id;
        selectedProperties["isMatching"] = isMatching;
        
        foreach (var column in selectedColumns)
        {
            var normalizedColumn = column.ToLower();
            switch (normalizedColumn)
            {
                case "id":
                    break;
                case "cisternnumber":
                    selectedProperties["cisternNumber"] = r.CisternNumber ?? "";
                    break;
                case "cisternid":
                    selectedProperties["cisternId"] = r.CisternId;
                    break;
                case "typerepairid":
                    selectedProperties["typeRepairId"] = r.TypeRepairId;
                    break;
                case "vu36":
                    selectedProperties["vu36"] = r.VU36 ?? "";
                    break;
                case "depotname":
                    selectedProperties["depotName"] = r.DepotName ?? "";
                    break;
                case "depotcode":
                    selectedProperties["depotCode"] = r.DepotCode ?? "";
                    break;
                case "depotid":
                    selectedProperties["depotId"] = r.DepotId;
                    break;
                case "datein":
                    selectedProperties["dateIn"] = r.DateIn;
                    break;
                case "dateout":
                    selectedProperties["dateOut"] = r.DateOut;
                    break;
                case "moderncode":
                    selectedProperties["modernCode"] = r.ModernCode ?? Array.Empty<string>();
                    break;
                case "roadcode":
                    selectedProperties["roadCode"] = r.RoadCode ?? "";
                    break;
                case "roadname":
                    selectedProperties["roadName"] = r.RoadName ?? "";
                    break;
                case "modernname":
                    selectedProperties["modernName"] = r.ModernName ?? Array.Empty<string>();
                    break;
                case "cistern.id":
                    selectedProperties["cisternId"] = r.Cistern?.Id ?? Guid.Empty;
                    break;
                case "cistern.number":
                    selectedProperties["cisternNumber"] = r.Cistern?.Number ?? "";
                    break;
                case "repairtype.id":
                    selectedProperties["repairTypeId"] = r.RepairType?.Id ?? Guid.Empty;
                    break;
                case "repairtype.name":
                    selectedProperties["repairTypeName"] = r.RepairType?.Name ?? "";
                    break;
                case "depot.id":
                    selectedProperties["depotId"] = r.Depot?.Id ?? Guid.Empty;
                    break;
                case "depot.name":
                    selectedProperties["depotName"] = r.Depot?.Name ?? "";
                    break;
                case "depot.code":
                    selectedProperties["depotCode"] = r.Depot?.Code ?? "";
                    break;
            }
        }

        return selectedProperties;
    }

    private static IQueryable<RepairsOut> BuildFilterQuery(ApplicationDbContext context, RepairsOutFilterCriteria? filters)
    {
        var query = context.RepairsOuts
            .Include(r => r.Cistern)
            .Include(r => r.RepairType)
            .Include(r => r.Depot)
            .AsQueryable();

        if (filters == null)
            return query;

        if (filters.CisternNumbers != null && filters.CisternNumbers.Any())
            query = query.Where(r => filters.CisternNumbers.Contains(r.CisternNumber));

        if (filters.CisternIds != null && filters.CisternIds.Any())
            query = query.Where(r => filters.CisternIds.Contains(r.CisternId));

        if (filters.TypeRepairIds != null && filters.TypeRepairIds.Any())
            query = query.Where(r => filters.TypeRepairIds.Contains(r.TypeRepairId));

        if (filters.DepotNames != null && filters.DepotNames.Any())
            query = query.Where(r => filters.DepotNames.Contains(r.DepotName));

        if (filters.DepotIds != null && filters.DepotIds.Any())
            query = query.Where(r => filters.DepotIds.Contains(r.DepotId));

        if (filters.VU36 != null && filters.VU36.Any())
            query = query.Where(r => filters.VU36.Contains(r.VU36));

        if (filters.RoadCodes != null && filters.RoadCodes.Any())
            query = query.Where(r => r.RoadCode != null && filters.RoadCodes.Contains(r.RoadCode));

        if (filters.RoadNames != null && filters.RoadNames.Any())
            query = query.Where(r => r.RoadName != null && filters.RoadNames.Contains(r.RoadName));

        if (filters.DateIn != null)
        {
            if (filters.DateIn.From.HasValue)
                query = query.Where(r => r.DateIn >= filters.DateIn.From.Value.ToUniversalTime());
            if (filters.DateIn.To.HasValue)
                query = query.Where(r => r.DateIn <= filters.DateIn.To.Value.ToUniversalTime());
        }

        if (filters.DateOut != null)
        {
            if (filters.DateOut.From.HasValue)
                query = query.Where(r => r.DateOut >= filters.DateOut.From.Value.ToUniversalTime());
            if (filters.DateOut.To.HasValue)
                query = query.Where(r => r.DateOut <= filters.DateOut.To.Value.ToUniversalTime());
        }

        return query;
    }

    private static IOrderedQueryable<RepairsOut> ApplySort(IQueryable<RepairsOut> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "cisternnumber" => sort.Descending 
                ? query.OrderByDescending(r => r.CisternNumber) 
                : query.OrderBy(r => r.CisternNumber),
            "vu36" => sort.Descending 
                ? query.OrderByDescending(r => r.VU36) 
                : query.OrderBy(r => r.VU36),
            "roadcode" => sort.Descending 
                ? query.OrderByDescending(r => r.RoadCode ?? "") 
                : query.OrderBy(r => r.RoadCode ?? ""),
            "roadname" => sort.Descending 
                ? query.OrderByDescending(r => r.RoadName ?? "") 
                : query.OrderBy(r => r.RoadName ?? ""),
            "datein" => sort.Descending 
                ? query.OrderByDescending(r => r.DateIn) 
                : query.OrderBy(r => r.DateIn),
            "dateout" => sort.Descending 
                ? query.OrderByDescending(r => r.DateOut) 
                : query.OrderBy(r => r.DateOut),
            _ => query.OrderByDescending(r => r.DateOut)
        };
    }

    private static IOrderedQueryable<RepairsOut> ApplyThenBy(IOrderedQueryable<RepairsOut> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "cisternnumber" => sort.Descending 
                ? query.ThenByDescending(r => r.CisternNumber) 
                : query.ThenBy(r => r.CisternNumber),
            "vu36" => sort.Descending 
                ? query.ThenByDescending(r => r.VU36) 
                : query.ThenBy(r => r.VU36),
            "roadcode" => sort.Descending 
                ? query.ThenByDescending(r => r.RoadCode ?? "") 
                : query.ThenBy(r => r.RoadCode ?? ""),
            "roadname" => sort.Descending 
                ? query.ThenByDescending(r => r.RoadName ?? "") 
                : query.ThenBy(r => r.RoadName ?? ""),
            "datein" => sort.Descending 
                ? query.ThenByDescending(r => r.DateIn) 
                : query.ThenBy(r => r.DateIn),
            "dateout" => sort.Descending 
                ? query.ThenByDescending(r => r.DateOut) 
                : query.ThenBy(r => r.DateOut),
            _ => query
        };
    }
}
