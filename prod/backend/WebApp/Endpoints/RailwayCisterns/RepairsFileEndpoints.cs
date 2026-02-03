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
    }

    private static async Task<IResult> ProcessRepairsFile(
        IFormFile file,
        [FromServices] HttpClient httpClient)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest("Файл не был загружен или имеет нулевой размер");
        }

        try
        {
            using (var content = new MultipartFormDataContent())
            {
                using (var stream = file.OpenReadStream())
                {
                    var streamContent = new StreamContent(stream);
                    streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                    content.Add(streamContent, "file", file.FileName);

                    var response = await httpClient.PostAsync("http://localhost:8000/process-repairs-file/", content);

                    if (response.IsSuccessStatusCode)
                    {
                        var responseContent = await response.Content.ReadAsStringAsync();
                        return Results.Ok(new { message = "Файл успешно обработан", data = responseContent });
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        return Results.StatusCode((int)response.StatusCode);
                    }
                }
            }
        }
        catch (HttpRequestException ex)
        {
            return Results.StatusCode(503);
        }
        catch (Exception ex)
        {
            return Results.StatusCode(500);
        }
    }
}