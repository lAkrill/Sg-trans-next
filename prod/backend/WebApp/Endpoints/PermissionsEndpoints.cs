using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.Common;
using WebApp.DTO.Employees;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;
using WebApp.Features.Users.Delete;
using WebApp.Features.Users.GetAll;
using WebApp.Features.Users.GetAllRoles;
using WebApp.Features.Users.GetCurrent;
using WebApp.Features.Users.GetPermissions;
using WebApp.Features.Users.Login;
using WebApp.Features.Users.RefreshToken;
using WebApp.Features.Users.Register;
using WebApp.Features.Users.ResetPassword;
using WebApp.Features.Users.Update;
using WebApp.Features.Users.UpdateRoles;

namespace WebApp.Endpoints;

public static class PermissionsEndpoints
{
    public static void MapPermissionsEndpoints(this IEndpointRouteBuilder app)
    {
        // Public Endpoints Group
        var publicGroup = app.MapGroup("/api/permissions")
            .WithTags("permissions");

        publicGroup.MapGet("role/all/", async ([FromServices] ApplicationDbContext context) =>
        {
            var outResponse = await (
                from item in context.RolePermissions
                join permissionEntity in context.PermissionEntitys
                    on item.PermissionId equals permissionEntity.Id
                select new RolePermissionDTO
                {
                    RoleId = item.RoleId,
                    PermissionId = item.PermissionId,
                    PermissionName = permissionEntity.Name,
                    Access = item.Access
                }).ToListAsync();

            return Results.Ok(outResponse);
        })
        .WithName("GetPermissionsRole")
        .Produces<List<RolePermissionDTO>>(StatusCodes.Status200OK);

        publicGroup.MapGet("role/{id}", async ([FromServices] ApplicationDbContext context, [FromRoute] int id) =>
        {
            var outResponse = await (
                from item in context.RolePermissions
                join permissionEntity in context.PermissionEntitys
                    on item.PermissionId equals permissionEntity.Id
                where item.RoleId == id
                select new RolePermissionDTO
                {
                    RoleId = item.RoleId,
                    PermissionId = item.PermissionId,
                    PermissionName = permissionEntity.Name,
                    Access = item.Access
                }).ToListAsync();

            return Results.Ok(outResponse);
        })
        .WithName("GetPermissionsByRoleId")
        .Produces<List<RolePermissionDTO>>(StatusCodes.Status200OK);

        publicGroup.MapGet("name/all", async ([FromServices] ApplicationDbContext context) =>
        {
            var permissions = await context.PermissionEntitys.ToListAsync();
            List<PermissionEntityDTO> outResponse = new List<PermissionEntityDTO>();

            foreach (var item in permissions)
            {
                var outPermission = new PermissionEntityDTO();
                outPermission.Id = item.Id;
                outPermission.Name = item.Name;
                outResponse.Add(outPermission);
            }
            return Results.Ok(outResponse);


        })
        .WithName("GetPermissionsName")
        .Produces<List<PermissionEntityDTO>>(StatusCodes.Status200OK);

        publicGroup.MapGet("name/{roleId}/{permissionId}", async ([FromServices] ApplicationDbContext context, [FromRoute] int roleId, [FromRoute] int permissionId) =>
        {
            var outResponse = await (
                from item in context.RolePermissions
                join permissionEntity in context.PermissionEntitys
                    on item.PermissionId equals permissionEntity.Id
                where item.RoleId == roleId && item.PermissionId == permissionId
                select new RolePermissionDTO
                {
                    RoleId = item.RoleId,
                    PermissionId = item.PermissionId,
                    PermissionName = permissionEntity.Name,
                    Access = item.Access
                }).FirstOrDefaultAsync();

            return Results.Ok(outResponse);
        })
        .WithName("GetPermissionsNameById")
        .Produces<RolePermissionDTO>(StatusCodes.Status200OK);
    }

}