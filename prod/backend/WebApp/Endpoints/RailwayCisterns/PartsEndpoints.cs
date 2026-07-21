using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.DTO.Common;
using WebApp.Extensions;
using Microsoft.OpenApi.Models;

namespace WebApp.Endpoints.RailwayCisterns;

public static class PartsEndpoints
{
    public static void MapPartsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/parts")
            .RequireAuthorization()
            .WithTags("parts");

        // Получение всех деталей с пагинацией
        group.MapGet("/", async (
            [FromServices] ApplicationDbContext context,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] Guid? typeId = null) =>
        {
            var parameters = new PaginationParameters 
            { 
                PageNumber = pageNumber, 
                PageSize = pageSize 
            };

            var query = context.Parts
                .Include(p => p.PartType)
                .Include(p => p.Status)
                .Include(p => p.StampNumber)
                .Include(p => p.Depot)
                .Include(p => p.RailwayCistern)
                .Include(p => p.Document)
                .Where(p => !p.PartType.Name.ToLower().Contains("эластомер"))
                .AsQueryable();

            if (typeId.HasValue)
            {
                query = query.Where(p => p.PartTypeId == typeId);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize);

            var parts = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .Select(p => new PartDTO
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
                    ServiceLifeYears = p.ServiceLifeYears,
                    ExtendedUntil = p.ExtendedUntil,
                    Model = p.Model,
                    Document = p.Document != null ? new DocumentDTO
                    {
                        Id = p.Document.Id,
                        Number = p.Document.Number,
                        Type = p.Document.Type,
                        Date = p.Document.Date,
                        Author = p.Document.Author,
                        Price = p.Document.Price,
                        Note = p.Document.Note
                    } : null
                })
                .ToListAsync();

            var result = new PaginatedList<PartDTO>
            {
                Items = parts,
                PageNumber = parameters.PageNumber,
                TotalPages = totalPages,
                TotalCount = totalCount
            };

            return Results.Ok(result);
        })
        .WithName("GetParts")
        .ProducesValidationProblem()
        .Produces<PaginatedList<PartDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

         // Получение всех деталей
        group.MapGet("/all/", async (
            [FromServices] ApplicationDbContext context,
            [FromQuery] Guid? typeId = null) =>
        {
            var query = context.Parts
                .Include(p => p.PartType)
                .Include(p => p.Status)
                .Include(p => p.StampNumber)
                .Include(p => p.Depot)
                .Include(p => p.RailwayCistern)
                .Include(p => p.Document)
                .Where(p => !p.PartType.Name.ToLower().Contains("эластомер"))
                .AsQueryable();

            if (typeId.HasValue)
            {
                query = query.Where(p => p.PartTypeId == typeId);
            }

            var parts = await query
                .Select(p => new PartDTO
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
                    ServiceLifeYears = p.ServiceLifeYears,
                    ExtendedUntil = p.ExtendedUntil,
                    Model = p.Model,
                    Document = p.Document != null ? new DocumentDTO
                    {
                        Id = p.Document.Id,
                        Number = p.Document.Number,
                        Type = p.Document.Type,
                        Date = p.Document.Date,
                        Author = p.Document.Author,
                        Price = p.Document.Price,
                        Note = p.Document.Note
                    } : null
                })
                .ToListAsync();

            return Results.Ok(parts);
        })
        .WithName("GetAllParts")
        .ProducesValidationProblem()
        .Produces<List<PartDTO>>(StatusCodes.Status200OK)
        .RequirePermissions(Permission.Read);

        // Получение детали по ID
        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
        {
            var part = await context.Parts
                .Include(p => p.PartType)
                .Include(p => p.Status)
                .Include(p => p.StampNumber)
                .Include(p => p.Depot)
                .Include(p => p.RailwayCistern)
                .Include(p => p.Document)
                .Where(p => p.Id == id)
                .Select(p => new PartDTO
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
                    ServiceLifeYears = p.ServiceLifeYears,
                    ExtendedUntil = p.ExtendedUntil,
                    Model = p.Model,
                    Document = p.Document != null ? new DocumentDTO
                    {
                        Id = p.Document.Id,
                        Number = p.Document.Number,
                        Type = p.Document.Type,
                        Date = p.Document.Date,
                        Author = p.Document.Author,
                        Price = p.Document.Price,
                        Note = p.Document.Note
                    } : null
                })
                .FirstOrDefaultAsync();

            return part == null ? Results.NotFound() : Results.Ok(part);
        })
        .WithName("GetPartById")
        .ProducesValidationProblem()
        .Produces<PartDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

     
        group.MapPost("/", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreatePartDTO dto,
            HttpContext httpContext) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = new Part
            {
                PartTypeId = dto.PartTypeId,
                DepotId = dto.DepotId,
                StampNumberId = dto.StampNumberId,
                SerialNumber = dto.SerialNumber,
                ManufactureYear = dto.ManufactureYear,
                CurrentLocation = dto.CurrentLocation,
                StatusId = dto.StatusId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId") ?? Guid.Empty.ToString()),
                Code = dto.Code,
                DocumentId = dto.DocumentId,
                ServiceLifeYears = dto.ServiceLifeYears,
                ExtendedUntil = dto.ExtendedUntil,
                Model = dto.Model
            };
            context.Add(part);
            await context.SaveChangesAsync();

            return Results.Created($"/api/parts/{part.Id}", part.Id);
        })
        .WithName("CreatePart")
        .ProducesValidationProblem()
        .Produces<Guid>(StatusCodes.Status201Created)
        .RequirePermissions(Permission.Create);

        // Обновление колесной пары
        group.MapPut("/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdatePartDTO dto) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = await context.Parts
                .FirstOrDefaultAsync(p => p.Id == id);

            if (part == null)
                return Results.NotFound();

            // Обновляем основную часть
            part.DepotId = dto.DepotId;
            part.StampNumberId = dto.StampNumberId;
            part.SerialNumber = dto.SerialNumber;
            part.ManufactureYear = dto.ManufactureYear;
            part.CurrentLocation = dto.CurrentLocation;
            part.StatusId = dto.StatusId;
            part.Notes = dto.Notes;
            part.UpdatedAt = DateTime.UtcNow;
            part.Code = dto.Code;
            part.DocumentId = dto.DocumentId;
            part.ServiceLifeYears = dto.ServiceLifeYears ?? part.ServiceLifeYears;
            part.ExtendedUntil = dto.ExtendedUntil ?? part.ExtendedUntil;
            part.Model = dto.Model ?? part.Model;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdatePart")
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        // Удаление детали
        group.MapDelete("/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id) =>
        {
            var part = await context.Parts.FindAsync(id);
            if (part == null)
                return Results.NotFound();

            context.Parts.Remove(part);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("DeletePart")
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .RequirePermissions(Permission.Delete);
    }
}
