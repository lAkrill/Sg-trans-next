using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WebApp.Exceptions;

namespace WebApp.Middlewares;

public class GlobalExceptionHandlingMiddleware : IMiddleware
{
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Произошла ошибка при обработке запроса");
            
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = exception switch
        {
            ApiException apiException => new ErrorResponse(
                Status: "Error",
                Message: apiException.Message,
                StatusCode: apiException.StatusCode
            ),
            UnauthorizedAccessException => new ErrorResponse(
                Status: "Error",
                Message: "Отказано в доступе",
                StatusCode: (int)HttpStatusCode.Unauthorized
            ),
            DbUpdateException dbException => HandleDbUpdateException(dbException),
            _ => new ErrorResponse(
                Status: "Error",
                Message: "Произошла внутренняя ошибка сервера",
                StatusCode: (int)HttpStatusCode.InternalServerError,
                Details: exception.Message
            )
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = response.StatusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }

    private static ErrorResponse HandleDbUpdateException(DbUpdateException exception)
    {
        var innerException = exception.InnerException;

        // Проверка на ошибки PostgreSQL (P0001 - пользовательское исключение из триггера)
        if (innerException?.GetType().Name == "PostgresException")
        {
            // Пытаемся получить SqlState через reflection (P0001 = пользовательское исключение)
            var sqlStateProperty = innerException.GetType().GetProperty("SqlState");
            var sqlState = sqlStateProperty?.GetValue(innerException) as string;

            // Если это пользовательское исключение (P0001) из триггера БД
            if (sqlState == "P0001")
            {
                var postgresErrorMessage = innerException.Message ?? "";
                
                return new ErrorResponse(
                    Status: "Error",
                    Message: "Ошибка валидации данных: " + postgresErrorMessage,
                    StatusCode: (int)HttpStatusCode.Conflict,
                    Details: postgresErrorMessage
                );
            }
        }

        // Проверка на нарушение уникального ограничения
        if (innerException?.Message.Contains("unique_part_equipments", StringComparison.OrdinalIgnoreCase) ?? false)
        {
            return new ErrorResponse(
                Status: "Error",
                Message: "Запись с такой комбинацией цистерны, детали, даты документа и операции уже существует. Нарушено уникальное ограничение (RailwayCisternsId, PartsId, DocumentDate, Operation).",
                StatusCode: (int)HttpStatusCode.Conflict,
                Details: "Невозможно добавить дубликат записи. Проверьте уникальность комбинации полей."
            );
        }

        // Проверка на другие нарушения уникальности
        if (innerException?.Message.Contains("UNIQUE constraint failed", StringComparison.OrdinalIgnoreCase) ??
            innerException?.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ?? false)
        {
            return new ErrorResponse(
                Status: "Error",
                Message: "Нарушено уникальное ограничение базы данных. Запись с такими значениями уже существует.",
                StatusCode: (int)HttpStatusCode.Conflict,
                Details: "Проверьте уникальность данных перед добавлением."
            );
        }

        // Общая ошибка БД
        return new ErrorResponse(
            Status: "Error",
            Message: "Ошибка при сохранении в базу данных",
            StatusCode: (int)HttpStatusCode.InternalServerError,
            Details: exception.Message
        );
    }
}

public record ErrorResponse(
    string Status,
    string Message,
    int StatusCode,
    string? Details = null
);
