using System.Net;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using WebApp.Data;
using WebApp.Data.Entities.Audit;

namespace WebApp.Middlewares;

public class ActionLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public ActionLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Let the request run and capture response status
        await _next(context);

        try
        {
            var request = context.Request;

            // Only log API calls and non-GET methods
            if (!request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
                return;

            if (HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method) || HttpMethods.IsOptions(request.Method))
                return;

            // Require authenticated user with userId claim
            var userIdString = context.User?.FindFirstValue("userId");
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return;

            // Resolve IP (check X-Forwarded-For first)
            string? ip = null;
            if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var xff))
            {
                ip = xff.ToString().Split(',').FirstOrDefault()?.Trim();
            }
            if (string.IsNullOrEmpty(ip))
            {
                ip = context.Connection.RemoteIpAddress?.ToString();
            }

            var apiName = context.GetEndpoint()?.DisplayName ?? $"{request.Method} {request.Path}{request.QueryString}";

            // Create and save ActionLog
            var db = context.RequestServices.GetService(typeof(ApplicationDbContext)) as ApplicationDbContext;
            if (db == null)
                return;

            var entry = new ActionLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DateTime = DateTime.Now,
                IP = ip,
                API = apiName,
                Note = $"Status: {context.Response?.StatusCode}"
            };

            db.ActionLogs.Add(entry);
            await db.SaveChangesAsync();
        }
        catch
        {
            // Swallow any logging errors to avoid breaking the request pipeline
        }
    }
}
