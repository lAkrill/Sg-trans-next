namespace WebApp.Data.Entities.Users;

public class RolePermission
{
    public int RoleId { get; set; }

    public int PermissionId { get; set; }

    public int Access {  get; set; }
}