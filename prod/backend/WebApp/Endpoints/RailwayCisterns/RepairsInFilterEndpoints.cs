using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsInFilterEndpoints
{
    public static void MapRepairsInFilterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/repairs-in/filter")
            .RequireAuthorization()
            .WithTags("repairs-in-filter");

        // Фильтрация с пагинацией
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] RepairsInFilterSortDTO request) =>
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
                query = query.OrderByDescending(r => r.DateIn);
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
        .WithName("FilterRepairsIn")
        .Produces<PaginatedList<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Фильтрация без пагинации
        group.MapPost("/all", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] RepairsInFilterSortWithoutPaginationDTO request) =>
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
                query = query.OrderByDescending(r => r.DateIn);
            }

            var repairs = await query
                .Select(r => SelectColumns(r, request.SelectedColumns))
                .ToListAsync();

            return Results.Ok(repairs);
        })
        .WithName("FilterAllRepairsIn")
        .Produces<List<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);
    }

    private static dynamic SelectColumns(RepairsIn r, List<string>? selectedColumns)
    {
        if (selectedColumns == null || !selectedColumns.Any())
        {
            return new
            {
                r.Id,
                r.CisternNumber,
                r.CisternId,
                r.TypeRepairId,
                r.DepotName,
                r.DepotCode,
                r.DepotId,
                r.VU23,
                r.RoadCode,
                r.RoadName,
                r.StationCode,
                r.StationName,
                r.StationId,
                r.DateIn,
                r.DefectCode,
                r.DefectName,
                r.AdminRoadCode,
                Cistern = r.Cistern != null ? new { r.Cistern.Id, r.Cistern.Number } : null,
                RepairType = r.RepairType != null ? new { r.RepairType.Id, r.RepairType.Name } : null,
                Depot = r.Depot != null ? new { r.Depot.Id, r.Depot.Name, r.Depot.Code } : null,
                Station = r.Station != null ? new { r.Station.Id, r.Station.Name, r.Station.Code } : null
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
                case "cisternnumber":
                    selectedProperties["cisternNumber"] = r.CisternNumber ?? "";
                    break;
                case "cisternid":
                    selectedProperties["cisternId"] = r.CisternId;
                    break;
                case "typerepairid":
                    selectedProperties["typeRepairId"] = r.TypeRepairId;
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
                case "vu23":
                    selectedProperties["vu23"] = r.VU23 ?? "";
                    break;
                case "roadcode":
                    selectedProperties["roadCode"] = r.RoadCode ?? "";
                    break;
                case "roadname":
                    selectedProperties["roadName"] = r.RoadName ?? "";
                    break;
                case "stationcode":
                    selectedProperties["stationCode"] = r.StationCode ?? "";
                    break;
                case "stationname":
                    selectedProperties["stationName"] = r.StationName ?? "";
                    break;
                case "stationid":
                    selectedProperties["stationId"] = r.StationId;
                    break;
                case "datein":
                    selectedProperties["dateIn"] = r.DateIn;
                    break;
                case "defectcode":
                    selectedProperties["defectCode"] = r.DefectCode ?? Array.Empty<string>();
                    break;
                case "defectname":
                    selectedProperties["defectName"] = r.DefectName ?? Array.Empty<string>();
                    break;
                case "adminroadcode":
                    selectedProperties["adminRoadCode"] = r.AdminRoadCode ?? "";
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
                case "station.id":
                    selectedProperties["stationId"] = r.Station?.Id ?? Guid.Empty;
                    break;
                case "station.name":
                    selectedProperties["stationName"] = r.Station?.Name ?? "";
                    break;
                case "station.code":
                    selectedProperties["stationCode"] = (r.Station?.Code ?? 0).ToString();
                    break;
            }
        }

        return selectedProperties;
    }

    private static IQueryable<RepairsIn> BuildFilterQuery(ApplicationDbContext context, RepairsInFilterCriteria? filters)
    {
        var query = context.RepairsIns
            .Include(r => r.Cistern)
            .Include(r => r.RepairType)
            .Include(r => r.Depot)
            .Include(r => r.Station)
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

        if (filters.VU23 != null && filters.VU23.Any())
            query = query.Where(r => filters.VU23.Contains(r.VU23));

        if (filters.RoadCodes != null && filters.RoadCodes.Any())
            query = query.Where(r => r.RoadCode != null && filters.RoadCodes.Contains(r.RoadCode));

        if (filters.RoadNames != null && filters.RoadNames.Any())
            query = query.Where(r => r.RoadName != null && filters.RoadNames.Contains(r.RoadName));

        if (filters.StationCodes != null && filters.StationCodes.Any())
            query = query.Where(r => filters.StationCodes.Contains(r.StationCode));

        if (filters.StationNames != null && filters.StationNames.Any())
            query = query.Where(r => filters.StationNames.Contains(r.StationName));

        if (filters.StationIds != null && filters.StationIds.Any())
            query = query.Where(r => filters.StationIds.Contains(r.StationId));

        if (filters.DateIn != null)
        {
            if (filters.DateIn.From.HasValue)
                query = query.Where(r => r.DateIn >= filters.DateIn.From.Value.ToUniversalTime());
            if (filters.DateIn.To.HasValue)
                query = query.Where(r => r.DateIn <= filters.DateIn.To.Value.ToUniversalTime());
        }

        if (filters.AdminRoadCodes != null && filters.AdminRoadCodes.Any())
            query = query.Where(r => r.AdminRoadCode != null && filters.AdminRoadCodes.Contains(r.AdminRoadCode));

        return query;
    }

    private static IOrderedQueryable<RepairsIn> ApplySort(IQueryable<RepairsIn> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "cisternnumber" => sort.Descending 
                ? query.OrderByDescending(r => r.CisternNumber) 
                : query.OrderBy(r => r.CisternNumber),
            "vu23" => sort.Descending 
                ? query.OrderByDescending(r => r.VU23) 
                : query.OrderBy(r => r.VU23),
            "roadcode" => sort.Descending 
                ? query.OrderByDescending(r => r.RoadCode ?? "") 
                : query.OrderBy(r => r.RoadCode ?? ""),
            "roadname" => sort.Descending 
                ? query.OrderByDescending(r => r.RoadName ?? "") 
                : query.OrderBy(r => r.RoadName ?? ""),
            "stationcode" => sort.Descending 
                ? query.OrderByDescending(r => r.StationCode) 
                : query.OrderBy(r => r.StationCode),
            "stationname" => sort.Descending 
                ? query.OrderByDescending(r => r.StationName) 
                : query.OrderBy(r => r.StationName),
            "datein" => sort.Descending 
                ? query.OrderByDescending(r => r.DateIn) 
                : query.OrderBy(r => r.DateIn),
            "adminroadcode" => sort.Descending 
                ? query.OrderByDescending(r => r.AdminRoadCode ?? "") 
                : query.OrderBy(r => r.AdminRoadCode ?? ""),
            _ => query.OrderByDescending(r => r.DateIn)
        };
    }

    private static IOrderedQueryable<RepairsIn> ApplyThenBy(IOrderedQueryable<RepairsIn> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "cisternnumber" => sort.Descending 
                ? query.ThenByDescending(r => r.CisternNumber) 
                : query.ThenBy(r => r.CisternNumber),
            "vu23" => sort.Descending 
                ? query.ThenByDescending(r => r.VU23) 
                : query.ThenBy(r => r.VU23),
            "roadcode" => sort.Descending 
                ? query.ThenByDescending(r => r.RoadCode ?? "") 
                : query.ThenBy(r => r.RoadCode ?? ""),
            "roadname" => sort.Descending 
                ? query.ThenByDescending(r => r.RoadName ?? "") 
                : query.ThenBy(r => r.RoadName ?? ""),
            "stationcode" => sort.Descending 
                ? query.ThenByDescending(r => r.StationCode) 
                : query.ThenBy(r => r.StationCode),
            "stationname" => sort.Descending 
                ? query.ThenByDescending(r => r.StationName) 
                : query.ThenBy(r => r.StationName),
            "datein" => sort.Descending 
                ? query.ThenByDescending(r => r.DateIn) 
                : query.ThenBy(r => r.DateIn),
            "adminroadcode" => sort.Descending 
                ? query.ThenByDescending(r => r.AdminRoadCode ?? "") 
                : query.ThenBy(r => r.AdminRoadCode ?? ""),
            _ => query
        };
    }
}
