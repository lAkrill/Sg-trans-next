namespace WebApp.DTO.RailwayCisterns;

public class FitmentEquipmentDTO
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

    public RailwayCisternDTO? RailwayCistern { get; set; }
    public FitmentInfoDTO? Fitment { get; set; }
    public EmployeeInfoDTO? JobUser { get; set; }
    public EmployeeInfoDTO? TestUser { get; set; }
    public EmployeeInfoDTO? AcceptUser { get; set; }
    public EmployeeInfoDTO? InstallUser { get; set; }
    public EmployeeInfoDTO? ApprovUser { get; set; }
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

public class EmployeeInfoDTO
{
    public Guid Id { get; set; }
    public string LastName { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string Patronymic { get; set; } = null!;
    public string Initials { get; set; } = null!;
    public string Position { get; set; } = null!;
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
    public Guid? AcceptUserId { get; set; }
    public Guid? InstallUserId { get; set; }
    public Guid? ApprovUserId { get; set; }
}
