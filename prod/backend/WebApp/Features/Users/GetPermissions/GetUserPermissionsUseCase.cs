using System.Collections.Generic;
using WebApp.Data.Repositories;
using WebApp.DTO.Common;

namespace WebApp.Features.Users.GetPermissions;

public class GetUserPermissionsUseCase
{
    private readonly UserRepository _userRepository;

    public GetUserPermissionsUseCase(UserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public Task<List<RolePermissionDTO>> ExecuteAsync(GetUserPermissionsRequest request)
    {
        return _userRepository.GetUserPermissionsAsync(request.UserId, request.Tags);
    }
}
