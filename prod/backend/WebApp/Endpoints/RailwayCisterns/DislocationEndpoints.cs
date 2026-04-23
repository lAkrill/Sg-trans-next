using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
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
                        DateRas = d.DateRas,
                        DateOpr = d.DateOpr,
                        NumCistern = d.NumCistern,
                        CodeStationOpr = d.CodeStationOpr,
                        NameStationOpr = d.NameStationOpr,
                        RoadDislocation = d.RoadDislocation,
                        OperationShort = d.OperationShort,
                        OperationNote = d.OperationNote,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut,
                        CodeStationEnd = d.CodeStationEnd,
                        NameStationEnd = d.NameStationEnd,
                        CodeShip = d.CodeShip,
                        NameShip = d.NameShip,
                        WeightShip = d.WeightShip,
                        NumTrain = d.NumTrain,
                        IndxTrain = d.IndxTrain,
                        CodeConsignor = d.CodeConsignor,
                        CodeConsignee = d.CodeConsignee,
                        CodeWagonOwner = d.CodeWagonOwner,
                        NumShipmen = d.NumShipmen,
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
                        RoadDislocation = d.RoadDislocation,
                        OperationShort = d.OperationShort,
                        OperationNote = d.OperationNote,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut,
                        CodeStationEnd = d.CodeStationEnd,
                        NameStationEnd = d.NameStationEnd,
                        CodeShip = d.CodeShip,
                        NameShip = d.NameShip,
                        WeightShip = d.WeightShip,
                        NumTrain = d.NumTrain,
                        IndxTrain = d.IndxTrain,
                        CodeConsignor = d.CodeConsignor,
                        CodeConsignee = d.CodeConsignee,
                        CodeWagonOwner = d.CodeWagonOwner,
                        NumShipmen = d.NumShipmen,
                        Lat = d.StationOpr != null ? d.StationOpr.Lat : 0,
                        Lon = d.StationOpr != null ? d.StationOpr.Lon : 0
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
                        DateRas = d.DateRas,
                        DateOpr = d.DateOpr,
                        NumCistern = d.NumCistern,
                        CodeStationOpr = d.CodeStationOpr,
                        NameStationOpr = d.NameStationOpr,
                        RoadDislocation = d.RoadDislocation,
                        OperationShort = d.OperationShort,
                        OperationNote = d.OperationNote,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut,
                        CodeStationEnd = d.CodeStationEnd,
                        NameStationEnd = d.NameStationEnd,
                        CodeShip = d.CodeShip,
                        NameShip = d.NameShip,
                        WeightShip = d.WeightShip,
                        NumTrain = d.NumTrain,
                        IndxTrain = d.IndxTrain,
                        CodeConsignor = d.CodeConsignor,
                        CodeConsignee = d.CodeConsignee,
                        CodeWagonOwner = d.CodeWagonOwner,
                        NumShipmen = d.NumShipmen,
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
                        RoadDislocation = d.RoadDislocation,
                        OperationShort = d.OperationShort,
                        OperationNote = d.OperationNote,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut,
                        CodeStationEnd = d.CodeStationEnd,
                        NameStationEnd = d.NameStationEnd,
                        CodeShip = d.CodeShip,
                        NameShip = d.NameShip,
                        WeightShip = d.WeightShip,
                        NumTrain = d.NumTrain,
                        IndxTrain = d.IndxTrain,
                        CodeConsignor = d.CodeConsignor,
                        CodeConsignee = d.CodeConsignee,
                        CodeWagonOwner = d.CodeWagonOwner,
                        NumShipmen = d.NumShipmen,
                        Lat = d.StationOpr != null ? d.StationOpr.Lat : 0,
                        Lon = d.StationOpr != null ? d.StationOpr.Lon : 0
                    })
                    .ToListAsync();

                return Results.Ok(dislocations);
            })
            .WithName("GetDislocationsByCisternId")
            .Produces<List<DislocationListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/locations/in-range/by-id/{cisternId}", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] Guid cisternId,
                [FromBody] DateRange? dateRange = null) =>
            {
                var query = context.Dislocations
                    .AsNoTracking()
                    .Where(d => d.CisternId == cisternId);

                if (dateRange != null)
                {
                    if (dateRange.From.HasValue)
                    {
                        query = query
                            .Where(d => DateOnly.FromDateTime(d.DateOpr) >= dateRange.From);
                    }

                    if (dateRange.To.HasValue)
                    {
                        query = query
                            .Where(d => DateOnly.FromDateTime(d.DateOpr) <= dateRange.To);
                    }
                }

                var dislocations = await query
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
                        RoadDislocation = d.RoadDislocation,
                        OperationShort = d.OperationShort,
                        OperationNote = d.OperationNote,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut,
                        CodeStationEnd = d.CodeStationEnd,
                        NameStationEnd = d.NameStationEnd,
                        CodeShip = d.CodeShip,
                        NameShip = d.NameShip,
                        WeightShip = d.WeightShip,
                        NumTrain = d.NumTrain,
                        IndxTrain = d.IndxTrain,
                        CodeConsignor = d.CodeConsignor,
                        CodeConsignee = d.CodeConsignee,
                        CodeWagonOwner = d.CodeWagonOwner,
                        NumShipmen = d.NumShipmen,
                        Lat = d.StationOpr != null ? d.StationOpr.Lat : 0,
                        Lon = d.StationOpr != null ? d.StationOpr.Lon : 0
                    })
                    .ToListAsync();

                return Results.Ok(dislocations);
            })
            .WithName("GetDislocationsByDateRangeForCisternById")
            .Produces<List<DislocationListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);

        group.MapPost("/locations/in-range/by-number/{cisternNumber}", async (
                [FromServices] ApplicationDbContext context,
                [FromQuery] string cisternNumber,
                [FromBody] DateRange? dateRange = null) =>
            {
                var query = context.Dislocations
                    .AsNoTracking()
                    .Where(d => d.NumCistern == cisternNumber);

                if (dateRange != null)
                {
                    if (dateRange.From.HasValue)
                    {
                        query = query
                            .Where(d => DateOnly.FromDateTime(d.DateOpr) >= dateRange.From);
                    }

                    if (dateRange.To.HasValue)
                    {
                        query = query
                            .Where(d => DateOnly.FromDateTime(d.DateOpr) <= dateRange.To);
                    }
                }

                var dislocations = await query
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
                        RoadDislocation = d.RoadDislocation,
                        OperationShort = d.OperationShort,
                        OperationNote = d.OperationNote,
                        CodeStationOut = d.CodeStationOut,
                        NameStationOut = d.NameStationOut,
                        CodeStationEnd = d.CodeStationEnd,
                        NameStationEnd = d.NameStationEnd,
                        CodeShip = d.CodeShip,
                        NameShip = d.NameShip,
                        WeightShip = d.WeightShip,
                        NumTrain = d.NumTrain,
                        IndxTrain = d.IndxTrain,
                        CodeConsignor = d.CodeConsignor,
                        CodeConsignee = d.CodeConsignee,
                        CodeWagonOwner = d.CodeWagonOwner,
                        NumShipmen = d.NumShipmen,
                        Lat = d.StationOpr != null ? d.StationOpr.Lat : 0,
                        Lon = d.StationOpr != null ? d.StationOpr.Lon : 0
                    })
                    .ToListAsync();

                return Results.Ok(dislocations);
            })
            .WithName("GetDislocationsByDateRangeForCisternByNumber")
            .Produces<List<DislocationListDTO>>(StatusCodes.Status200OK)
            .RequirePermissions(Permission.Read);
        // Get last cistern dislocations
        group.MapPost("/cisterns-last-location", async (
                [FromServices] ApplicationDbContext context,
                [FromBody] CisternsLastDislocationFilterDTO filter
            ) =>
            {
                var dislocations = await context.Dislocations
                    .AsNoTracking()
                    .Include(d => d.StationOpr)
                    .Where(d => 
                        (filter.WeightShip == null || (d.WeightShip >= filter.WeightShip.From && d.WeightShip <= filter.WeightShip.To)) &&
                        (filter.IsSGTrans == null || (filter.IsSGTrans.Value ? 
                        d.CisternId.Value.ToString() != "fc52c718-fcc3-4d39-88cb-18baab40b66c":
                        d.CisternId.Value.ToString() == "fc52c718-fcc3-4d39-88cb-18baab40b66c"))
                    )
                    .OrderByDescending(d => d.DateOpr)
                    .ToListAsync();

                var result = dislocations
                    .GroupBy(d => d.NumCistern)
                    .Select(g =>
                    {
                        var history = g.ToList(); // Список уже отсортирован благодаря OrderBy выше
                        var latestRecord = history.First();
                        var currentStation = latestRecord.StationOprId;

                        // Ищем момент смены станции
                        var firstDifferentStation = history.FirstOrDefault(x => x.StationOprId != currentStation);

                        DateTime arrivalDate;
                        if (firstDifferentStation == null)
                        {
                            arrivalDate = history.Last().DateOpr;
                        }
                        else
                        {
                            int index = history.IndexOf(firstDifferentStation);
                            arrivalDate = history[index - 1].DateOpr;
                        }

                        return new CisternsLastDislocationDTO()
                        {
                            Id = latestRecord.Id,
                            IsSGTrans = latestRecord.CisternId.Value.ToString() == "fc52c718-fcc3-4d39-88cb-18baab40b66c"? false : true,
                            DateOpr = latestRecord.DateOpr,
                            Downtime = (DateTime.Now - arrivalDate).Days,
                            NumCistern = latestRecord.NumCistern,
                            CodeStationOpr = latestRecord.CodeStationOpr,
                            NameStationOpr = latestRecord.NameStationOpr,
                            RoadDislocation = latestRecord.RoadDislocation,
                            OperationShort = latestRecord.OperationShort,
                            OperationNote = latestRecord.OperationNote,
                            CodeStationOut = latestRecord.CodeStationOut,
                            NameStationOut = latestRecord.NameStationOut,
                            CodeStationEnd = latestRecord.CodeStationEnd,
                            NameStationEnd = latestRecord.NameStationEnd,
                            CodeShip = latestRecord.CodeShip,
                            NameShip = latestRecord.NameShip,
                            WeightShip = latestRecord.WeightShip,
                            NumTrain = latestRecord.NumTrain,
                            IndxTrain = latestRecord.IndxTrain,
                            CodeConsignor = latestRecord.CodeConsignor,
                            CodeConsignee = latestRecord.CodeConsignee,
                            CodeWagonOwner = latestRecord.CodeWagonOwner,
                            NumShipmen = latestRecord.NumShipmen,
                            Lat = latestRecord.StationOpr != null ? latestRecord.StationOpr.Lat : 0,
                            Lon = latestRecord.StationOpr != null ? latestRecord.StationOpr.Lon : 0
                        };
                    })
                    .ToList();

                if(filter.Downtime != null)
                    result = result.Where(d => d.Downtime >= filter.Downtime.From && d.Downtime <= filter.Downtime.To)
                                   .ToList();

                if(filter.DateOpr != null)
                    result = result.Where(d=>d.DateOpr >= filter.DateOpr.From && d.DateOpr <= filter.DateOpr.To)
                                   .ToList();

                return result is null ? Results.NotFound() : Results.Ok(result);
            })
            .WithName("GetLastCisternsDislocation")
            .Produces<CisternsLastDislocationDTO>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequirePermissions(Permission.Read);
    }
}