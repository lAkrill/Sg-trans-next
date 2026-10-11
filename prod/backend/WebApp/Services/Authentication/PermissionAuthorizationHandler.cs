using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Metadata;
using WebApp.Abstractions.Services;
using WebApp.Data.Enums;

namespace WebApp.Services.Authentication;

public class PermissionAuthorizationHandler
    : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PermissionAuthorizationHandler(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var userId = context.User.Claims.FirstOrDefault(
            x => x.Type == CustomClaims.UserId);

        if (userId is null || !Guid.TryParse(userId.Value, out var id))
            return;

        var endpoint = context.Resource switch
        {
            Endpoint resourceEndpoint => resourceEndpoint,
            HttpContext httpContext => httpContext.GetEndpoint(),
            _ => null
        };
        var endpointName = endpoint?
            .Metadata
            .GetMetadata<IEndpointNameMetadata>()?
            .EndpointName;

        var tags = endpoint?
            .Metadata
            .GetMetadata<ITagsMetadata>()?
            .Tags;
        
        using var scope = _scopeFactory.CreateScope();

        var permissionService = scope.ServiceProvider
            .GetRequiredService<IPermissionService>();

        var permissions = await permissionService.GetPermissionsAsync(id, tags);

        var requiredMask = requirement.Permissions.Aggregate(
            0, (mask, permission) => mask | (int)permission);

        if (permissions.Any(p => (p.Access & requiredMask) != 0))
        {
            context.Succeed(requirement);
        }
    }
}