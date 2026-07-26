namespace WebApp.DTO.RailwayCisterns;

public class DocumentsRegulatoryDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Number { get; set; }
    public DateOnly Date { get; set; }
    public string? File { get; set; }
    public string? Url { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
}

public class CreateDocumentsRegulatoryDTO
{
    public string Name { get; set; } = null!;
    public string? Number { get; set; }
    public DateOnly Date { get; set; }
    public string? File { get; set; }
    public string? Url { get; set; }
}

public class UpdateDocumentsRegulatoryDTO
{
    public string Name { get; set; } = null!;
    public string? Number { get; set; }
    public DateOnly Date { get; set; }
    public string? File { get; set; }
    public string? Url { get; set; }
}

public static class DocumentsRegulatoryDTOMapper
{
    public static DocumentsRegulatoryDTO ToDocumentsRegulatoryDto(this WebApp.Data.Entities.RailwayCisterns.DocumentsRegulatory document)
    {
        return new DocumentsRegulatoryDTO
        {
            Id = document.Id,
            Name = document.Name,
            Number = document.Number,
            Date = document.Date,
            File = document.File,
            Url = document.Url,
            UpdatedAt = document.UpdatedAt,
            CreatorId = document.CreatorId
        };
    }

    public static WebApp.Data.Entities.RailwayCisterns.DocumentsRegulatory ToDocumentsRegulatory(this CreateDocumentsRegulatoryDTO dto, Guid creatorId)
    {
        return new WebApp.Data.Entities.RailwayCisterns.DocumentsRegulatory
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Number = dto.Number,
            Date = dto.Date,
            File = dto.File,
            Url = dto.Url,
            CreatorId = creatorId,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateDocumentsRegulatory(this WebApp.Data.Entities.RailwayCisterns.DocumentsRegulatory document, UpdateDocumentsRegulatoryDTO dto)
    {
        document.Name = dto.Name;
        document.Number = dto.Number;
        document.Date = dto.Date;
        document.File = dto.File;
        document.Url = dto.Url;
        document.UpdatedAt = DateTime.UtcNow;
    }
}
