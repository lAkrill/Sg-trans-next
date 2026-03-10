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

public static class PartFilterEndpoints
{
    public static void MapPartFilterEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/parts/filter")
            .RequireAuthorization()
            .WithTags("parts-filter");

        // Фильтрация с пагинацией
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] PartFilterSortDTO request) =>
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
                query = query.OrderByDescending(p => p.UpdatedAt);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            var parts = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => SelectPartColumns(p, request.SelectedColumns))
                .ToListAsync();

            var result = new PaginatedList<object>
            {
                Items = parts,
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalPages = totalPages,
                TotalCount = totalCount
            };

            return Results.Ok(result);
        })
        .WithName("FilterParts")
        .Produces<PaginatedList<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Фильтрация без пагинации
        group.MapPost("/all", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] PartFilterSortWithoutPaginationDTO request) =>
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
                query = query.OrderByDescending(p => p.UpdatedAt);
            }

            var parts = await query
                .Select(p => SelectPartColumns(p, request.SelectedColumns))
                .ToListAsync();

            return Results.Ok(parts);
        })
        .WithName("FilterAllParts")
        .Produces<List<object>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Поиск по сохраненному фильтру
        group.MapGet("/saved/{filterId}", async (
            [FromRoute] Guid filterId,
            [FromServices] ApplicationDbContext context,
            HttpContext httpContext) =>
        {
            var userId = Guid.Parse(httpContext.User.FindFirstValue("userId")!);
            var savedFilter = await context.Set<SavedFilter>()
                .FirstOrDefaultAsync(f => f.Id == filterId && f.UserId == userId);

            if (savedFilter == null)
                return Results.NotFound("Сохраненный фильтр не найден");

            var filterCriteria = System.Text.Json.JsonSerializer.Deserialize<PartFilterCriteria>(savedFilter.FilterJson);
            var sortFields = System.Text.Json.JsonSerializer.Deserialize<List<SortCriteria>>(savedFilter.SortFieldsJson);
            var selectedColumns = savedFilter.SelectedColumnsJson != null 
                ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(savedFilter.SelectedColumnsJson)
                : null;

            var query = BuildFilterQuery(context, filterCriteria);

            if (sortFields != null && sortFields.Any())
            {
                var firstSort = sortFields.First();
                var orderedQuery = ApplySort(query, firstSort);

                foreach (var sortField in sortFields.Skip(1))
                {
                    orderedQuery = ApplyThenBy(orderedQuery, sortField);
                }

                query = orderedQuery;
            }
            else
            {
                query = query.OrderByDescending(p => p.UpdatedAt);
            }

            var parts = await query
                .Select(p => SelectPartColumns(p, selectedColumns))
                .ToListAsync();

            return Results.Ok(parts);
        })
        .WithName("GetPartsBySavedFilter")
        .Produces<List<object>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);
    }

    private static dynamic SelectPartColumns(Part p, List<string>? selectedColumns)
    {
        if (selectedColumns == null || !selectedColumns.Any())
        {
            return new
            {
                p.Id,
                PartType = new { p.PartType.Id, p.PartType.Name, p.PartType.Code },
                Depot = p.Depot != null ? new { p.Depot.Id, p.Depot.Name, p.Depot.Code, p.Depot.ShortName, p.Depot.Location } : null,
                StampNumber = p.StampNumber != null ? new { p.StampNumber.Id, p.StampNumber.Value } : null,
                p.SerialNumber,
                p.ManufactureYear,
                p.CurrentLocation,
                Status = new { p.Status.Id, p.Status.Name, p.Status.Code },
                p.Notes,
                p.CreatedAt,
                p.UpdatedAt,
                p.Code,
                Document = p.Document != null ? new 
                {
                    p.Document.Id,
                    p.Document.Number,
                    p.Document.Type,
                    p.Document.Date,
                    p.Document.Author,
                    p.Document.Price,
                    p.Document.Note
                } : null,
                WheelPair = p.PartType.Code == 1 && p.WheelPair != null ? new
                {
                    p.WheelPair.ThicknessLeft,
                    p.WheelPair.ThicknessRight,
                    p.WheelPair.WheelType
                } : null,
                SideFrame = p.PartType.Code == 3 && p.SideFrame != null ? new
                {
                    p.SideFrame.ServiceLifeYears,
                    p.SideFrame.ExtendedUntil
                } : null,
                Bolster = p.PartType.Code == 2 && p.Bolster != null ? new
                {
                    p.Bolster.ServiceLifeYears,
                    p.Bolster.ExtendedUntil
                } : null,
                Coupler = p.PartType.Code == 4 ? new { } : null,
                ShockAbsorber = p.PartType.Code == 10 && p.ShockAbsorber != null ? new
                {
                    p.ShockAbsorber.Model,
                    p.ShockAbsorber.ManufacturerCode,
                    p.ShockAbsorber.NextRepairDate,
                    p.ShockAbsorber.ServiceLifeYears
                } : null
            };
        }

        var selectedProperties = new System.Dynamic.ExpandoObject() as IDictionary<string, object>;
        
        // ID части всегда добавляется, даже если не выбрана в selectedColumns
        selectedProperties["id"] = p.Id;
        
        foreach (var column in selectedColumns)
        {
            var normalizedColumn = column.ToLower();
            switch (normalizedColumn)
            {
                // Основные поля
                case "id":
                    // ID уже добавлён выше, пропускаем
                    break;

                // PartType
                case "parttype.id":
                    selectedProperties["partTypeId"] = p.PartType.Id;
                    break;
                case "parttype.name":
                    selectedProperties["partTypeName"] = p.PartType.Name;
                    break;
                case "parttype.code":
                    selectedProperties["partTypeCode"] = p.PartType.Code;
                    break;

                // StampNumber
                case "stampnumber.id":
                    selectedProperties["stampNumberId"] = p.StampNumber?.Id ?? Guid.Empty;
                    break;
                case "stampnumber.value":
                    selectedProperties["stampNumberValue"] = p.StampNumber?.Value ?? "";
                    break;

                // Status
                case "status.id":
                    selectedProperties["statusId"] = p.Status?.Id ?? Guid.Empty;
                    break;
                case "status.name":
                    selectedProperties["statusName"] = p.Status?.Name ?? "";
                    break;
                case "status.code":
                    selectedProperties["statusCode"] = p.Status?.Code ?? 0;
                    break;

                // WheelPair
                case "wheelpair.thicknessleft":
                    selectedProperties["wheelPairThicknessLeft"] = p.WheelPair?.ThicknessLeft ?? 0;
                    break;
                case "wheelpair.thicknessright":
                    selectedProperties["wheelPairThicknessRight"] = p.WheelPair?.ThicknessRight ?? 0;
                    break;
                case "wheelpair.wheeltype":
                    selectedProperties["wheelPairWheelType"] = p.WheelPair?.WheelType ?? "";
                    break;

                // SideFrame
                case "sideframe.servicelifeyears":
                    selectedProperties["sideFrameServiceLifeYears"] = p.SideFrame?.ServiceLifeYears ?? 0;
                    break;
                case "sideframe.extendeduntil":
                    selectedProperties["sideFrameExtendedUntil"] = p.SideFrame?.ExtendedUntil ?? default(DateOnly);
                    break;

                // Bolster
                case "bolster.servicelifeyears":
                    selectedProperties["bolsterServiceLifeYears"] = p.Bolster?.ServiceLifeYears ?? 0;
                    break;
                case "bolster.extendeduntil":
                    selectedProperties["bolsterExtendedUntil"] = p.Bolster?.ExtendedUntil ?? default(DateOnly);
                    break;

                // ShockAbsorber
                case "shockabsorber.model":
                    selectedProperties["shockAbsorberModel"] = p.ShockAbsorber?.Model ?? "";
                    break;
                case "shockabsorber.manufacturercode":
                    selectedProperties["shockAbsorberManufacturerCode"] = p.ShockAbsorber?.ManufacturerCode ?? "";
                    break;
                case "shockabsorber.nextrepairdate":
                    selectedProperties["shockAbsorberNextRepairDate"] = p.ShockAbsorber?.NextRepairDate ?? default(DateOnly);
                    break;
                case "shockabsorber.servicelifeyears":
                    selectedProperties["shockAbsorberServiceLifeYears"] = p.ShockAbsorber?.ServiceLifeYears ?? 0;
                    break;

                // Depot
                case "depot.id":
                    selectedProperties["depotId"] = p.Depot?.Id ?? Guid.Empty;
                    break;
                case "depot.name":
                    selectedProperties["depotName"] = p.Depot?.Name ?? "";
                    break;
                case "depot.code":
                    selectedProperties["depotCode"] = p.Depot?.Code ?? "";
                    break;
                case "depot.location":
                    selectedProperties["depotLocation"] = p.Depot?.Location ?? "";
                    break;
                case "depot.shortname":
                    selectedProperties["depotShortName"] = p.Depot?.ShortName ?? "";
                    break;

                // Базовые поля
                case "depotid":
                    selectedProperties["depotId"] = p.DepotId ?? Guid.Empty;
                    break;
                case "serialnumber":
                    selectedProperties["serialNumber"] = p.SerialNumber ?? "";
                    break;
                case "manufactureyear":
                    selectedProperties["manufactureYear"] = p.ManufactureYear ?? default(DateOnly);
                    break;
                case "notes":
                    selectedProperties["notes"] = p.Notes ?? "";
                    break;
                case "createdat":
                    selectedProperties["createdAt"] = p.CreatedAt;
                    break;
                case "updatedat":
                    selectedProperties["updatedAt"] = p.UpdatedAt;
                    break;

                // Поля документа
                case "code":
                    selectedProperties["code"] = p.Code ?? 0;
                    break;
                case "document.id":
                    selectedProperties["documentId"] = p.Document?.Id ?? Guid.Empty;
                    break;
                case "document.number":
                    selectedProperties["documentNumber"] = p.Document?.Number ?? "";
                    break;
                case "document.type":
                    selectedProperties["documentType"] = p.Document?.Type ?? 0;
                    break;
                case "document.date":
                    selectedProperties["documentDate"] = p.Document?.Date ?? default(DateOnly);
                    break;
                case "document.author":
                    selectedProperties["documentAuthor"] = p.Document?.Author ?? "";
                    break;
                case "document.price":
                    selectedProperties["documentPrice"] = p.Document?.Price ?? 0;
                    break;
                case "document.note":
                    selectedProperties["documentNote"] = p.Document?.Note ?? "";
                    break;
            }
        }

        return selectedProperties;
    }

    private static IQueryable<Part> BuildFilterQuery(ApplicationDbContext context, PartFilterCriteria? filters)
    {
        var query = context.Parts
            .Include(p => p.PartType)
            .Include(p => p.Status)
            .Include(p => p.StampNumber)
            .Include(p => p.WheelPair)
            .Include(p => p.SideFrame)
            .Include(p => p.Bolster)
            .Include(p => p.Coupler)
            .Include(p => p.ShockAbsorber)
            .Include(p => p.Depot)
            .Include(p => p.Document)
            .AsQueryable();

        if (filters == null)
            return query;

        if (filters.PartTypeIds != null && filters.PartTypeIds.Any())
            query = query.Where(p => filters.PartTypeIds.Contains(p.PartTypeId));

        if (filters.DepotIds != null && filters.DepotIds.Any())
            query = query.Where(p => p.DepotId.HasValue && filters.DepotIds.Contains(p.DepotId.Value));

        if (filters.StampNumbers != null && filters.StampNumbers.Any())
            query = query.Where(p => p.StampNumber != null && filters.StampNumbers.Contains(p.StampNumber.Value));

        if (filters.SerialNumbers != null && filters.SerialNumbers.Any())
            query = query.Where(p => p.SerialNumber != null && filters.SerialNumbers.Contains(p.SerialNumber));

        if (filters.ManufactureYear != null)
        {
            if (filters.ManufactureYear.From.HasValue)
                query = query.Where(p => p.ManufactureYear >= filters.ManufactureYear.From);
            if (filters.ManufactureYear.To.HasValue)
                query = query.Where(p => p.ManufactureYear <= filters.ManufactureYear.To);
        }
       
        if (filters.StatusIds != null && filters.StatusIds.Any())
            query = query.Where(p => filters.StatusIds.Contains(p.StatusId));

        if (filters.CreatedAt != null)
        {
            if (filters.CreatedAt.From.HasValue)
                query = query.Where(p => p.CreatedAt >= filters.CreatedAt.From);
            if (filters.CreatedAt.To.HasValue)
                query = query.Where(p => p.CreatedAt <= filters.CreatedAt.To);
        }

        if (filters.UpdatedAt != null)
        {
            if (filters.UpdatedAt.From.HasValue)
                query = query.Where(p => p.UpdatedAt >= filters.UpdatedAt.From);
            if (filters.UpdatedAt.To.HasValue)
                query = query.Where(p => p.UpdatedAt <= filters.UpdatedAt.To);
        }

        // Специфичные фильтры для колесных пар
        if (filters.ThicknessLeft != null)
        {
            if (filters.ThicknessLeft.From.HasValue)
                query = query.Where(p => p.WheelPair != null && p.WheelPair.ThicknessLeft >= filters.ThicknessLeft.From);
            if (filters.ThicknessLeft.To.HasValue)
                query = query.Where(p => p.WheelPair != null && p.WheelPair.ThicknessLeft <= filters.ThicknessLeft.To);
        }

        if (filters.ThicknessRight != null)
        {
            if (filters.ThicknessRight.From.HasValue)
                query = query.Where(p => p.WheelPair != null && p.WheelPair.ThicknessRight >= filters.ThicknessRight.From);
            if (filters.ThicknessRight.To.HasValue)
                query = query.Where(p => p.WheelPair != null && p.WheelPair.ThicknessRight <= filters.ThicknessRight.To);
        }

        if (filters.WheelTypes != null && filters.WheelTypes.Any())
            query = query.Where(p => p.WheelPair != null && p.WheelPair.WheelType != null && 
                                   filters.WheelTypes.Contains(p.WheelPair.WheelType));

        // Специфичные фильтры для боковых рам и надрессорных балок
        if (filters.ServiceLifeYears != null)
        {
            if (filters.ServiceLifeYears.From.HasValue)
                query = query.Where(p => 
                    (p.SideFrame != null && p.SideFrame.ServiceLifeYears >= filters.ServiceLifeYears.From) ||
                    (p.Bolster != null && p.Bolster.ServiceLifeYears >= filters.ServiceLifeYears.From));
            if (filters.ServiceLifeYears.To.HasValue)
                query = query.Where(p => 
                    (p.SideFrame != null && p.SideFrame.ServiceLifeYears <= filters.ServiceLifeYears.To) ||
                    (p.Bolster != null && p.Bolster.ServiceLifeYears <= filters.ServiceLifeYears.To));
        }

        if (filters.ExtendedUntil != null)
        {
            if (filters.ExtendedUntil.From.HasValue)
                query = query.Where(p => 
                    (p.SideFrame != null && p.SideFrame.ExtendedUntil >= filters.ExtendedUntil.From) ||
                    (p.Bolster != null && p.Bolster.ExtendedUntil >= filters.ExtendedUntil.From));
            if (filters.ExtendedUntil.To.HasValue)
                query = query.Where(p => 
                    (p.SideFrame != null && p.SideFrame.ExtendedUntil <= filters.ExtendedUntil.To) ||
                    (p.Bolster != null && p.Bolster.ExtendedUntil <= filters.ExtendedUntil.To));
        }

        // Специфичные фильтры для поглощающих аппаратов
        if (filters.Models != null && filters.Models.Any())
            query = query.Where(p => p.ShockAbsorber != null && p.ShockAbsorber.Model != null && 
                                   filters.Models.Contains(p.ShockAbsorber.Model));

        if (filters.ManufacturerCodes != null && filters.ManufacturerCodes.Any())
            query = query.Where(p => p.ShockAbsorber != null && p.ShockAbsorber.ManufacturerCode != null && 
                                   filters.ManufacturerCodes.Contains(p.ShockAbsorber.ManufacturerCode));

        if (filters.NextRepairDate != null)
        {
            if (filters.NextRepairDate.From.HasValue)
                query = query.Where(p => p.ShockAbsorber != null && 
                                       p.ShockAbsorber.NextRepairDate >= filters.NextRepairDate.From);
            if (filters.NextRepairDate.To.HasValue)
                query = query.Where(p => p.ShockAbsorber != null && 
                                       p.ShockAbsorber.NextRepairDate <= filters.NextRepairDate.To);
        }

        // Фильтры по коду
        if (filters.Code != null)
        {
            if (filters.Code.From.HasValue)
                query = query.Where(p => p.Code >= filters.Code.From);
            if (filters.Code.To.HasValue)
                query = query.Where(p => p.Code <= filters.Code.To);
        }

        // Фильтры по документу
        if (filters.DocumentId.HasValue)
            query = query.Where(p => p.DocumentId == filters.DocumentId);

        if (filters.DocumentNumbers != null && filters.DocumentNumbers.Any())
            query = query.Where(p => p.Document != null && filters.DocumentNumbers.Contains(p.Document.Number));

        if (filters.DocumentTypes != null && filters.DocumentTypes.Any())
            query = query.Where(p => p.Document != null && p.Document.Type.HasValue && filters.DocumentTypes.Contains(p.Document.Type.Value));

        if (filters.DocumentDate != null)
        {
            if (filters.DocumentDate.From.HasValue)
                query = query.Where(p => p.Document != null && p.Document.Date >= filters.DocumentDate.From);
            if (filters.DocumentDate.To.HasValue)
                query = query.Where(p => p.Document != null && p.Document.Date <= filters.DocumentDate.To);
        }

        return query;
    }

    private static IOrderedQueryable<Part> ApplySort(IQueryable<Part> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "parttypename" => sort.Descending ? query.OrderByDescending(p => p.PartType.Name) : query.OrderBy(p => p.PartType.Name),
            "stampnumber" => sort.Descending ? query.OrderByDescending(p => p.StampNumber != null ? p.StampNumber.Value : "") 
                : query.OrderBy(p => p.StampNumber != null ? p.StampNumber.Value : ""),
            "serialnumber" => sort.Descending ? query.OrderByDescending(p => p.SerialNumber ?? "") : query.OrderBy(p => p.SerialNumber ?? ""),
            "manufactureyear" => sort.Descending ? query.OrderByDescending(p => p.ManufactureYear) : query.OrderBy(p => p.ManufactureYear),
            // "currentlocation" => sort.Descending ? query.OrderByDescending(p => p.CurrentLocation) : query.OrderBy(p => p.CurrentLocation),
            "statusname" => sort.Descending ? query.OrderByDescending(p => p.Status.Name) : query.OrderBy(p => p.Status.Name),
            "notes" => sort.Descending ? query.OrderByDescending(p => p.Notes ?? "") : query.OrderBy(p => p.Notes ?? ""),
            "createdat" => sort.Descending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            "updatedat" => sort.Descending ? query.OrderByDescending(p => p.UpdatedAt) : query.OrderBy(p => p.UpdatedAt),
            
            // Специфичные поля для колесных пар
            "thicknessleft" => sort.Descending ? 
                query.OrderByDescending(p => p.WheelPair != null ? p.WheelPair.ThicknessLeft : null) : 
                query.OrderBy(p => p.WheelPair != null ? p.WheelPair.ThicknessLeft : null),
            "thicknessright" => sort.Descending ? 
                query.OrderByDescending(p => p.WheelPair != null ? p.WheelPair.ThicknessRight : null) : 
                query.OrderBy(p => p.WheelPair != null ? p.WheelPair.ThicknessRight : null),
            "wheeltype" => sort.Descending ? 
                query.OrderByDescending(p => p.WheelPair != null ? p.WheelPair.WheelType ?? "" : "") : 
                query.OrderBy(p => p.WheelPair != null ? p.WheelPair.WheelType ?? "" : ""),
            
            // Специфичные поля для боковых рам и надрессорных балок
            "servicelifeyears" => sort.Descending ? 
                query.OrderByDescending(p => p.SideFrame != null ? p.SideFrame.ServiceLifeYears : 
                    p.Bolster != null ? p.Bolster.ServiceLifeYears : null) : 
                query.OrderBy(p => p.SideFrame != null ? p.SideFrame.ServiceLifeYears : 
                    p.Bolster != null ? p.Bolster.ServiceLifeYears : null),
            "extendeduntil" => sort.Descending ? 
                query.OrderByDescending(p => p.SideFrame != null ? p.SideFrame.ExtendedUntil : 
                    p.Bolster != null ? p.Bolster.ExtendedUntil : null) : 
                query.OrderBy(p => p.SideFrame != null ? p.SideFrame.ExtendedUntil : 
                    p.Bolster != null ? p.Bolster.ExtendedUntil : null),
            
            // Специфичные поля для поглощающих аппаратов
            "model" => sort.Descending ? 
                query.OrderByDescending(p => p.ShockAbsorber != null ? p.ShockAbsorber.Model ?? "" : "") : 
                query.OrderBy(p => p.ShockAbsorber != null ? p.ShockAbsorber.Model ?? "" : ""),
            "manufacturercode" => sort.Descending ? 
                query.OrderByDescending(p => p.ShockAbsorber != null ? p.ShockAbsorber.ManufacturerCode ?? "" : "") : 
                query.OrderBy(p => p.ShockAbsorber != null ? p.ShockAbsorber.ManufacturerCode ?? "" : ""),
            "nextrepairdate" => sort.Descending ? 
                query.OrderByDescending(p => p.ShockAbsorber != null ? p.ShockAbsorber.NextRepairDate : null) : 
                query.OrderBy(p => p.ShockAbsorber != null ? p.ShockAbsorber.NextRepairDate : null),
            
            // Поля документа и кода
            "code" => sort.Descending ? query.OrderByDescending(p => p.Code) : query.OrderBy(p => p.Code),
            "documentnumber" => sort.Descending ? 
                query.OrderByDescending(p => p.Document != null ? p.Document.Number : "") : 
                query.OrderBy(p => p.Document != null ? p.Document.Number : ""),
            "documenttype" => sort.Descending ? 
                query.OrderByDescending(p => p.Document != null ? p.Document.Type : 0) : 
                query.OrderBy(p => p.Document != null ? p.Document.Type : 0),
            "documentdate" => sort.Descending ? 
                query.OrderByDescending(p => p.Document != null ? p.Document.Date : DateOnly.MinValue) : 
                query.OrderBy(p => p.Document != null ? p.Document.Date : DateOnly.MinValue),
            "documentauthor" => sort.Descending ? 
                query.OrderByDescending(p => p.Document != null ? p.Document.Author : "") : 
                query.OrderBy(p => p.Document != null ? p.Document.Author : ""),
            "documentprice" => sort.Descending ? 
                query.OrderByDescending(p => p.Document != null ? p.Document.Price : 0) : 
                query.OrderBy(p => p.Document != null ? p.Document.Price : 0),
            
            _ => query.OrderByDescending(p => p.UpdatedAt) // сортировка по умолчанию
        };
    }

    private static IOrderedQueryable<Part> ApplyThenBy(IOrderedQueryable<Part> query, SortCriteria sort)
    {
        return sort.FieldName.ToLower() switch
        {
            "parttypename" => sort.Descending ? query.ThenByDescending(p => p.PartType.Name) : query.ThenBy(p => p.PartType.Name),
            "stampnumber" => sort.Descending ? 
                query.ThenByDescending(p => p.StampNumber != null ? p.StampNumber.Value : "") : 
                query.ThenBy(p => p.StampNumber != null ? p.StampNumber.Value : ""),
            "serialnumber" => sort.Descending ? query.ThenByDescending(p => p.SerialNumber ?? "") : query.ThenBy(p => p.SerialNumber ?? ""),
            "manufactureyear" => sort.Descending ? query.ThenByDescending(p => p.ManufactureYear) : query.ThenBy(p => p.ManufactureYear),
            // "currentlocation" => sort.Descending ? query.ThenByDescending(p => p.CurrentLocation) : query.ThenBy(p => p.CurrentLocation),
            "statusname" => sort.Descending ? query.ThenByDescending(p => p.Status.Name) : query.ThenBy(p => p.Status.Name),
            "notes" => sort.Descending ? query.ThenByDescending(p => p.Notes ?? "") : query.ThenBy(p => p.Notes ?? ""),
            "createdat" => sort.Descending ? query.ThenByDescending(p => p.CreatedAt) : query.ThenBy(p => p.CreatedAt),
            "updatedat" => sort.Descending ? query.ThenByDescending(p => p.UpdatedAt) : query.ThenBy(p => p.UpdatedAt),
            
            // Специфичные поля для колесных пар
            "thicknessleft" => sort.Descending ? 
                query.ThenByDescending(p => p.WheelPair != null ? p.WheelPair.ThicknessLeft : null) : 
                query.ThenBy(p => p.WheelPair != null ? p.WheelPair.ThicknessLeft : null),
            "thicknessright" => sort.Descending ? 
                query.ThenByDescending(p => p.WheelPair != null ? p.WheelPair.ThicknessRight : null) : 
                query.ThenBy(p => p.WheelPair != null ? p.WheelPair.ThicknessRight : null),
            "wheeltype" => sort.Descending ? 
                query.ThenByDescending(p => p.WheelPair != null ? p.WheelPair.WheelType ?? "" : "") : 
                query.ThenBy(p => p.WheelPair != null ? p.WheelPair.WheelType ?? "" : ""),
            
            // Специфичные поля для боковых рам и надрессорных балок
            "servicelifeyears" => sort.Descending ? 
                query.ThenByDescending(p => p.SideFrame != null ? p.SideFrame.ServiceLifeYears : 
                    p.Bolster != null ? p.Bolster.ServiceLifeYears : null) : 
                query.ThenBy(p => p.SideFrame != null ? p.SideFrame.ServiceLifeYears : 
                    p.Bolster != null ? p.Bolster.ServiceLifeYears : null),
            "extendeduntil" => sort.Descending ? 
                query.ThenByDescending(p => p.SideFrame != null ? p.SideFrame.ExtendedUntil : 
                    p.Bolster != null ? p.Bolster.ExtendedUntil : null) : 
                query.ThenBy(p => p.SideFrame != null ? p.SideFrame.ExtendedUntil : 
                    p.Bolster != null ? p.Bolster.ExtendedUntil : null),
            
            // Специфичные поля для поглощающих аппаратов
            "model" => sort.Descending ? 
                query.ThenByDescending(p => p.ShockAbsorber != null ? p.ShockAbsorber.Model ?? "" : "") : 
                query.ThenBy(p => p.ShockAbsorber != null ? p.ShockAbsorber.Model ?? "" : ""),
            "manufacturercode" => sort.Descending ? 
                query.ThenByDescending(p => p.ShockAbsorber != null ? p.ShockAbsorber.ManufacturerCode ?? "" : "") : 
                query.ThenBy(p => p.ShockAbsorber != null ? p.ShockAbsorber.ManufacturerCode ?? "" : ""),
            "nextrepairdate" => sort.Descending ? 
                query.ThenByDescending(p => p.ShockAbsorber != null ? p.ShockAbsorber.NextRepairDate : null) : 
                query.ThenBy(p => p.ShockAbsorber != null ? p.ShockAbsorber.NextRepairDate : null),
            
            // Поля документа и кода
            "code" => sort.Descending ? query.ThenByDescending(p => p.Code) : query.ThenBy(p => p.Code),
            "documentnumber" => sort.Descending ? 
                query.ThenByDescending(p => p.Document != null ? p.Document.Number : "") : 
                query.ThenBy(p => p.Document != null ? p.Document.Number : ""),
            "documenttype" => sort.Descending ? 
                query.ThenByDescending(p => p.Document != null ? p.Document.Type : 0) : 
                query.ThenBy(p => p.Document != null ? p.Document.Type : 0),
            "documentdate" => sort.Descending ? 
                query.ThenByDescending(p => p.Document != null ? p.Document.Date : DateOnly.MinValue) : 
                query.ThenBy(p => p.Document != null ? p.Document.Date : DateOnly.MinValue),
            "documentauthor" => sort.Descending ? 
                query.ThenByDescending(p => p.Document != null ? p.Document.Author : "") : 
                query.ThenBy(p => p.Document != null ? p.Document.Author : ""),
            "documentprice" => sort.Descending ? 
                query.ThenByDescending(p => p.Document != null ? p.Document.Price : 0) : 
                query.ThenBy(p => p.Document != null ? p.Document.Price : 0),
            
            _ => query // если поле неизвестно, оставляем текущую сортировку
        };
    }
}


