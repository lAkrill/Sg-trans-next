using System;

namespace WebApp.Data.Entities.RailwayCisterns;

public class Dislocation
{
    public Guid Id { get; set; }
    public DateTime DateRas { get; set; }
    public DateTime DateOpr { get; set; }
    public string NumCistern { get; set; } = string.Empty;
    public Guid? CisternId { get; set; }
    public Guid? StationOprId { get; set; }
    public string CodeStationOpr { get; set; } = string.Empty;
    public string NameStationOpr { get; set; } = string.Empty;
    public string? RoadDislocation { get; set; }
    public string OperationShort { get; set; } = string.Empty;
    public string? OperationNote { get; set; }
    public Guid? StationOutId { get; set; }
    public string CodeStationOut { get; set; } = string.Empty;
    public string NameStationOut { get; set; } = string.Empty;
    public Guid? StationEndId { get; set; }
    public string CodeStationEnd { get; set; } = string.Empty;
    public string NameStationEnd { get; set; } = string.Empty;
    public string? CodeShip { get; set; }
    public string? NameShip { get; set; }
    public decimal? WeightShip { get; set; }
    public string? NumTrain { get; set; }
    public string? IndxTrain { get; set; }
    public string? CodeConsignor { get; set; }
    public string? CodeConsignee { get; set; }
    public string CodeWagonOwner { get; set; } = string.Empty;
    public string? NumShipmen { get; set; }

    // Relationship properties
    public RailwayCistern? RailwayCistern { get; set; }
    public Station? StationOpr { get; set; }
    public Station? StationOut { get; set; }
    public Station? StationEnd { get; set; }
}
