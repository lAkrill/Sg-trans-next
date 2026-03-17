using System.Text.Json.Serialization;

namespace WebApp.DTO.Common;

public class ExportTableRequestDTO
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = null!; // "doc", "xls", "pdf"

    [JsonPropertyName("columns")]
    public List<ExportColumnDTO> Columns { get; set; } = new();

    [JsonPropertyName("data")]
    public List<Dictionary<string, object?>> Data { get; set; } = new();

    [JsonPropertyName("fileName")]
    public string? FileName { get; set; } = "export";
}
