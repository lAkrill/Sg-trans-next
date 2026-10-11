using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace WebApp.Features.Users.GetPermissions;

public record GetUserPermissionsRequest([Required] Guid UserId)
{
    public IEnumerable<string>? Tags { get; init; }
}
