using WebApp.Data.Entities.Users;

namespace WebApp.Data.Entities.RailwayCisterns;

public class FitmentEquipment
{
    public Guid Id { get; set; }
    public Guid? RailwayCisternsId { get; set; }
    public int Operation { get; set; }
    public Guid FitmentId { get; set; }
    public Guid JobUserId { get; set; }
    public Guid? TestUserId { get; set; }
    public Guid? AcceptUserId { get; set; }
    public Guid? InstallUserId { get; set; }
    public Guid? ApprovUserId { get; set; }
    public Guid? DepoId { get; set; }
    public DateOnly Date { get; set; }
    public Guid DocumentId { get; set; }

    public RailwayCistern? RailwayCistern { get; set; }
    public Fitment Fitment { get; set; } = null!;
    public Employee JobUser { get; set; } = null!;
    public Employee? TestUser { get; set; }
    public Employee? AcceptUser { get; set; }
    public Employee? InstallUser { get; set; }
    public Employee? ApprovUser { get; set; }
    public Depot? Depot { get; set; }
    public Document Document { get; set; } = null!;
}
