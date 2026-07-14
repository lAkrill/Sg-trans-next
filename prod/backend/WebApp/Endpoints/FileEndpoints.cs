using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using WebApp.Extensions;

namespace WebApp.Endpoints;

public static class FileEndpoints
{
    private const string DefaultDataDirectory = "C:\\inetpub\\wwwroot\\data";
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    public static void MapFileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/files")
            .RequireAuthorization()
            .WithTags("files");

        group.MapPost("/upload", UploadFile)
            .WithName("UploadFile")
            .WithOpenApi()
            .DisableAntiforgery()
            .Accepts<IFormFile>("multipart/form-data")
            .Produces(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status500InternalServerError);

        group.MapGet("/download", DownloadFile)
            .WithName("DownloadFile")
            .WithOpenApi()
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status500InternalServerError);
    }

    private static async Task<IResult> UploadFile(
        IFormFile file,
        [FromForm] string? directory,
        [FromForm] string? fileName,
        [FromServices] IWebHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return Results.BadRequest(new { error = "Файл не был загружен" });
        }

        var safeFileName = string.IsNullOrWhiteSpace(fileName)
            ? Path.GetFileName(file.FileName)
            : Path.GetFileName(fileName);

        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            return Results.BadRequest(new { error = "Имя файла обязательно" });
        }

        var relativeDirectory = string.IsNullOrWhiteSpace(directory)
            ? string.Empty
            : directory.Trim();

        if (!string.IsNullOrEmpty(relativeDirectory) &&
            (Path.IsPathRooted(relativeDirectory) || relativeDirectory.Contains("..")))
        {
            return Results.BadRequest(new { error = "Недопустимая директория" });
        }

        var dataRoot = Path.Combine(environment.ContentRootPath, DefaultDataDirectory);
        var combinedDirectory = string.IsNullOrEmpty(relativeDirectory)
            ? dataRoot
            : Path.Combine(dataRoot, relativeDirectory);
        var normalizedDirectory = Path.GetFullPath(combinedDirectory);

        if (!normalizedDirectory.StartsWith(dataRoot, StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new { error = "Недопустимая директория" });
        }

        Directory.CreateDirectory(normalizedDirectory);

        var outputPath = Path.Combine(normalizedDirectory, safeFileName);

        try
        {
            await using var destinationStream = File.Create(outputPath);
            await using var sourceStream = file.OpenReadStream();
            await sourceStream.CopyToAsync(destinationStream, cancellationToken);

            var responseUri = $"/api/files/download?directory={Uri.EscapeDataString(relativeDirectory)}&fileName={Uri.EscapeDataString(safeFileName)}";
            return Results.Created(responseUri, new { directory = relativeDirectory, fileName = safeFileName });
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.Message, statusCode: StatusCodes.Status500InternalServerError);
        }
    }

    private static IResult DownloadFile(
        [FromQuery] string? directory,
        [FromQuery] string fileName,
        [FromServices] IWebHostEnvironment environment)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return Results.BadRequest(new { error = "Имя файла обязательно" });
        }

        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            return Results.BadRequest(new { error = "Недопустимое имя файла" });
        }

        var relativeDirectory = string.IsNullOrWhiteSpace(directory)
            ? string.Empty
            : directory.Trim();

        if (!string.IsNullOrEmpty(relativeDirectory) &&
            (Path.IsPathRooted(relativeDirectory) || relativeDirectory.Contains("..")))
        {
            return Results.BadRequest(new { error = "Недопустимая директория" });
        }

        var dataRoot = Path.Combine(environment.ContentRootPath, DefaultDataDirectory);
        var combinedDirectory = string.IsNullOrEmpty(relativeDirectory)
            ? dataRoot
            : Path.Combine(dataRoot, relativeDirectory);
        var normalizedDirectory = Path.GetFullPath(combinedDirectory);

        if (!normalizedDirectory.StartsWith(dataRoot, StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new { error = "Недопустимая директория" });
        }

        var filePath = Path.Combine(normalizedDirectory, safeFileName);
        if (!File.Exists(filePath))
        {
            return Results.NotFound(new { error = "Файл не найден" });
        }

        var contentType = ContentTypeProvider.TryGetContentType(filePath, out var providerContentType)
            ? providerContentType
            : "application/octet-stream";

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Results.File(stream, contentType, safeFileName);
    }
}
