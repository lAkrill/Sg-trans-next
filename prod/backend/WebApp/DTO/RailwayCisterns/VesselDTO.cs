namespace WebApp.DTO.RailwayCisterns;

public class VesselDTO
{
    public Guid Id { get; set; } 
    public string SerialNumber { get; set; } = null!;
    public DateTime BuildDate { get; set; }
    public string Manufacturer { get; set; } = null!;
    public string WagonModelId { get; set; } = null!;
    public decimal Pressure { get; set; }
    public decimal Capacity { get; set; }
    
    public RailwayCisternListDTO RailwayCisternListDto { get; set; }
}

public class VesselListDTO
{
    public Guid Id { get; set; } 
    public string SerialNumber { get; set; } = null!;
    public DateTime BuildDate { get; set; }
    public string Manufacturer { get; set; } = null!;
    public string WagonModelId { get; set; } = null!;
    public decimal Pressure { get; set; }
    public decimal Capacity { get; set; }
}
public class VesselListWithCisternNumberDTO
{
    public Guid Id { get; set; } 
    public string SerialNumber { get; set; } = null!;
    public DateTime BuildDate { get; set; }
    public string Manufacturer { get; set; } = null!;
    public string WagonModelId { get; set; } = null!;
    public decimal Pressure { get; set; }
    public decimal Capacity { get; set; }
    public RailwayCisternIdAndNumberDTO RailwayCisternIdAndNumberDto { get; set; }
}


public class CreateVesselDTO
{
    public string SerialNumber { get; set; } = null!;
    public DateTime BuildDate { get; set; }
    public string Manufacturer { get; set; } = null!;
    public string WagonModelId { get; set; } = null!;
    public decimal Pressure { get; set; }
    public decimal Capacity { get; set; }
    public Guid RailwayCisternId { get; set; }
}

public class UpdateVesselDTO
{
    public string SerialNumber { get; set; } = null!;
    public DateTime BuildDate { get; set; }
    public string Manufacturer { get; set; } = null!;
    public string WagonModelId { get; set; } = null!;
    public decimal Pressure { get; set; }
    public decimal Capacity { get; set; }
    public Guid RailwayCisternId { get; set; }
}