using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class DislocationEndpoints
{
    public static void MapDislocationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dislocations")
            .RequireAuthorization()
            .WithTags("dislocations");

        // Get last dislocation by cistern number
        group.MapGet("/last-location/by-number/{cisternNumber}", async (
                [FromServices] ApplicationDbContext context,
                string cisternNumber) =>
            {
                var dislocation = await context.Dislocations
                    .AsNoTracking()
                    .Where(d => d.NumCistern == cisternNumber)
                    .OrderByDescending(d => d.DateOpr)
                    .Include(d => d.StationOpr)
                    .Select(d => new LastDislocationDTO
                    {
                        Id = d.Id,
                        DateOpr = d.DateOpr,
                        NameStationOpr = d.NameStationOpr,
                        Lat = d.StationOpr != null ? d.StationOpr.Lat : 0,
                        Lon = d.StationOpr != null ? d.StationOpr.Lon : 0
                    })
                    .FirstOrDefaultAsync();

                return dislocation is null ? Results.NotFound() : Results.Ok(dislocation);
            })
            .WithName("GetLastDislocationByCisternNumber")
            .Produces<LastDislocationDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        // Get all dislocations by cistern number
        group.MapGet("/locations/by-number/{cisternNumber}", async (
                [FromServices] ApplicationDbContext context,
                string cisternNumber) =>
            {
                var dislocations = await context.Dislocations
                    .AsNoTracking()
                    .Where(d => d.NumCistern == cisternNumber)
                    .OrderByDescending(d => d.DateOpr)
                    .Include(d => d.StationOpr)
                    .Select(d => new DislocationListDTO
                    {
                        Id = d.Id,
                        DateRas = d.DateRas,
                        DateOpr = d.DateOpr,
                        NumCistern = d.NumCistern,
                        CodeStationOpr = d.CodeStationOpr,
                        NameStationOpr = d.NameStationOpr,
                        OperationShort = d.OperationShort,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut
                    })
                    .ToListAsync();

                return Results.Ok(dislocations);
            })
            .WithName("GetDislocationsByCisternNumber")
            .Produces<List<DislocationListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        // Get last dislocation by cistern ID
        group.MapGet("/last-location/by-id/{cisternId}", async (
                [FromServices] ApplicationDbContext context,
                Guid cisternId) =>
            {
                var dislocation = await context.Dislocations
                    .AsNoTracking()
                    .Where(d => d.CisternId == cisternId)
                    .OrderByDescending(d => d.DateOpr)
                    .Include(d => d.StationOpr)
                    .Select(d => new LastDislocationDTO
                    {
                        Id = d.Id,
                        DateOpr = d.DateOpr,
                        NameStationOpr = d.NameStationOpr,
                        Lat = d.StationOpr != null ? d.StationOpr.Lat : 0,
                        Lon = d.StationOpr != null ? d.StationOpr.Lon : 0
                    })
                    .FirstOrDefaultAsync();

                return dislocation is null ? Results.NotFound() : Results.Ok(dislocation);
            })
            .WithName("GetLastDislocationByCisternId")
            .Produces<LastDislocationDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);

        // Get all dislocations by cistern ID
        group.MapGet("/locations/by-id/{cisternId}", async (
                [FromServices] ApplicationDbContext context,
                Guid cisternId) =>
            {
                var dislocations = await context.Dislocations
                    .AsNoTracking()
                    .Where(d => d.CisternId == cisternId)
                    .OrderByDescending(d => d.DateOpr)
                    .Include(d => d.StationOpr)
                    .Select(d => new DislocationListDTO
                    {
                        Id = d.Id,
                        DateRas = d.DateRas,
                        DateOpr = d.DateOpr,
                        NumCistern = d.NumCistern,
                        CodeStationOpr = d.CodeStationOpr,
                        NameStationOpr = d.NameStationOpr,
                        OperationShort = d.OperationShort,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut
                    })
                    .ToListAsync();

                return Results.Ok(dislocations);
            })
            .WithName("GetDislocationsByCisternId")
            .Produces<List<DislocationListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);
    }
}
