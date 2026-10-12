namespace WebApp.DTO.Common;

public class PermissionEntityDTO
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

}

public class RolePermissionDTO
{
    public int RoleId { get; set; }
    public int PermissionId { get; set; }
    public string PermissionName { get; set; }
    public int Access { get; set; }
}

