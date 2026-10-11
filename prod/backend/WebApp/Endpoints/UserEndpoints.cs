using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WebApp.Data.Enums;
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

public static class UsersEndpoints
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder app)
    {
        // Public Endpoints Group
        var publicGroup = app.MapGroup("/users")
            .WithTags("users");

        publicGroup.MapPost("login", Login);
        publicGroup.MapPost("refresh-token", RefreshToken);

        // Protected Endpoints Group
        var protectedGroup = app.MapGroup("/users")
            .RequireAuthorization()
            .WithTags("users");

        protectedGroup.MapPost("register", RegisterUser)
            .RequirePermissions(Permission.Update);
        protectedGroup.MapGet("roles", GetAllRoles)
            .RequirePermissions(Permission.Read);
        protectedGroup.MapGet("me", GetCurrentUser);
        protectedGroup.MapGet("{userId:guid}/permissions", GetUserPermissions);
        protectedGroup.MapPut("{userId:guid}", UpdateUser)
            .RequirePermissions(Permission.Update);
        protectedGroup.MapPut("{userId:guid}/roles", UpdateUserRoles)
            .RequirePermissions(Permission.Update);
        protectedGroup.MapPut("{userId:guid}/reset-password", ResetPassword)
            .RequirePermissions(Permission.Update);
        protectedGroup.MapDelete("{userId:guid}", DeleteUser)
            .RequirePermissions(Permission.Delete);
        protectedGroup.MapGet("", GetAllUsers)
            .RequirePermissions(Permission.Read);

        return app;
    }

    private static async Task<IResult> RegisterUser(
        [FromBody] RegisterUserRequest request,
        RegisterUserUseCase useCase)
    {
        await useCase.ExecuteAsync(request);
        return Results.Ok();
    }

    private static async Task<IResult> Login(
        [FromBody] LoginRequest request,
        LoginUseCase useCase)
    {
        var response = await useCase.ExecuteAsync(request);
        
        return Results.Ok(response);
    }

    private static async Task<IResult> RefreshToken(
        RefreshTokenUseCase useCase,
        [FromBody] string refreshToken,
        HttpContext context)
    {
        var userId = context.User.FindFirstValue("userId");
        Guid parsedUserId;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out parsedUserId))
            return Results.Unauthorized();
        
        var request = new RefreshTokenRequest(parsedUserId, refreshToken);
        var response = await useCase.ExecuteAsync(request);

        return Results.Ok(response);
    }
    
    // private static async Task<IResult> GetAllUsers(
    //     GetAllUsersUseCase useCase)
    // {
    //     var users = await useCase.ExecuteAsync();
    //     return Results.Ok(users);
    // }

    private static async Task<IResult> GetCurrentUser(
        HttpContext context,
        GetCurrentUserUseCase useCase)
    {
        var userId = context.User.FindFirstValue("userId");
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var parsedUserId))
            return Results.Unauthorized();

        var request = new GetCurrentUserRequest(parsedUserId);
        var user = await useCase.ExecuteAsync(request);
        return Results.Ok(user);
    }

    private static async Task<IResult> GetUserPermissions(
        Guid userId,
        GetUserPermissionsUseCase useCase)
    {
        var request = new GetUserPermissionsRequest(userId);
        var permissions = await useCase.ExecuteAsync(request);
        return Results.Ok(permissions.ToList());
    }

    private static async Task<IResult> UpdateUser(
        Guid userId,
        [FromBody] UpdateUserRequest request,
        UpdateUserUseCase useCase)
    {
        // Проверяем, совпадает ли userId из пути с userId в запросе
        if (userId != request.UserId)
            return Results.BadRequest();

        var updatedUser = await useCase.ExecuteAsync(request);
        return Results.Ok(updatedUser);
    }

    private static async Task<IResult> UpdateUserRoles(
        Guid userId,
        [FromBody] UpdateUserRolesRequest request,
        UpdateUserRolesUseCase useCase)
    {
        // Проверяем, совпадает ли userId из пути с userId в запросе
        if (userId != request.UserId)
            return Results.BadRequest();

        var updatedUser = await useCase.ExecuteAsync(request);
        return Results.Ok(updatedUser);
    }

    private static async Task<IResult> DeleteUser(
        Guid userId,
        DeleteUserUseCase useCase)
    {
        var request = new DeleteUserRequest(userId);
        await useCase.ExecuteAsync(request);
        return Results.NoContent();
    }

    private static async Task<IResult> ResetPassword(
        Guid userId,
        [FromBody] ResetPasswordRequest request,
        ResetPasswordUseCase useCase)
    {
        if (userId != request.UserId)
            return Results.BadRequest();

        await useCase.ExecuteAsync(request);
        return Results.Ok();
    }

    private static async Task<IResult> GetAllUsers(GetAllUsersUseCase useCase)
    {
        var users = await useCase.ExecuteAsync();
        return Results.Ok(users);
    }

    private static async Task<IResult> GetAllRoles(
        GetAllRolesUseCase useCase)
    {
        var roles = await useCase.ExecuteAsync();
        return Results.Ok(roles);
    }
}