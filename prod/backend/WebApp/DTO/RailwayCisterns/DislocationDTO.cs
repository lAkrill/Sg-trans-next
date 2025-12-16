namespace WebApp.DTO.RailwayCisterns;

public class DislocationDTO
{
    public Guid Id { get; set; }
    public DateTime DateRas { get; set; }
    public DateTime DateOpr { get; set; }
    public string NumCistern { get; set; } = "";
    public Guid? CisternId { get; set; }
    public Guid? StationOprId { get; set; }
    public string CodeStationOpr { get; set; } = "";
    public string NameStationOpr { get; set; } = "";
    public string? RoadDislocation { get; set; }
    public string OperationShort { get; set; } = "";
    public string? OperationNote { get; set; }
    public Guid? StationOutId { get; set; }
    public string CodeStationOut { get; set; } = "";
    public string NameStationOut { get; set; } = "";
    public Guid? StationEndId { get; set; }
    public string CodeStationEnd { get; set; } = "";
    public string NameStationEnd { get; set; } = "";
    public string? CodeShip { get; set; }
    public string? NameShip { get; set; }
    public decimal? WeightShip { get; set; }
    public string? NumTrain { get; set; }
    public string? IndxTrain { get; set; }
    public string? CodeConsignor { get; set; }
    public string? CodeConsignee { get; set; }
    public string CodeWagonOwner { get; set; } = "";
    public string? NumShipmen { get; set; }
}

public class LastDislocationDTO
{
    public Guid Id { get; set; }
    public DateTime DateRas { get; set; }
    public DateTime DateOpr { get; set; }
    public string NumCistern { get; set; } = "";
    public string CodeStationOpr { get; set; } = "";
    public string NameStationOpr { get; set; } = "";
    public string? RoadDislocation { get; set; }
    public string OperationShort { get; set; } = "";
    public string? OperationNote { get; set; }
    public string CodeStationOut { get; set; } = "";
    public string NameStationOut { get; set; } = "";
    public string CodeStationEnd { get; set; } = "";
    public string NameStationEnd { get; set; } = "";
    public string? CodeShip { get; set; }
    public string? NameShip { get; set; }
    public decimal? WeightShip { get; set; }
    public string? NumTrain { get; set; }
    public string? IndxTrain { get; set; }
    public string? CodeConsignor { get; set; }
    public string? CodeConsignee { get; set; }
    public string CodeWagonOwner { get; set; } = "";
    public string? NumShipmen { get; set; }
    public double Lat { get; set; }
    public double Lon { get; set; }
}

public class DislocationListDTO
{
    public Guid Id { get; set; }
    public DateTime DateRas { get; set; }
    public DateTime DateOpr { get; set; }
    public string NumCistern { get; set; } = "";
    public string CodeStationOpr { get; set; } = "";
    public string NameStationOpr { get; set; } = "";
    public string? RoadDislocation { get; set; }
    public string OperationShort { get; set; } = "";
    public string? OperationNote { get; set; }
    public string CodeStationOut { get; set; } = "";
    public string NameStationOut { get; set; } = "";
    public string CodeStationEnd { get; set; } = "";
    public string NameStationEnd { get; set; } = "";
    public string? CodeShip { get; set; }
    public string? NameShip { get; set; }
    public decimal? WeightShip { get; set; }
    public string? NumTrain { get; set; }
    public string? IndxTrain { get; set; }
    public string? CodeConsignor { get; set; }
    public string? CodeConsignee { get; set; }
    public string CodeWagonOwner { get; set; } = "";
    public string? NumShipmen { get; set; }
    public double Lat { get; set; }
    public double Lon { get; set; }
}
