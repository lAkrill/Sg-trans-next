namespace WebApp.DTO.Common;

using System.Text.Json.Serialization;

public class VersionsDTO
{
    [JsonPropertyName("backend")]
    public string Backend { get; set; } = string.Empty;
}
