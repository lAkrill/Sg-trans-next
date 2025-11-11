using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public record ResponseForVesselPagination(
    List<VesselListWithCisternNumberDTO> Vessels,
    int TotalCount,
    int TotalPages,
    int CurrentPage,
    int PageSize);

public static class VesselEndpoint
{
    public static void MapVesselEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/vessels")
            .RequireAuthorization()
            .WithTags("Vessels");

        group.MapGet("/", async ([FromServices] ApplicationDbContext context,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10) =>
            {
                var query = context.Vessels
                    .Include(v => v.RailwayCistern)
                    .AsQueryable();

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var vessels = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(v => new VesselListWithCisternNumberDTO()
                    {
                        Id = v.Id,
                        SerialNumber = v.SerialNumber,
                        BuildDate = v.BuildDate,
                        Manufacturer = v.Manufacturer,
                        WagonModelId = v.WagonModelId,
                        Pressure = v.Pressure,
                        Capacity = v.Capacity,
                        RailwayCisternIdAndNumberDto = v.RailwayCistern != null
                            ? new RailwayCisternIdAndNumberDTO()
                            {
                                Id = v.RailwayCistern.Id,
                                Number = v.RailwayCistern.Number
                            }
                            : null
                    })
                    .ToListAsync();
                var response = new ResponseForVesselPagination(vessels, 
                    totalCount, 
                    totalPages, 
                    page, 
                    pageSize);
                return Results.Ok(vessels);
            })
            .WithName("GetVessels")
            .ProducesValidationProblem()
            .Produces<ResponseForVesselPagination>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapGet("/{id}", async ([FromServices] ApplicationDbContext context, Guid id) =>
            {
                var vessels = await context.Vessels
                    .Include(v => v.RailwayCistern)
                    .Where(v => v.Id == id)
                    .Select(v => new VesselDTO()
                    {
                        Id = v.Id,
                        SerialNumber = v.SerialNumber,
                        BuildDate = v.BuildDate,
                        Manufacturer = v.Manufacturer,
                        WagonModelId = v.WagonModelId,
                        Pressure = v.Pressure,
                        Capacity = v.Capacity,
                        RailwayCisternListDto = v.RailwayCistern != null
                            ? new RailwayCisternListDTO()
                            {
                                Id = v.RailwayCistern.Id,
                                Number = v.RailwayCistern.Number,
                                ManufacturerName = v.RailwayCistern.Manufacturer.Name,
                                BuildDate = v.RailwayCistern.BuildDate,
                                TypeName = v.RailwayCistern.Type.Name,
                                ModelName = v.RailwayCistern.Model.Name,
                                OwnerName = v.RailwayCistern.Owner.Name,
                                RegistrationNumber = v.RailwayCistern.RegistrationNumber,
                                RegistrationDate = v.RailwayCistern.RegistrationDate,
                                AffiliationValue = v.RailwayCistern.Affiliation.Value
                            }
                            : null
                    })
                    .FirstOrDefaultAsync();
                return vessels is null ? Results.NotFound() : Results.Ok(vessels);
            })
            .WithName("GetVesselById")
            .ProducesValidationProblem()
            .Produces<VesselDTO>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/", async ([FromServices] ApplicationDbContext context,
                [FromBody] CreateVesselDTO dto) =>
            {
                var vessel = new Vessel
                {
                    Id = Guid.NewGuid(),
                    SerialNumber = dto.SerialNumber,
                    BuildDate = dto.BuildDate,
                    Manufacturer = dto.Manufacturer,
                    WagonModelId = dto.WagonModelId,
                    Pressure = dto.Pressure,
                    Capacity = dto.Capacity,
                    RailwayCisternId = dto.RailwayCisternId
                };

                context.Add(vessel);
                await context.SaveChangesAsync();
                return Results.Created($"/api/vessels/{vessel.Id}", vessel.Id);
            })
            .WithName("CreateVessel")
            .ProducesValidationProblem()
            .Produces<Guid>(StatusCodes.Status201Created)
            .RequirePermissions(Permission.Create);

        group.MapPut("/{id}", async ([FromServices] ApplicationDbContext context,
                Guid id,
                [FromBody] UpdateVesselDTO dto /*, other parameters */) =>
            {
                var vessel = await context.Vessels
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (vessel == null)
                {
                    return Results.NotFound();
                }

                vessel.Id = Guid.NewGuid();
                vessel.SerialNumber = dto.SerialNumber;
                vessel.BuildDate = dto.BuildDate;
                vessel.Manufacturer = dto.Manufacturer;
                vessel.WagonModelId = dto.WagonModelId;
                vessel.Pressure = dto.Pressure;
                vessel.Capacity = dto.Capacity;
                vessel.RailwayCisternId = dto.RailwayCisternId;

                await context.SaveChangesAsync();
                return Results.NoContent();
                // Implementation for updating an existing vessel
            })
            .WithName("UpdateVessel")
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Update);

        group.MapDelete("/{id}", async (Guid id,
                [FromServices] ApplicationDbContext context) =>
            {
                var vessel = await context.Vessels
                    .FirstOrDefaultAsync(v => v.Id == id);
                if (vessel == null)
                {
                    return Results.NotFound();
                }

                context.Vessels.Remove(vessel);
                await context.SaveChangesAsync();
                return Results.NoContent();
                // Implementation for deleting a vessel
            })
            .WithName("DeleteVessel")
            .ProducesValidationProblem()
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Delete);
    }
}