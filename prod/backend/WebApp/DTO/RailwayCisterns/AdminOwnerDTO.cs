using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class AdminOwnerDTO
{
    public int Id { get; set; }
    public string? Name { get; set; }
}

public class CreateAdminOwnerDTO
{
    public int Id { get; set; }
    public string? Name { get; set; }
}

public class UpdateAdminOwnerDTO
{
    public int Id { get; set; }
    public string? Name { get; set; }
}

public static class AdminOwnerDTOMapper
{
    public static AdminOwnerDTO ToAdminOwnerDTO(this AdminOwner adminOwner)
    {
        return new AdminOwnerDTO()
        {
            Id = adminOwner.Id,
            Name = adminOwner.Name
        };
    }

    public static AdminOwner ToAdminOwner(this CreateAdminOwnerDTO adminOwnerDTO)
    {
        return new AdminOwner()
        {
            Id = adminOwnerDTO.Id,
            Name = adminOwnerDTO.Name
        };
    }
    
    public static void UpdateAdminOwner(this AdminOwner adminOwner, UpdateAdminOwnerDTO updateAdminOwnerDTO)
    {
        adminOwner.Id = updateAdminOwnerDTO.Id;
        adminOwner.Name = updateAdminOwnerDTO.Name;
    }
}