namespace WebApp.Data.Entities.RailwayCisterns;

public class Document
{
    public Guid Id { get; set; }
    public string Number { get; set; } = null!;
    public int? Type { get; set; }
    public DateOnly Date { get; set; }
    public string Author { get; set; } = null!;
    public decimal? Price { get; set; }
    public string? Note { get; set; }
    
    // Навигационные свойства
    public ICollection<Part> Parts { get; set; } = new List<Part>();
    public ICollection<PartEquipment> PartEquipments { get; set; } = new List<PartEquipment>();
    public ICollection<FitmentEquipment> FitmentEquipments { get; set; } = new List<FitmentEquipment>();
}
