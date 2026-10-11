using WebApp.Abstractions.Services;
using WebApp.DTO.Common;
using WebApp.Data.Repositories;

namespace WebApp.Services;

public class PermissionService : IPermissionService
{
    private readonly UserRepository _userRepository;

    public PermissionService(UserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public Task<List<RolePermissionDTO>> GetPermissionsAsync(Guid userId, IEnumerable<string> tags)
    {
        return _userRepository.GetUserPermissionsAsync(userId, tags);
    }
}