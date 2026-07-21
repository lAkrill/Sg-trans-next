using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class FitmentEquipmentEndpoints
{
    public static void MapFitmentEquipmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/fitment-equipments")
            .RequireAuthorization()
            .WithTags("fitment-equipments");

        group.MapGet("/", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] int pageNumber = 1,
                [FromQuery] int pageSize = 10,
                [FromQuery] Guid? cisternId = null) =>
            {
                var parameters = new PaginationParameters
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var query = context.Set<FitmentEquipment>()
                    .Include(fe => fe.Fitment)
                    .ThenInclude(f => f.FitmentType)
                    .Include(fe => fe.JobUser)
                    .Include(fe => fe.TestUser)
                    .Include(fe => fe.Depot)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Manufacturer)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Type)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Model)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Owner)
                    .Include(fe => fe.Document)
                    .AsQueryable();

                if (cisternId.HasValue)
                {
                    query = query.Where(fe => fe.RailwayCisternsId == cisternId);
                }

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)parameters.PageSize);

                var items = await query
                    .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                    .Take(parameters.PageSize)
                    .Select(fe => new FitmentEquipmentDTO
                    {
                        Id = fe.Id,
                        RailwayCisternsId = fe.RailwayCisternsId,
                        Operation = fe.Operation,
                        FitmentId = fe.FitmentId,
                        JobUserId = fe.JobUserId,
                        TestUserId = fe.TestUserId,
                        DepoId = fe.DepoId,
                        Date = fe.Date,
                        DocumentId = fe.DocumentId,
                        RailwayCistern = fe.RailwayCistern != null
                            ? new RailwayCisternDTO
                            {
                                Id = fe.RailwayCistern.Id,
                                Number = fe.RailwayCistern.Number,
                                Model = fe.RailwayCistern.Model.Name,
                                Owner = fe.RailwayCistern.Owner.UNP,
                            }
                            : null,
                        Fitment = fe.Fitment != null
                            ? new FitmentInfoDTO
                            {
                                Id = fe.Fitment.Id,
                                SerialNumber = fe.Fitment.SerialNumber,
                                PassportNumber = fe.Fitment.PassportNumber,
                                FitmentTypeName = fe.Fitment.FitmentType.Name
                            }
                            : null,
                        JobUser = fe.JobUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                Email = fe.JobUser.Email,
                                FirstName = fe.JobUser.FirstName,
                                LastName = fe.JobUser.LastName
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                Email = fe.TestUser.Email,
                                FirstName = fe.TestUser.FirstName,
                                LastName = fe.TestUser.LastName
                            }
                            : null,
                        Depot = fe.Depot != null
                            ? new DepotDTO
                            {
                                Id = fe.Depot.Id,
                                Name = fe.Depot.Name,
                                Code = fe.Depot.Code,
                                Location = fe.Depot.Location,
                                ShortName = fe.Depot.ShortName
                            }
                            : null,
                        Document = fe.Document != null
                            ? new DocumentDTO
                            {
                                Id = fe.Document.Id,
                                Number = fe.Document.Number,
                                Type = fe.Document.Type,
                                Date = fe.Document.Date,
                                Author = fe.Document.Author,
                                Price = fe.Document.Price,
                                Note = fe.Document.Note
                            }
                            : null
                    })
                    .ToListAsync();

                return Results.Ok(new PaginatedList<FitmentEquipmentDTO>
                {
                    Items = items,
                    PageNumber = parameters.PageNumber,
                    TotalPages = totalPages,
                    TotalCount = totalCount,
                    PageSize = parameters.PageSize
                });
            })
            .WithName("GetFitmentEquipments")
            .Produces<PaginatedList<FitmentEquipmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/all/", async ([FromServices] ApplicationDbContext context, [FromQuery] Guid? cisternId = null) =>
            {
                var query = context.Set<FitmentEquipment>()
                    .Include(fe => fe.Fitment)
                    .ThenInclude(f => f.FitmentType)
                    .Include(fe => fe.JobUser)
                    .Include(fe => fe.TestUser)
                    .Include(fe => fe.Depot)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Manufacturer)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Type)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Model)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Owner)
                    .Include(fe => fe.Document)
                    .AsQueryable();

                if (cisternId.HasValue)
                {
                    query = query.Where(fe => fe.RailwayCisternsId == cisternId);
                }

                var items = await query
                    .Select(fe => new FitmentEquipmentDTO
                    {
                        Id = fe.Id,
                        RailwayCisternsId = fe.RailwayCisternsId,
                        Operation = fe.Operation,
                        FitmentId = fe.FitmentId,
                        JobUserId = fe.JobUserId,
                        TestUserId = fe.TestUserId,
                        DepoId = fe.DepoId,
                        Date = fe.Date,
                        DocumentId = fe.DocumentId,
                        RailwayCistern = fe.RailwayCistern != null
                            ? new RailwayCisternDTO
                            {
                                Id = fe.RailwayCistern.Id,
                                Number = fe.RailwayCistern.Number,
                                Model = fe.RailwayCistern.Model.Name,
                                Owner = fe.RailwayCistern.Owner.UNP,
                            }
                            : null,
                        Fitment = fe.Fitment != null
                            ? new FitmentInfoDTO
                            {
                                Id = fe.Fitment.Id,
                                SerialNumber = fe.Fitment.SerialNumber,
                                PassportNumber = fe.Fitment.PassportNumber,
                                FitmentTypeName = fe.Fitment.FitmentType.Name
                            }
                            : null,
                        JobUser = fe.JobUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                Email = fe.JobUser.Email,
                                FirstName = fe.JobUser.FirstName,
                                LastName = fe.JobUser.LastName
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                Email = fe.TestUser.Email,
                                FirstName = fe.TestUser.FirstName,
                                LastName = fe.TestUser.LastName
                            }
                            : null,
                        Depot = fe.Depot != null
                            ? new DepotDTO
                            {
                                Id = fe.Depot.Id,
                                Name = fe.Depot.Name,
                                Code = fe.Depot.Code,
                                Location = fe.Depot.Location,
                                ShortName = fe.Depot.ShortName
                            }
                            : null,
                        Document = fe.Document != null
                            ? new DocumentDTO
                            {
                                Id = fe.Document.Id,
                                Number = fe.Document.Number,
                                Type = fe.Document.Type,
                                Date = fe.Document.Date,
                                Author = fe.Document.Author,
                                Price = fe.Document.Price,
                                Note = fe.Document.Note
                            }
                            : null
                    })
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetAllFitmentEquipments")
            .Produces<List<FitmentEquipmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
            {
                var entity = await context.Set<FitmentEquipment>()
                    .Include(fe => fe.Fitment)
                    .ThenInclude(f => f.FitmentType)
                    .Include(fe => fe.JobUser)
                    .Include(fe => fe.TestUser)
                    .Include(fe => fe.Depot)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Manufacturer)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Type)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Model)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Owner)
                    .Include(fe => fe.Document)
                    .FirstOrDefaultAsync(fe => fe.Id == id);

                if (entity is null)
                {
                    return Results.NotFound();
                }

                var dto = new FitmentEquipmentDTO
                {
                    Id = entity.Id,
                    RailwayCisternsId = entity.RailwayCisternsId,
                    Operation = entity.Operation,
                    FitmentId = entity.FitmentId,
                    JobUserId = entity.JobUserId,
                    TestUserId = entity.TestUserId,
                    DepoId = entity.DepoId,
                    Date = entity.Date,
                    DocumentId = entity.DocumentId,
                    RailwayCistern = entity.RailwayCistern != null
                        ? new RailwayCisternDTO
                        {
                            Id = entity.RailwayCistern.Id,
                            Number = entity.RailwayCistern.Number,
                            Model = entity.RailwayCistern.Model.Name,
                            Owner = entity.RailwayCistern.Owner.UNP,
                        }
                        : null,
                    Fitment = entity.Fitment != null
                        ? new FitmentInfoDTO
                        {
                            Id = entity.Fitment.Id,
                            SerialNumber = entity.Fitment.SerialNumber,
                            PassportNumber = entity.Fitment.PassportNumber,
                            FitmentTypeName = entity.Fitment.FitmentType.Name
                        }
                        : null,
                    JobUser = entity.JobUser != null
                        ? new UserInfoDTO
                        {
                            Id = entity.JobUser.Id,
                            Email = entity.JobUser.Email,
                            FirstName = entity.JobUser.FirstName,
                            LastName = entity.JobUser.LastName
                        }
                        : null,
                    TestUser = entity.TestUser != null
                        ? new UserInfoDTO
                        {
                            Id = entity.TestUser.Id,
                            Email = entity.TestUser.Email,
                            FirstName = entity.TestUser.FirstName,
                            LastName = entity.TestUser.LastName
                        }
                        : null,
                    Depot = entity.Depot != null
                        ? new DepotDTO
                        {
                            Id = entity.Depot.Id,
                            Name = entity.Depot.Name,
                            Code = entity.Depot.Code,
                            Location = entity.Depot.Location,
                            ShortName = entity.Depot.ShortName
                        }
                        : null,
                    Document = entity.Document != null
                        ? new DocumentDTO
                        {
                            Id = entity.Document.Id,
                            Number = entity.Document.Number,
                            Type = entity.Document.Type,
                            Date = entity.Document.Date,
                            Author = entity.Document.Author,
                            Price = entity.Document.Price,
                            Note = entity.Document.Note
                        }
                        : null
                };

                return Results.Ok(dto);
            })
            .WithName("GetFitmentEquipmentById")
            .Produces<FitmentEquipmentDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        group.MapGet("/by-cistern/{cisternId}", async ([FromServices] ApplicationDbContext context, Guid cisternId) =>
            {
                var items = await context.Set<FitmentEquipment>()
                    .AsNoTracking()
                    .Include(fe => fe.Fitment)
                    .ThenInclude(f => f.FitmentType)
                    .Include(fe => fe.JobUser)
                    .Include(fe => fe.TestUser)
                    .Include(fe => fe.Depot)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Manufacturer)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Type)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Model)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Owner)
                    .Include(fe => fe.Document)
                    .Where(fe => fe.RailwayCisternsId == cisternId)
                    .OrderByDescending(fe => fe.Date)
                    .Select(fe => new FitmentEquipmentDTO
                    {
                        Id = fe.Id,
                        RailwayCisternsId = fe.RailwayCisternsId,
                        Operation = fe.Operation,
                        FitmentId = fe.FitmentId,
                        JobUserId = fe.JobUserId,
                        TestUserId = fe.TestUserId,
                        DepoId = fe.DepoId,
                        Date = fe.Date,
                        DocumentId = fe.DocumentId,
                        RailwayCistern = fe.RailwayCistern != null
                            ? new RailwayCisternDTO
                            {
                                Id = fe.RailwayCistern.Id,
                                Number = fe.RailwayCistern.Number,
                                Model = fe.RailwayCistern.Model.Name,
                                Owner = fe.RailwayCistern.Owner.UNP,
                            }
                            : null,
                        Fitment = fe.Fitment != null
                            ? new FitmentInfoDTO
                            {
                                Id = fe.Fitment.Id,
                                SerialNumber = fe.Fitment.SerialNumber,
                                PassportNumber = fe.Fitment.PassportNumber,
                                FitmentTypeName = fe.Fitment.FitmentType.Name
                            }
                            : null,
                        JobUser = fe.JobUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                Email = fe.JobUser.Email,
                                FirstName = fe.JobUser.FirstName,
                                LastName = fe.JobUser.LastName
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                Email = fe.TestUser.Email,
                                FirstName = fe.TestUser.FirstName,
                                LastName = fe.TestUser.LastName
                            }
                            : null,
                        Depot = fe.Depot != null
                            ? new DepotDTO
                            {
                                Id = fe.Depot.Id,
                                Name = fe.Depot.Name,
                                Code = fe.Depot.Code,
                                Location = fe.Depot.Location,
                                ShortName = fe.Depot.ShortName
                            }
                            : null,
                        Document = fe.Document != null
                            ? new DocumentDTO
                            {
                                Id = fe.Document.Id,
                                Number = fe.Document.Number,
                                Type = fe.Document.Type,
                                Date = fe.Document.Date,
                                Author = fe.Document.Author,
                                Price = fe.Document.Price,
                                Note = fe.Document.Note
                            }
                            : null
                    })
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetFitmentEquipmentsByCistern")
            .Produces<List<FitmentEquipmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/last-by-cistern/{cisternId}", async ([FromServices] ApplicationDbContext context, Guid cisternId) =>
            {
                var lastItems = await context.Set<FitmentEquipment>()
                    .AsNoTracking()
                    .Where(fe => fe.RailwayCisternsId == cisternId)
                    .GroupBy(fe => fe.FitmentId)
                    .Select(g => g.OrderByDescending(fe => fe.Date).ThenByDescending(fe => fe.Id).FirstOrDefault())
                    .Where(fe => fe != null)
                    .Select(fe => new FitmentEquipmentDTO
                    {
                        Id = fe!.Id,
                        RailwayCisternsId = fe.RailwayCisternsId,
                        Operation = fe.Operation,
                        FitmentId = fe.FitmentId,
                        JobUserId = fe.JobUserId,
                        TestUserId = fe.TestUserId,
                        DepoId = fe.DepoId,
                        Date = fe.Date,
                        DocumentId = fe.DocumentId,
                        RailwayCistern = fe.RailwayCistern != null
                            ? new RailwayCisternDTO
                            {
                                Id = fe.RailwayCistern.Id,
                                Number = fe.RailwayCistern.Number,
                                Model = fe.RailwayCistern.Model.Name,
                                Owner = fe.RailwayCistern.Owner.UNP,
                            }
                            : null,
                        Fitment = fe.Fitment != null
                            ? new FitmentInfoDTO
                            {
                                Id = fe.Fitment.Id,
                                SerialNumber = fe.Fitment.SerialNumber,
                                PassportNumber = fe.Fitment.PassportNumber,
                                FitmentTypeName = fe.Fitment.FitmentType.Name
                            }
                            : null,
                        JobUser = fe.JobUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                Email = fe.JobUser.Email,
                                FirstName = fe.JobUser.FirstName,
                                LastName = fe.JobUser.LastName
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                Email = fe.TestUser.Email,
                                FirstName = fe.TestUser.FirstName,
                                LastName = fe.TestUser.LastName
                            }
                            : null,
                        Depot = fe.Depot != null
                            ? new DepotDTO
                            {
                                Id = fe.Depot.Id,
                                Name = fe.Depot.Name,
                                Code = fe.Depot.Code,
                                Location = fe.Depot.Location,
                                ShortName = fe.Depot.ShortName
                            }
                            : null,
                        Document = fe.Document != null
                            ? new DocumentDTO
                            {
                                Id = fe.Document.Id,
                                Number = fe.Document.Number,
                                Type = fe.Document.Type,
                                Date = fe.Document.Date,
                                Author = fe.Document.Author,
                                Price = fe.Document.Price,
                                Note = fe.Document.Note
                            }
                            : null
                    })
                    .ToListAsync();

                return Results.Ok(lastItems);
            })
            .WithName("GetLastFitmentEquipmentsByCistern")
            .Produces<List<FitmentEquipmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/by-fitment/{fitmentId}", async ([FromServices] ApplicationDbContext context, Guid fitmentId) =>
            {
                var items = await context.Set<FitmentEquipment>()
                    .AsNoTracking()
                    .Include(fe => fe.Fitment)
                    .ThenInclude(f => f.FitmentType)
                    .Include(fe => fe.JobUser)
                    .Include(fe => fe.TestUser)
                    .Include(fe => fe.Depot)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Manufacturer)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Type)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Model)
                    .Include(fe => fe.RailwayCistern)
                    .ThenInclude(rc => rc.Owner)
                    .Include(fe => fe.Document)
                    .Where(fe => fe.FitmentId == fitmentId)
                    .OrderByDescending(fe => fe.Date)
                    .Select(fe => new FitmentEquipmentDTO
                    {
                        Id = fe.Id,
                        RailwayCisternsId = fe.RailwayCisternsId,
                        Operation = fe.Operation,
                        FitmentId = fe.FitmentId,
                        JobUserId = fe.JobUserId,
                        TestUserId = fe.TestUserId,
                        DepoId = fe.DepoId,
                        Date = fe.Date,
                        DocumentId = fe.DocumentId,
                        RailwayCistern = fe.RailwayCistern != null
                            ? new RailwayCisternDTO
                            {
                                Id = fe.RailwayCistern.Id,
                                Number = fe.RailwayCistern.Number,
                                Model = fe.RailwayCistern.Model.Name,
                                Owner = fe.RailwayCistern.Owner.UNP,
                            }
                            : null,
                        Fitment = fe.Fitment != null
                            ? new FitmentInfoDTO
                            {
                                Id = fe.Fitment.Id,
                                SerialNumber = fe.Fitment.SerialNumber,
                                PassportNumber = fe.Fitment.PassportNumber,
                                FitmentTypeName = fe.Fitment.FitmentType.Name
                            }
                            : null,
                        JobUser = fe.JobUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                Email = fe.JobUser.Email,
                                FirstName = fe.JobUser.FirstName,
                                LastName = fe.JobUser.LastName
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new UserInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                Email = fe.TestUser.Email,
                                FirstName = fe.TestUser.FirstName,
                                LastName = fe.TestUser.LastName
                            }
                            : null,
                        Depot = fe.Depot != null
                            ? new DepotDTO
                            {
                                Id = fe.Depot.Id,
                                Name = fe.Depot.Name,
                                Code = fe.Depot.Code,
                                Location = fe.Depot.Location,
                                ShortName = fe.Depot.ShortName
                            }
                            : null,
                        Document = fe.Document != null
                            ? new DocumentDTO
                            {
                                Id = fe.Document.Id,
                                Number = fe.Document.Number,
                                Type = fe.Document.Type,
                                Date = fe.Document.Date,
                                Author = fe.Document.Author,
                                Price = fe.Document.Price,
                                Note = fe.Document.Note
                            }
                            : null
                    })
                    .ToListAsync();

                return Results.Ok(items);
            })
            .WithName("GetFitmentEquipmentsByFitment")
            .Produces<List<FitmentEquipmentDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CreateFitmentEquipmentDTO dto) =>
            {
                var entity = new FitmentEquipment
                {
                    Id = Guid.NewGuid(),
                    RailwayCisternsId = dto.RailwayCisternsId,
                    Operation = dto.Operation,
                    FitmentId = dto.FitmentId,
                    JobUserId = dto.JobUserId,
                    TestUserId = dto.TestUserId,
                    DepoId = dto.DepoId,
                    Date = dto.Date,
                    DocumentId = dto.DocumentId
                };

                context.Set<FitmentEquipment>().Add(entity);
                await context.SaveChangesAsync();

                return Results.Created($"/api/fitment-equipments/{entity.Id}", entity.Id);
            })
            .WithName("CreateFitmentEquipment")
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesValidationProblem()
            .RequirePermissions(Permission.Create);
    }
}
