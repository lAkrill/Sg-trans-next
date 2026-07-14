using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class Fitment
{
    public Guid Id { get; set; }
    
    public Guid FitmentTypeId { get; set; }
    public FitmentType FitmentType { get; set; }
    
    public string SerialNumber { get; set; }
    
    public string PassportNumber { get; set; } = "0";
    
    public DateTime BuildDate { get; set; }
    
    public DateTime? LastRepairDate { get; set; }
    
    public int PeriodRep { get; set; } = 1;
    
    public int ServiceLifeYears { get; set; } = 30;
    
    public Guid ModelId { get; set; }
    public FitmentModel Model { get; set; }
    
    public DateTime UpdatedAt { get; set; }
    
    public Guid CreatorId { get; set; }
    public User Creator { get; set; }
}
