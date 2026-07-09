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
                .Select(p => MapPartToDto(p))
                .ToListAsync();

            var result = new PaginatedList<PartDTO>
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
        .Produces<PaginatedList<PartDTO>>(StatusCodes.Status200OK)
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
                .Select(p => MapPartToDto(p))
                .ToListAsync();

            return Results.Ok(parts);
        })
        .WithName("FilterAllParts")
        .Produces<List<PartDTO>>(StatusCodes.Status200OK)
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
                .Select(p => MapPartToDto(p))
                .ToListAsync();

            return Results.Ok(parts);
        })
        .WithName("GetPartsBySavedFilter")
        .Produces<List<PartDTO>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);
    }

    private static PartDTO MapPartToDto(Part p)
    {
        return new PartDTO
        {
            Id = p.Id,
            PartType = new PartTypeDTO
            {
                Id = p.PartType.Id,
                Name = p.PartType.Name,
                Code = p.PartType.Code
            },
            Depot = p.Depot != null ? new DepotDTO
            {
                Id = p.Depot.Id,
                Name = p.Depot.Name,
                Code = p.Depot.Code,
                ShortName = p.Depot.ShortName,
                Location = p.Depot.Location
            } : null,
            StampNumber = new StampNumberDTO
            {
                Id = p.StampNumber.Id,
                Value = p.StampNumber.Value
            },
            SerialNumber = p.SerialNumber,
            ManufactureYear = p.ManufactureYear,
            CurrentLocation = p.RailwayCistern != null ? new RailwayCisternIdAndNumberDTO
            {
                Id = p.RailwayCistern.Id,
                Number = p.RailwayCistern.Number,
            } : null,
            Status = new PartStatusDTO
            {
                Id = p.Status.Id,
                Name = p.Status.Name,
                Code = p.Status.Code
            },
            Notes = p.Notes,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            Code = p.Code,
            Document = p.Document != null ? new DocumentDTO
            {
                Id = p.Document.Id,
                Number = p.Document.Number,
                Type = p.Document.Type,
                Date = p.Document.Date,
                Author = p.Document.Author,
                Price = p.Document.Price,
                Note = p.Document.Note
            } : null,
            WheelPair = p.PartType.Code == 1 && p.WheelPair != null ? new WheelPairDTO
            {
                ThicknessLeft = p.WheelPair.ThicknessLeft,
                ThicknessRight = p.WheelPair.ThicknessRight,
                WheelType = p.WheelPair.WheelType
            } : null,
            SideFrame = p.PartType.Code == 3 && p.SideFrame != null ? new SideFrameDTO
            {
                ServiceLifeYears = p.SideFrame.ServiceLifeYears,
                ExtendedUntil = p.SideFrame.ExtendedUntil
            } : null,
            Bolster = p.PartType.Code == 2 && p.Bolster != null ? new BolsterDTO
            {
                ServiceLifeYears = p.Bolster.ServiceLifeYears,
                ExtendedUntil = p.Bolster.ExtendedUntil
            } : null,
            Coupler = p.PartType.Code == 4 && p.Coupler != null ? new CouplerDTO() : null,
            ShockAbsorber = p.PartType.Code == 10 && p.ShockAbsorber != null ? new ShockAbsorberDTO
            {
                Model = p.ShockAbsorber.Model,
                ManufacturerCode = p.ShockAbsorber.ManufacturerCode,
                NextRepairDate = p.ShockAbsorber.NextRepairDate,
                ServiceLifeYears = p.ShockAbsorber.ServiceLifeYears
            } : null
        };
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
            .Include(p => p.RailwayCistern)
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


