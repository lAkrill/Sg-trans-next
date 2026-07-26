namespace WebApp.DTO.RailwayCisterns;

public class DocumentDTO
{
    public Guid Id { get; set; }
    public string Number { get; set; } = null!;
    public int? Type { get; set; }
    public DateOnly Date { get; set; }
    public string Author { get; set; } = null!;
    public decimal? Price { get; set; }
    public string? Note { get; set; }
    public string? File { get; set; }
}

public class CreateDocumentDTO
{
    public string Number { get; set; } = null!;
    public int? Type { get; set; }
    public DateOnly Date { get; set; }
    public string Author { get; set; } = null!;
    public decimal? Price { get; set; }
    public string? Note { get; set; }
    public string? File { get; set; }
}

public class UpdateDocumentDTO
{
    public string Number { get; set; } = null!;
    public int? Type { get; set; }
    public DateOnly Date { get; set; }
    public string Author { get; set; } = null!;
    public decimal? Price { get; set; }
    public string? Note { get; set; }
    public string? File { get; set; }
}
