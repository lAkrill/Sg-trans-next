using System.Net;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
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
        var request = context.Request;
        var requestBody = string.Empty;

        // Read body only for API POST/PUT/PATCH methods, to preserve request stream.
        if (request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase) &&
            !HttpMethods.IsGet(request.Method) &&
            !HttpMethods.IsHead(request.Method) &&
            !HttpMethods.IsOptions(request.Method))
        {
            request.EnableBuffering();

            if (request.Body.CanRead)
            {
                using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                request.Body.Position = 0;

                if (!string.IsNullOrWhiteSpace(requestBody) && requestBody.Length > 2000)
                {
                    requestBody = requestBody[..2000] + "...";
                }
            }
        }

        await _next(context);

        try
        {
            if (!request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
                return;

            if (HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method) || HttpMethods.IsOptions(request.Method))
                return;

            if (HttpMethods.IsPost(request.Method) && IsFilteredPostEndpoint(request.Path))
                return;

            var userIdString = context.User?.FindFirstValue("userId");
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return;

            string? ip = null;
            if (request.Headers.TryGetValue("X-Forwarded-For", out var xff))
            {
                ip = xff.ToString().Split(',').FirstOrDefault()?.Trim();
            }
            if (string.IsNullOrEmpty(ip))
            {
                ip = context.Connection.RemoteIpAddress?.ToString();
            }

            var routeEndpoint = context.GetEndpoint() as RouteEndpoint;
            var routePattern = routeEndpoint?.RoutePattern?.RawText;
            var routeValues = request.RouteValues;
            var routeValueText = routeValues.Count > 0
                ? string.Join(", ", routeValues.Select(kvp => $"{kvp.Key}={kvp.Value}"))
                : string.Empty;

            var apiName = routePattern is not null
                ? $"{request.Method} {routePattern}{request.QueryString}"
                : $"{request.Method} {request.Path}{request.QueryString}";

            if (!string.IsNullOrWhiteSpace(routeValueText))
            {
                apiName += $" [{routeValueText}]";
            }

            var noteBuilder = new StringBuilder();
            noteBuilder.Append($"Status: {context.Response?.StatusCode}");

            if (!string.IsNullOrWhiteSpace(request.QueryString.Value))
            {
                noteBuilder.Append($"; Query: {request.QueryString.Value}");
            }

            if (!string.IsNullOrWhiteSpace(requestBody))
            {
                noteBuilder.Append($"; Body: {requestBody}");
            }

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
                Note = noteBuilder.ToString()
            };

            db.ActionLogs.Add(entry);
            await db.SaveChangesAsync();
        }
        catch
        {
            // Swallow any logging errors to avoid breaking the request pipeline
        }
    }

    private static bool IsFilteredPostEndpoint(PathString path)
    {
        var normalized = path.Value?.TrimEnd('/').ToLowerInvariant() ?? string.Empty;
        return normalized.StartsWith("/api/fitments/filter")
            || normalized.StartsWith("/api/parts/filter")
            || normalized.StartsWith("/api/repairs-in/filter")
            || normalized.StartsWith("/api/repairs-out/filter")
            || normalized.StartsWith("/api/repairs-matching/filter")
            || normalized.StartsWith("/api/railway-cisterns/filter")
            || normalized.StartsWith("/api/dislocations/locations/in-range")
            || normalized.StartsWith("/api/dislocations/cisterns-last-location");
    }
}
