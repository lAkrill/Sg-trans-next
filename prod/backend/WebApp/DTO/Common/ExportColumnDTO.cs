namespace WebApp.DTO.Common;

public class ExportColumnDTO
{
    public string Key { get; set; } = null!;
    public string Label { get; set; } = null!;
    public string Type { get; set; } = "string"; // string, number, date, boolean
}
