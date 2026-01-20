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
                .Include(p => p.WheelPair)
                .Include(p => p.SideFrame)
                .Include(p => p.Bolster)
                .Include(p => p.Coupler)
                .Include(p => p.ShockAbsorber)
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
                    WheelPair = p.PartType.Code == 1 ? new WheelPairDTO
                    {
                        ThicknessLeft = p.WheelPair.ThicknessLeft,
                        ThicknessRight = p.WheelPair.ThicknessRight,
                        WheelType = p.WheelPair.WheelType
                    } : null,
                    SideFrame = p.PartType.Code == 3 ? new SideFrameDTO
                    {
                        ServiceLifeYears = p.SideFrame.ServiceLifeYears,
                        ExtendedUntil = p.SideFrame.ExtendedUntil
                    } : null,
                    Bolster = p.PartType.Code == 2 ? new BolsterDTO
                    {
                        ServiceLifeYears = p.Bolster.ServiceLifeYears,
                        ExtendedUntil = p.Bolster.ExtendedUntil
                    } : null,
                    Coupler = p.PartType.Code == 4 ? new CouplerDTO() : null,
                    ShockAbsorber = p.PartType.Code == 10 ? new ShockAbsorberDTO
                    {
                        Model = p.ShockAbsorber.Model,
                        ManufacturerCode = p.ShockAbsorber.ManufacturerCode,
                        NextRepairDate = p.ShockAbsorber.NextRepairDate,
                        ServiceLifeYears = p.ShockAbsorber.ServiceLifeYears
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
        .WithOpenApi(operation => 
        {
            operation.Description = "Получение списка деталей с пагинацией и фильтрацией по типу";
            operation.Summary = "Get paginated parts list with optional type filter";
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<PaginatedList<PartDTO>>(StatusCodes.Status200OK)
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
                .Include(p => p.WheelPair)
                .Include(p => p.SideFrame)
                .Include(p => p.Bolster)
                .Include(p => p.Coupler)
                .Include(p => p.ShockAbsorber)
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
                    WheelPair = p.WheelPair != null ? new WheelPairDTO
                    {
                        ThicknessLeft = p.WheelPair.ThicknessLeft,
                        ThicknessRight = p.WheelPair.ThicknessRight,
                        WheelType = p.WheelPair.WheelType
                    } : null,
                    SideFrame = p.SideFrame != null ? new SideFrameDTO
                    {
                        ServiceLifeYears = p.SideFrame.ServiceLifeYears,
                        ExtendedUntil = p.SideFrame.ExtendedUntil
                    } : null,
                    Bolster = p.Bolster != null ? new BolsterDTO
                    {
                        ServiceLifeYears = p.Bolster.ServiceLifeYears,
                        ExtendedUntil = p.Bolster.ExtendedUntil
                    } : null,
                    Coupler = p.Coupler != null ? new CouplerDTO() : null,
                    ShockAbsorber = p.ShockAbsorber != null ? new ShockAbsorberDTO
                    {
                        Model = p.ShockAbsorber.Model,
                        ManufacturerCode = p.ShockAbsorber.ManufacturerCode,
                        NextRepairDate = p.ShockAbsorber.NextRepairDate,
                        ServiceLifeYears = p.ShockAbsorber.ServiceLifeYears
                    } : null
                })
                .FirstOrDefaultAsync();

            return part == null ? Results.NotFound() : Results.Ok(part);
        })
        .WithName("GetPartById")
        .WithOpenApi(operation => 
        {
            operation.Description = "Получение детали по ID";
            operation.Summary = "Get part by ID";
            

            var notFoundResponse = new OpenApiResponse
            {
                Description = "Not Found",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new Microsoft.OpenApi.Any.OpenApiObject()
                    }
                }
            };
            operation.Responses["404"] = notFoundResponse;
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<PartDTO>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Read);

        // Создание колесной пары
        group.MapPost("/wheel-pairs", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateWheelPairDTO dto,
            HttpContext httpContext) =>
        {
            var part = new Part
            {
                PartTypeId = dto.PartTypeId,
                DepotId = dto.DepotId,
                StampNumberId = dto.StampNumberId,
                SerialNumber = dto.SerialNumber,
                ManufactureYear = dto.ManufactureYear,
                StatusId = dto.StatusId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId")),
                Code = dto.Code,
                DocumentId = dto.DocumentId
            };

            var wheelPair = new WheelPair
            {
                Part = part,
                ThicknessLeft = dto.ThicknessLeft,
                ThicknessRight = dto.ThicknessRight,
                WheelType = dto.WheelType
            };

            context.Add(part);
            context.Add(wheelPair);
            await context.SaveChangesAsync();

            return Results.Created($"/api/parts/{part.Id}", part.Id);
        })
        .WithName("CreateWheelPair")
        .WithOpenApi(operation => 
        {
            operation.Description = "Создание новой колесной пары";
            operation.Summary = "Create new wheel pair";
            
            var response = new OpenApiResponse
            {
                Description = "Success",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new Microsoft.OpenApi.Any.OpenApiString("3fa85f64-5717-4562-b3fc-2c963f66afa6")
                    }
                }
            };
            operation.Responses["201"] = response;
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<Guid>(StatusCodes.Status201Created)
        .RequirePermissions(Permission.Create);

        // Создание боковой рамы
        group.MapPost("/side-frames", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateSideFrameDTO dto,
            HttpContext httpContext) =>
        {
            var part = new Part
            {
                PartTypeId = dto.PartTypeId,
                DepotId = dto.DepotId,
                StampNumberId = dto.StampNumberId,
                SerialNumber = dto.SerialNumber,
                ManufactureYear = dto.ManufactureYear,
                StatusId = dto.StatusId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId")),
                Code = dto.Code,
                DocumentId = dto.DocumentId
            };

            var sideFrame = new SideFrame
            {
                Part = part,
                ServiceLifeYears = dto.ServiceLifeYears,
                ExtendedUntil = dto.ExtendedUntil
            };

            context.Add(part);
            context.Add(sideFrame);
            await context.SaveChangesAsync();

            return Results.Created($"/api/parts/{part.Id}", part.Id);
        })
        .WithName("CreateSideFrame")
        .WithOpenApi(operation => 
        {
            operation.Description = "Создание новой боковой рамы";
            operation.Summary = "Create new side frame";
            
            var response = new OpenApiResponse
            {
                Description = "Success",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new Microsoft.OpenApi.Any.OpenApiString("3fa85f64-5717-4562-b3fc-2c963f66afa6")
                    }
                }
            };
            operation.Responses["201"] = response;
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<Guid>(StatusCodes.Status201Created)
        .RequirePermissions(Permission.Create);

        // Создание надрессорной балки
        group.MapPost("/bolsters", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateBolsterDTO dto,
            HttpContext httpContext) =>
        {
            var part = new Part
            {
                PartTypeId = dto.PartTypeId,
                DepotId = dto.DepotId,
                StampNumberId = dto.StampNumberId,
                SerialNumber = dto.SerialNumber,
                ManufactureYear = dto.ManufactureYear,
                StatusId = dto.StatusId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId")),
                Code = dto.Code,
                DocumentId = dto.DocumentId
            };

            var bolster = new Bolster
            {
                Part = part,
                ServiceLifeYears = dto.ServiceLifeYears,
                ExtendedUntil = dto.ExtendedUntil
            };

            context.Add(part);
            context.Add(bolster);
            await context.SaveChangesAsync();

            return Results.Created($"/api/parts/{part.Id}", part.Id);
        })
        .WithName("CreateBolster")
        .WithOpenApi(operation => 
        {
            operation.Description = "Создание новой надрессорной балки";
            operation.Summary = "Create new bolster";
            
            var response = new OpenApiResponse
            {
                Description = "Success",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new Microsoft.OpenApi.Any.OpenApiString("3fa85f64-5717-4562-b3fc-2c963f66afa6")
                    }
                }
            };
            operation.Responses["201"] = response;
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<Guid>(StatusCodes.Status201Created)
        .RequirePermissions(Permission.Create);

        // Создание автосцепки
        group.MapPost("/couplers", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateCouplerDTO dto,
            HttpContext httpContext) =>
        {
            var part = new Part
            {
                PartTypeId = dto.PartTypeId,
                DepotId = dto.DepotId,
                StampNumberId = dto.StampNumberId,
                SerialNumber = dto.SerialNumber,
                ManufactureYear = dto.ManufactureYear,
                StatusId = dto.StatusId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId")),
                Code = dto.Code,
                DocumentId = dto.DocumentId
            };

            var coupler = new Coupler
            {
                Part = part
            };

            context.Add(part);
            context.Add(coupler);
            await context.SaveChangesAsync();

            return Results.Created($"/api/parts/{part.Id}", part.Id);
        })
        .WithName("CreateCoupler")
        .WithOpenApi(operation => 
        {
            operation.Description = "Создание новой автосцепки";
            operation.Summary = "Create new coupler";
            
            var response = new OpenApiResponse
            {
                Description = "Success",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new Microsoft.OpenApi.Any.OpenApiString("3fa85f64-5717-4562-b3fc-2c963f66afa6")
                    }
                }
            };
            operation.Responses["201"] = response;
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<Guid>(StatusCodes.Status201Created)
        .RequirePermissions(Permission.Create);

        // Создание поглощающего аппарата
        group.MapPost("/shock-absorbers", async (
            [FromServices] ApplicationDbContext context,
            [FromBody] CreateShockAbsorberDTO dto,
            HttpContext httpContext) =>
        {
            var part = new Part
            {
                PartTypeId = dto.PartTypeId,
                DepotId = dto.DepotId,
                StampNumberId = dto.StampNumberId,
                SerialNumber = dto.SerialNumber,
                ManufactureYear = dto.ManufactureYear,
                StatusId = dto.StatusId,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatorId = Guid.Parse(httpContext.User.FindFirstValue("userId")),
                Code = dto.Code,
                DocumentId = dto.DocumentId
            };

            var shockAbsorber = new ShockAbsorber
            {
                Part = part,
                Model = dto.Model,
                ManufacturerCode = dto.ManufacturerCode,
                NextRepairDate = dto.NextRepairDate,
                ServiceLifeYears = dto.ServiceLifeYears
            };

            context.Add(part);
            context.Add(shockAbsorber);
            await context.SaveChangesAsync();

            return Results.Created($"/api/parts/{part.Id}", part.Id);
        })
        .WithName("CreateShockAbsorber")
        .WithOpenApi(operation => 
        {
            operation.Description = "Создание нового поглощающего аппарата";
            operation.Summary = "Create new shock absorber";
            
            var response = new OpenApiResponse
            {
                Description = "Success",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Example = new Microsoft.OpenApi.Any.OpenApiString("3fa85f64-5717-4562-b3fc-2c963f66afa6")
                    }
                }
            };
            operation.Responses["201"] = response;
            return operation;
        })
        .ProducesValidationProblem()
        .Produces<Guid>(StatusCodes.Status201Created)
        .RequirePermissions(Permission.Create);

        // Обновление колесной пары
        group.MapPut("/wheel-pairs/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdateWheelPairDTO dto) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = await context.Parts
                .Include(p => p.WheelPair)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (part == null || part.WheelPair == null)
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

            // Обновляем специфичные поля
            part.WheelPair.ThicknessLeft = dto.ThicknessLeft;
            part.WheelPair.ThicknessRight = dto.ThicknessRight;
            part.WheelPair.WheelType = dto.WheelType;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateWheelPair")
        .WithOpenApi(operation => 
        {
            operation.Description = "Обновление колесной пары";
            operation.Summary = "Update wheel pair";
            return operation;
        })
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        // Обновление боковой рамы
        group.MapPut("/side-frames/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdateSideFrameDTO dto) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = await context.Parts
                .Include(p => p.SideFrame)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (part == null || part.SideFrame == null)
                return Results.NotFound();

            part.DepotId = dto.DepotId;
            part.StampNumberId = dto.StampNumberId;
            part.SerialNumber = dto.SerialNumber;
            part.ManufactureYear = dto.ManufactureYear;
            part.CurrentLocation = dto.CurrentLocation;
            part.StatusId = dto.StatusId;
            part.Notes = dto.Notes;
            part.UpdatedAt = DateTime.UtcNow;

            part.SideFrame.ServiceLifeYears = dto.ServiceLifeYears;
            part.SideFrame.ExtendedUntil = dto.ExtendedUntil;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateSideFrame")
        .WithOpenApi(operation => 
        {
            operation.Description = "Обновление боковой рамы";
            operation.Summary = "Update side frame";
            return operation;
        })
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        // Обновление надрессорной балки
        group.MapPut("/bolsters/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdateBolsterDTO dto) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = await context.Parts
                .Include(p => p.Bolster)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (part == null || part.Bolster == null)
                return Results.NotFound();

            part.DepotId = dto.DepotId;
            part.StampNumberId = dto.StampNumberId;
            part.SerialNumber = dto.SerialNumber;
            part.ManufactureYear = dto.ManufactureYear;
            part.CurrentLocation = dto.CurrentLocation;
            part.StatusId = dto.StatusId;
            part.Notes = dto.Notes;
            part.UpdatedAt = DateTime.UtcNow;

            part.Bolster.ServiceLifeYears = dto.ServiceLifeYears;
            part.Bolster.ExtendedUntil = dto.ExtendedUntil;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateBolster")
        .WithOpenApi(operation => 
        {
            operation.Description = "Обновление надрессорной балки";
            operation.Summary = "Update bolster";
            return operation;
        })
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        // Обновление автосцепки
        group.MapPut("/couplers/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdateCouplerDTO dto) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = await context.Parts
                .Include(p => p.Coupler)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (part == null || part.Coupler == null)
                return Results.NotFound();

            part.DepotId = dto.DepotId;
            part.StampNumberId = dto.StampNumberId;
            part.SerialNumber = dto.SerialNumber;
            part.ManufactureYear = dto.ManufactureYear;
            part.CurrentLocation = dto.CurrentLocation;
            part.StatusId = dto.StatusId;
            part.Notes = dto.Notes;
            part.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateCoupler")
        .WithOpenApi(operation => 
        {
            operation.Description = "Обновление автосцепки";
            operation.Summary = "Update coupler";
            return operation;
        })
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound)
        .RequirePermissions(Permission.Update);

        // Обновление поглощающего аппарата
        group.MapPut("/shock-absorbers/{id}", async (
            [FromServices] ApplicationDbContext context,
            Guid id,
            [FromBody] UpdateShockAbsorberDTO dto) =>
        {
            // Validate: can't have both depot and current location
            if (dto.DepotId.HasValue && dto.CurrentLocation.HasValue)
                return Results.BadRequest("Cannot set both depot and current location");

            var part = await context.Parts
                .Include(p => p.ShockAbsorber)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (part == null || part.ShockAbsorber == null)
                return Results.NotFound();

            part.DepotId = dto.DepotId;
            part.StampNumberId = dto.StampNumberId;
            part.SerialNumber = dto.SerialNumber;
            part.ManufactureYear = dto.ManufactureYear;
            part.CurrentLocation = dto.CurrentLocation;
            part.StatusId = dto.StatusId;
            part.Notes = dto.Notes;
            part.UpdatedAt = DateTime.UtcNow;

            part.ShockAbsorber.Model = dto.Model;
            part.ShockAbsorber.ManufacturerCode = dto.ManufacturerCode;
            part.ShockAbsorber.NextRepairDate = dto.NextRepairDate;
            part.ShockAbsorber.ServiceLifeYears = dto.ServiceLifeYears;

            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithName("UpdateShockAbsorber")
        .WithOpenApi(operation => 
        {
            operation.Description = "Обновление поглощающего аппарата";
            operation.Summary = "Update shock absorber";
            return operation;
        })
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
        .WithOpenApi(operation => 
        {
            operation.Description = "Удаление детали";
            operation.Summary = "Delete part";
            return operation;
        })
        .ProducesValidationProblem()
        .Produces(StatusCodes.Status204NoContent)
        .RequirePermissions(Permission.Delete);
    }
}
