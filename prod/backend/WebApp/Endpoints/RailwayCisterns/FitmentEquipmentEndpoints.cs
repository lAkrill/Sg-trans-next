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
                [FromQuery] Guid? cisternId = null,
                [FromQuery] string? operations = null) =>
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
                    .Include(fe => fe.AcceptUser)
                    .Include(fe => fe.InstallUser)
                    .Include(fe => fe.ApprovUser)
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

                // operations: "3" или "1,2"
                var operationFilter = string.IsNullOrWhiteSpace(operations)
                    ? Array.Empty<int>()
                    : operations
                        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Select(int.Parse)
                        .ToArray();

                if (operationFilter.Length > 0)
                {
                    query = query.Where(fe => operationFilter.Contains(fe.Operation));
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
                        AcceptUserId = fe.AcceptUserId,
                        InstallUserId = fe.InstallUserId,
                        ApprovUserId = fe.ApprovUserId,
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
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                LastName = fe.JobUser.LastName,
                                FirstName = fe.JobUser.FirstName,
                                Patronymic = fe.JobUser.Patronymic,
                                Initials = fe.JobUser.Initials,
                                Position = fe.JobUser.Position
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                LastName = fe.TestUser.LastName,
                                FirstName = fe.TestUser.FirstName,
                                Patronymic = fe.TestUser.Patronymic,
                                Initials = fe.TestUser.Initials,
                                Position = fe.TestUser.Position
                            }
                            : null,
                        AcceptUser = fe.AcceptUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.AcceptUser.Id,
                                LastName = fe.AcceptUser.LastName,
                                FirstName = fe.AcceptUser.FirstName,
                                Patronymic = fe.AcceptUser.Patronymic,
                                Initials = fe.AcceptUser.Initials,
                                Position = fe.AcceptUser.Position
                            }
                            : null,
                        InstallUser = fe.InstallUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.InstallUser.Id,
                                LastName = fe.InstallUser.LastName,
                                FirstName = fe.InstallUser.FirstName,
                                Patronymic = fe.InstallUser.Patronymic,
                                Initials = fe.InstallUser.Initials,
                                Position = fe.InstallUser.Position
                            }
                            : null,
                        ApprovUser = fe.ApprovUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.ApprovUser.Id,
                                LastName = fe.ApprovUser.LastName,
                                FirstName = fe.ApprovUser.FirstName,
                                Patronymic = fe.ApprovUser.Patronymic,
                                Initials = fe.ApprovUser.Initials,
                                Position = fe.ApprovUser.Position
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
                    .Include(fe => fe.AcceptUser)
                    .Include(fe => fe.InstallUser)
                    .Include(fe => fe.ApprovUser)
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
                        AcceptUserId = fe.AcceptUserId,
                        InstallUserId = fe.InstallUserId,
                        ApprovUserId = fe.ApprovUserId,
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
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                LastName = fe.JobUser.LastName,
                                FirstName = fe.JobUser.FirstName,
                                Patronymic = fe.JobUser.Patronymic,
                                Initials = fe.JobUser.Initials,
                                Position = fe.JobUser.Position
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                LastName = fe.TestUser.LastName,
                                FirstName = fe.TestUser.FirstName,
                                Patronymic = fe.TestUser.Patronymic,
                                Initials = fe.TestUser.Initials,
                                Position = fe.TestUser.Position
                            }
                            : null,
                        AcceptUser = fe.AcceptUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.AcceptUser.Id,
                                LastName = fe.AcceptUser.LastName,
                                FirstName = fe.AcceptUser.FirstName,
                                Patronymic = fe.AcceptUser.Patronymic,
                                Initials = fe.AcceptUser.Initials,
                                Position = fe.AcceptUser.Position
                            }
                            : null,
                        InstallUser = fe.InstallUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.InstallUser.Id,
                                LastName = fe.InstallUser.LastName,
                                FirstName = fe.InstallUser.FirstName,
                                Patronymic = fe.InstallUser.Patronymic,
                                Initials = fe.InstallUser.Initials,
                                Position = fe.InstallUser.Position
                            }
                            : null,
                        ApprovUser = fe.ApprovUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.ApprovUser.Id,
                                LastName = fe.ApprovUser.LastName,
                                FirstName = fe.ApprovUser.FirstName,
                                Patronymic = fe.ApprovUser.Patronymic,
                                Initials = fe.ApprovUser.Initials,
                                Position = fe.ApprovUser.Position
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
                    .Include(fe => fe.AcceptUser)
                    .Include(fe => fe.InstallUser)
                    .Include(fe => fe.ApprovUser)
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
                    AcceptUserId = entity.AcceptUserId,
                    InstallUserId = entity.InstallUserId,
                    ApprovUserId = entity.ApprovUserId,
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
                        ? new EmployeeInfoDTO
                        {
                            Id = entity.JobUser.Id,
                            LastName = entity.JobUser.LastName,
                            FirstName = entity.JobUser.FirstName,
                            Patronymic = entity.JobUser.Patronymic,
                            Initials = entity.JobUser.Initials,
                            Position = entity.JobUser.Position
                        }
                        : null,
                    TestUser = entity.TestUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = entity.TestUser.Id,
                            LastName = entity.TestUser.LastName,
                            FirstName = entity.TestUser.FirstName,
                            Patronymic = entity.TestUser.Patronymic,
                            Initials = entity.TestUser.Initials,
                            Position = entity.TestUser.Position
                        }
                        : null,
                    AcceptUser = entity.AcceptUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = entity.AcceptUser.Id,
                            LastName = entity.AcceptUser.LastName,
                            FirstName = entity.AcceptUser.FirstName,
                            Patronymic = entity.AcceptUser.Patronymic,
                            Initials = entity.AcceptUser.Initials,
                            Position = entity.AcceptUser.Position
                        }
                        : null,
                    InstallUser = entity.InstallUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = entity.InstallUser.Id,
                            LastName = entity.InstallUser.LastName,
                            FirstName = entity.InstallUser.FirstName,
                            Patronymic = entity.InstallUser.Patronymic,
                            Initials = entity.InstallUser.Initials,
                            Position = entity.InstallUser.Position
                        }
                        : null,
                    ApprovUser = entity.ApprovUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = entity.ApprovUser.Id,
                            LastName = entity.ApprovUser.LastName,
                            FirstName = entity.ApprovUser.FirstName,
                            Patronymic = entity.ApprovUser.Patronymic,
                            Initials = entity.ApprovUser.Initials,
                            Position = entity.ApprovUser.Position
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
                        AcceptUserId = fe.AcceptUserId,
                        InstallUserId = fe.InstallUserId,
                        ApprovUserId = fe.ApprovUserId,
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
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                LastName = fe.JobUser.LastName,
                                FirstName = fe.JobUser.FirstName,
                                Patronymic = fe.JobUser.Patronymic,
                                Initials = fe.JobUser.Initials,
                                Position = fe.JobUser.Position
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                LastName = fe.TestUser.LastName,
                                FirstName = fe.TestUser.FirstName,
                                Patronymic = fe.TestUser.Patronymic,
                                Initials = fe.TestUser.Initials,
                                Position = fe.TestUser.Position
                            }
                            : null,
                        AcceptUser = fe.AcceptUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.AcceptUser.Id,
                                LastName = fe.AcceptUser.LastName,
                                FirstName = fe.AcceptUser.FirstName,
                                Patronymic = fe.AcceptUser.Patronymic,
                                Initials = fe.AcceptUser.Initials,
                                Position = fe.AcceptUser.Position
                            }
                            : null,
                        InstallUser = fe.InstallUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.InstallUser.Id,
                                LastName = fe.InstallUser.LastName,
                                FirstName = fe.InstallUser.FirstName,
                                Patronymic = fe.InstallUser.Patronymic,
                                Initials = fe.InstallUser.Initials,
                                Position = fe.InstallUser.Position
                            }
                            : null,
                        ApprovUser = fe.ApprovUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.ApprovUser.Id,
                                LastName = fe.ApprovUser.LastName,
                                FirstName = fe.ApprovUser.FirstName,
                                Patronymic = fe.ApprovUser.Patronymic,
                                Initials = fe.ApprovUser.Initials,
                                Position = fe.ApprovUser.Position
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
                    .ToListAsync();

                var result = lastItems
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
                        AcceptUserId = fe.AcceptUserId,
                        InstallUserId = fe.InstallUserId,
                        ApprovUserId = fe.ApprovUserId,
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
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                LastName = fe.JobUser.LastName,
                                FirstName = fe.JobUser.FirstName,
                                Patronymic = fe.JobUser.Patronymic,
                                Initials = fe.JobUser.Initials,
                                Position = fe.JobUser.Position
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                LastName = fe.TestUser.LastName,
                                FirstName = fe.TestUser.FirstName,
                                Patronymic = fe.TestUser.Patronymic,
                                Initials = fe.TestUser.Initials,
                                Position = fe.TestUser.Position
                            }
                            : null,
                        AcceptUser = fe.AcceptUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.AcceptUser.Id,
                                LastName = fe.AcceptUser.LastName,
                                FirstName = fe.AcceptUser.FirstName,
                                Patronymic = fe.AcceptUser.Patronymic,
                                Initials = fe.AcceptUser.Initials,
                                Position = fe.AcceptUser.Position
                            }
                            : null,
                        InstallUser = fe.InstallUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.InstallUser.Id,
                                LastName = fe.InstallUser.LastName,
                                FirstName = fe.InstallUser.FirstName,
                                Patronymic = fe.InstallUser.Patronymic,
                                Initials = fe.InstallUser.Initials,
                                Position = fe.InstallUser.Position
                            }
                            : null,
                        ApprovUser = fe.ApprovUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.ApprovUser.Id,
                                LastName = fe.ApprovUser.LastName,
                                FirstName = fe.ApprovUser.FirstName,
                                Patronymic = fe.ApprovUser.Patronymic,
                                Initials = fe.ApprovUser.Initials,
                                Position = fe.ApprovUser.Position
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
                    .ToList();

                return Results.Ok(result);
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
                        AcceptUserId = fe.AcceptUserId,
                        InstallUserId = fe.InstallUserId,
                        ApprovUserId = fe.ApprovUserId,
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
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.JobUser.Id,
                                LastName = fe.JobUser.LastName,
                                FirstName = fe.JobUser.FirstName,
                                Patronymic = fe.JobUser.Patronymic,
                                Initials = fe.JobUser.Initials,
                                Position = fe.JobUser.Position
                            }
                            : null,
                        TestUser = fe.TestUser != null
                            ? new EmployeeInfoDTO
                            {
                                Id = fe.TestUser.Id,
                                LastName = fe.TestUser.LastName,
                                FirstName = fe.TestUser.FirstName,
                                Patronymic = fe.TestUser.Patronymic,
                                Initials = fe.TestUser.Initials,
                                Position = fe.TestUser.Position
                            }
                            : null,
                        AcceptUser = fe.AcceptUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = fe.AcceptUser.Id,
                            LastName = fe.AcceptUser.LastName,
                            FirstName = fe.AcceptUser.FirstName,
                            Patronymic = fe.AcceptUser.Patronymic,
                            Initials = fe.AcceptUser.Initials,
                            Position = fe.AcceptUser.Position
                        }
                        : null,
                        InstallUser = fe.InstallUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = fe.InstallUser.Id,
                            LastName = fe.InstallUser.LastName,
                            FirstName = fe.InstallUser.FirstName,
                            Patronymic = fe.InstallUser.Patronymic,
                            Initials = fe.InstallUser.Initials,
                            Position = fe.InstallUser.Position
                        }
                        : null,
                        ApprovUser = fe.ApprovUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = fe.ApprovUser.Id,
                            LastName = fe.ApprovUser.LastName,
                            FirstName = fe.ApprovUser.FirstName,
                            Patronymic = fe.ApprovUser.Patronymic,
                            Initials = fe.ApprovUser.Initials,
                            Position = fe.ApprovUser.Position
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

        group.MapGet("/last-by-fitment/{fitmentId}", async ([FromServices] ApplicationDbContext context, Guid fitmentId) =>
            {
                var lastEquipment = await context.Set<FitmentEquipment>()
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
                    .ThenByDescending(fe => fe.Id)
                    .FirstOrDefaultAsync();

                if (lastEquipment is null)
                {
                    return Results.NotFound();
                }

                var dto = new FitmentEquipmentDTO
                {
                    Id = lastEquipment.Id,
                    RailwayCisternsId = lastEquipment.RailwayCisternsId,
                    Operation = lastEquipment.Operation,
                    FitmentId = lastEquipment.FitmentId,
                    JobUserId = lastEquipment.JobUserId,
                    TestUserId = lastEquipment.TestUserId,
                    AcceptUserId = lastEquipment.AcceptUserId,
                    InstallUserId = lastEquipment.InstallUserId,
                    ApprovUserId = lastEquipment.ApprovUserId,
                    DepoId = lastEquipment.DepoId,
                    Date = lastEquipment.Date,
                    DocumentId = lastEquipment.DocumentId,
                    RailwayCistern = lastEquipment.RailwayCistern != null
                        ? new RailwayCisternDTO
                        {
                            Id = lastEquipment.RailwayCistern.Id,
                            Number = lastEquipment.RailwayCistern.Number,
                            Model = lastEquipment.RailwayCistern.Model.Name,
                            Owner = lastEquipment.RailwayCistern.Owner.UNP,
                        }
                        : null,
                    Fitment = lastEquipment.Fitment != null
                        ? new FitmentInfoDTO
                        {
                            Id = lastEquipment.Fitment.Id,
                            SerialNumber = lastEquipment.Fitment.SerialNumber,
                            PassportNumber = lastEquipment.Fitment.PassportNumber,
                            FitmentTypeName = lastEquipment.Fitment.FitmentType.Name
                        }
                        : null,
                    JobUser = lastEquipment.JobUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = lastEquipment.JobUser.Id,
                            LastName = lastEquipment.JobUser.LastName,
                            FirstName = lastEquipment.JobUser.FirstName,
                            Patronymic = lastEquipment.JobUser.Patronymic,
                            Initials = lastEquipment.JobUser.Initials,
                            Position = lastEquipment.JobUser.Position
                        }
                        : null,
                    TestUser = lastEquipment.TestUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = lastEquipment.TestUser.Id,
                            LastName = lastEquipment.TestUser.LastName,
                            FirstName = lastEquipment.TestUser.FirstName,
                            Patronymic = lastEquipment.TestUser.Patronymic,
                            Initials = lastEquipment.TestUser.Initials,
                            Position = lastEquipment.TestUser.Position
                        }
                        : null,
                    AcceptUser = lastEquipment.AcceptUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = lastEquipment.AcceptUser.Id,
                            LastName = lastEquipment.AcceptUser.LastName,
                            FirstName = lastEquipment.AcceptUser.FirstName,
                            Patronymic = lastEquipment.AcceptUser.Patronymic,
                            Initials = lastEquipment.AcceptUser.Initials,
                            Position = lastEquipment.AcceptUser.Position
                        }
                        : null,
                    InstallUser = lastEquipment.InstallUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = lastEquipment.InstallUser.Id,
                            LastName = lastEquipment.InstallUser.LastName,
                            FirstName = lastEquipment.InstallUser.FirstName,
                            Patronymic = lastEquipment.InstallUser.Patronymic,
                            Initials = lastEquipment.InstallUser.Initials,
                            Position = lastEquipment.InstallUser.Position
                        }
                        : null,
                    ApprovUser = lastEquipment.ApprovUser != null
                        ? new EmployeeInfoDTO
                        {
                            Id = lastEquipment.ApprovUser.Id,
                            LastName = lastEquipment.ApprovUser.LastName,
                            FirstName = lastEquipment.ApprovUser.FirstName,
                            Patronymic = lastEquipment.ApprovUser.Patronymic,
                            Initials = lastEquipment.ApprovUser.Initials,
                            Position = lastEquipment.ApprovUser.Position
                        }
                        : null,
                    Depot = lastEquipment.Depot != null
                        ? new DepotDTO
                        {
                            Id = lastEquipment.Depot.Id,
                            Name = lastEquipment.Depot.Name,
                            Code = lastEquipment.Depot.Code,
                            Location = lastEquipment.Depot.Location,
                            ShortName = lastEquipment.Depot.ShortName
                        }
                        : null,
                    Document = lastEquipment.Document != null
                        ? new DocumentDTO
                        {
                            Id = lastEquipment.Document.Id,
                            Number = lastEquipment.Document.Number,
                            Type = lastEquipment.Document.Type,
                            Date = lastEquipment.Document.Date,
                            Author = lastEquipment.Document.Author,
                            Price = lastEquipment.Document.Price,
                            Note = lastEquipment.Document.Note
                        }
                        : null
                };

                return Results.Ok(dto);
            })
            .WithName("GetLastFitmentEquipmentByFitment")
            .Produces<FitmentEquipmentDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
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
                    AcceptUserId = dto.AcceptUserId,
                    InstallUserId = dto.InstallUserId,
                    ApprovUserId = dto.ApprovUserId,
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
