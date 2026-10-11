using WebApp.DTO.Common;

namespace WebApp.Abstractions.Services;

public interface IPermissionService
{
    Task<List<RolePermissionDTO>> GetPermissionsAsync(Guid userId, IEnumerable<string> tags);
}