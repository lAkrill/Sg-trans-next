namespace WebApp.DTO.RailwayCisterns;

public class ScrapmetalDTO
{
    public Guid Id { get; set; }
    public Guid? PartId { get; set; }
    public decimal Weight { get; set; }
    public DateOnly Date { get; set; }
    public int Code { get; set; }
    public string? Note { get; set; }
    public Guid? DocumentId { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
}

public class CreateScrapmetalDTO
{
    public Guid? PartId { get; set; }
    public decimal Weight { get; set; } = 0;
    public DateOnly Date { get; set; }
    public int Code { get; set; } = 0;
    public string? Note { get; set; }
    public Guid? DocumentId { get; set; }
}

public class UpdateScrapmetalDTO
{
    public Guid? PartId { get; set; }
    public decimal Weight { get; set; }
    public DateOnly Date { get; set; }
    public int Code { get; set; }
    public string? Note { get; set; }
    public Guid? DocumentId { get; set; }
}

public static class ScrapmetalDTOMapper
{
    public static ScrapmetalDTO ToScrapmetalDto(this WebApp.Data.Entities.RailwayCisterns.Scrapmetal scrapmetal)
    {
        return new ScrapmetalDTO
        {
            Id = scrapmetal.Id,
            PartId = scrapmetal.PartId,
            Weight = scrapmetal.Weight,
            Date = scrapmetal.Date,
            Code = scrapmetal.Code,
            Note = scrapmetal.Note,
            DocumentId = scrapmetal.DocumentId,
            UpdatedAt = scrapmetal.UpdatedAt,
            CreatorId = scrapmetal.CreatorId
        };
    }

    public static WebApp.Data.Entities.RailwayCisterns.Scrapmetal ToScrapmetal(this CreateScrapmetalDTO dto, Guid creatorId)
    {
        return new WebApp.Data.Entities.RailwayCisterns.Scrapmetal
        {
            Id = Guid.NewGuid(),
            PartId = dto.PartId,
            Weight = dto.Weight,
            Date = dto.Date,
            Code = dto.Code,
            Note = dto.Note,
            DocumentId = dto.DocumentId,
            CreatorId = creatorId,
            UpdatedAt = DateTime.Now
        };
    }

    public static void UpdateScrapmetal(this WebApp.Data.Entities.RailwayCisterns.Scrapmetal scrapmetal, UpdateScrapmetalDTO dto)
    {
        scrapmetal.PartId = dto.PartId;
        scrapmetal.Weight = dto.Weight;
        scrapmetal.Date = dto.Date;
        scrapmetal.Code = dto.Code;
        scrapmetal.Note = dto.Note;
        scrapmetal.DocumentId = dto.DocumentId;
        scrapmetal.UpdatedAt = DateTime.Now;
    }
}
