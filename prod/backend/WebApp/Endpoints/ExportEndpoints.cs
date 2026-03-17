using Microsoft.AspNetCore.Mvc;
using WebApp.DTO.Common;
using WebApp.Services;

namespace WebApp.Endpoints;

public static class ExportEndpoints
{
    public static void MapExportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/export")
            .WithTags("export");

        group.MapPost("/table", ExportTable)
            .WithName("ExportTable")
            .WithOpenApi()
            .WithDescription("Export table data to Word (doc), Excel (xls), or PDF format")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Accepts<ExportTableRequestDTO>("application/json");
    }

    private static async Task<IResult> ExportTable(
        [FromBody] ExportTableRequestDTO request,
        [FromServices] DocumentExportService exportService,
        CancellationToken cancellationToken)
    {
        try
        {
            var (content, contentType, fileName) = await exportService.ExportTableAsync(request);

            return Results.File(
                fileContents: content,
                contentType: contentType,
                fileDownloadName: fileName);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { error = ex.Message });
        }
        catch
        {
            return Results.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
