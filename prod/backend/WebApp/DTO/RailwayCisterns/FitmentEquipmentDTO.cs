namespace WebApp.DTO.RailwayCisterns;

public class FitmentEquipmentDTO
{
    public Guid Id { get; set; }
    public Guid? RailwayCisternsId { get; set; }
    public int Operation { get; set; }
    public Guid FitmentId { get; set; }
    public Guid JobUserId { get; set; }
    public Guid? TestUserId { get; set; }
    public Guid? DepoId { get; set; }
    public DateOnly Date { get; set; }
    public Guid DocumentId { get; set; }

    public RailwayCisternDTO? RailwayCistern { get; set; }
    public FitmentInfoDTO? Fitment { get; set; }
    public UserInfoDTO? JobUser { get; set; }
    public UserInfoDTO? TestUser { get; set; }
    public DepotDTO? Depot { get; set; }
    public DocumentDTO? Document { get; set; }
}

public class FitmentInfoDTO
{
    public Guid Id { get; set; }
    public string SerialNumber { get; set; } = null!;
    public string? PassportNumber { get; set; }
    public string FitmentTypeName { get; set; } = null!;
}

public class UserInfoDTO
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
}

public class CreateFitmentEquipmentDTO
{
    public Guid? RailwayCisternsId { get; set; }
    public int Operation { get; set; }
    public Guid FitmentId { get; set; }
    public Guid JobUserId { get; set; }
    public Guid? TestUserId { get; set; }
    public Guid? DepoId { get; set; }
    public DateOnly Date { get; set; }
    public Guid DocumentId { get; set; }
}
