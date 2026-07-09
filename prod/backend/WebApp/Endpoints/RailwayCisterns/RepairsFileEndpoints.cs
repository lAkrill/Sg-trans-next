using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Enums;
using WebApp.DTO.RailwayCisterns;
using WebApp.Extensions;

namespace WebApp.Endpoints.RailwayCisterns;

public static class RepairsFileEndpoints
{
    public static void MapRepairsFileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/RepairsFiles")
            .RequireAuthorization()
            .WithTags("RepairsFiles");

        group.MapPost("/process-repairs-file", ProcessRepairsFile)
            .WithName("ProcessRepairsFile")
            .WithOpenApi()
            .DisableAntiforgery()
            .Produces(200)
            .Produces(400)
            .Produces(500);
        
        var group2 = app.MapGroup("/api/ImportFiles")
            .RequireAuthorization()
            .WithTags("ImportFiles");
            
        group.MapPost("/process-import-file", ImportFile)
            .WithName("ProcessImportFile")
            .WithOpenApi()
            .DisableAntiforgery()
            .Produces(200)
            .Produces(400)
            .Produces(500);
    }

    private static async Task<IResult> ProcessRepairsFile(
    IFormFile file,
    IHttpClientFactory httpClientFactory) // Используем фабрику для надежности
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest("Файл не был загружен");
        }

        try
        {
            var client = httpClientFactory.CreateClient("FastAPI");
            

            // Настраиваем таймаут, если файл большой
            client.Timeout = TimeSpan.FromMinutes(5);

            using var content = new MultipartFormDataContent();

            // Открываем поток чтения напрямую из IFormFile
            using var stream = file.OpenReadStream();
            var streamContent = new StreamContent(stream);

            // Копируем заголовки типа контента
            streamContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");

            // "file" — это имя аргумента, которое ожидает FastAPI (@app.post("/.../"){ file: UploadFile })
            content.Add(streamContent, "file", file.FileName);

            // Используем 127.0.0.1 вместо localhost
            var response = await client.PostAsync("process-repairs-file/", content);

            var responseData = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                return Results.Content(responseData, "application/json");
            }

            return Results.StatusCode((int)response.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            // Выводим ошибку, чтобы понять, почему нет связи (Connection Refused / Timeout)
            return Results.Problem(detail: ex.Message, statusCode: 503, title: "FastAPI unreachable");
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, statusCode: 500);
        }
    }

    private static async Task<IResult> ImportFile(
        IFormFile file,
        [FromForm] string fileType,
        [FromForm] string dataType,
        IHttpClientFactory httpClientFactory)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest("Файл не был загружен");
        }

        if (string.IsNullOrWhiteSpace(fileType) || string.IsNullOrWhiteSpace(dataType))
        {
            return Results.BadRequest("Параметры fileType и dataType обязательны");
        }

        try
        {
            var client = httpClientFactory.CreateClient("FastAPI");
            client.Timeout = TimeSpan.FromMinutes(5);

            using var content = new MultipartFormDataContent();

            using var stream = file.OpenReadStream();
            var streamContent = new StreamContent(stream);
            streamContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");

            content.Add(streamContent, "file", file.FileName);

            var payload = JsonSerializer.Serialize(new { fileType, dataType });
            content.Add(new StringContent(payload, Encoding.UTF8, "text/plain"), "data");

            var response = await client.PostAsync("process-import-file/", content);
            var responseData = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                return Results.Content(responseData, "application/json");
            }

            return Results.StatusCode((int)response.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem(detail: ex.Message, statusCode: 503, title: "FastAPI unreachable");
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, statusCode: 500);
        }
    }
}