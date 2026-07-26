namespace WebApp.DTO.RailwayCisterns;

public class PartTypeDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public int Code { get; set; }
    public decimal Weight { get; set; }
}

public class CreatePartTypeDTO
{
    public string Name { get; set; }
    public int Code { get; set; }
    public decimal Weight { get; set; }
}

public class UpdatePartTypeDTO
{
    public string Name { get; set; }
    public int Code { get; set; }
    public decimal Weight { get; set; }
}
