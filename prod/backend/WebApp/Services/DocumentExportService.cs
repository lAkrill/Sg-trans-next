using System.IO;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Xceed.Document.NET;
using Xceed.Words.NET;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using WebApp.DTO.Common;

namespace WebApp.Services;

public class DocumentExportService
{
    public DocumentExportService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<(byte[] Content, string ContentType, string FileName)> ExportTableAsync(
        ExportTableRequestDTO request)
    {
        if (string.IsNullOrEmpty(request.Type))
            throw new ArgumentException("Export type is required (doc, xls, or pdf)");

        if (request.Columns == null || request.Columns.Count == 0)
            throw new ArgumentException("Columns must be specified");

        if (request.Data == null || request.Data.Count == 0)
            throw new ArgumentException("Data must be provided");

        var fileName = string.IsNullOrEmpty(request.FileName) ? "export" : request.FileName;

        var result = request.Type.ToLower() switch
        {
            "doc" => ExportToWord(request, fileName),
            "docx" => ExportToWord(request, fileName),
            "xls" => ExportToExcel(request, fileName),
            "xlsx" => ExportToExcel(request, fileName),
            "pdf" => ExportToPdf(request, fileName),
            _ => throw new ArgumentException($"Unsupported export type: {request.Type}")
        };

        return Task.FromResult(result);
    }

    private (byte[] Content, string ContentType, string FileName) ExportToWord(
        ExportTableRequestDTO request, string baseFileName)
    {
        var tempFile = Path.GetTempFileName() + ".docx";
        try
        {
            using (var document = DocX.Create(tempFile))
            {
                // Add title
                // document.InsertParagraph($"Table Export - {DateTime.Now:yyyy-MM-dd HH:mm:ss}")
                //     .FontSize(14)
                //     .Bold();
                // document.InsertParagraph(""); // Empty line

                // Create table: rows = data rows + 1 header row
                var table = document.InsertTable(request.Data.Count + 1, request.Columns.Count);

                // Fill header row
                for (int i = 0; i < request.Columns.Count; i++)
                {
                    var headerCell = table.Rows[0].Cells[i];
                    headerCell.Paragraphs[0].InsertText(request.Columns[i].Label);
                    headerCell.Paragraphs[0].Bold();
                }

                // Fill data rows
                for (int rowIndex = 0; rowIndex < request.Data.Count; rowIndex++)
                {
                    var dataRow = request.Data[rowIndex];
                    for (int colIndex = 0; colIndex < request.Columns.Count; colIndex++)
                    {
                        var column = request.Columns[colIndex];
                        var value = dataRow.ContainsKey(column.Key) ? dataRow[column.Key] : null;
                        var cell = table.Rows[rowIndex + 1].Cells[colIndex];
                        
                        // Insert text into the existing paragraph
                        cell.Paragraphs[0].InsertText(value?.ToString() ?? "");
                    }
                }

                document.Save();
            }

            var content = File.ReadAllBytes(tempFile);
            return (content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"{baseFileName}.docx");
        }
        finally
        {
            if (File.Exists(tempFile))
                File.Delete(tempFile);
        }
    }

    private (byte[] Content, string ContentType, string FileName) ExportToExcel(
        ExportTableRequestDTO request, string baseFileName)
    {
        using (var workbook = new XLWorkbook())
        {
            var worksheet = workbook.Worksheets.Add("Data");

            // Add header row
            for (int i = 0; i < request.Columns.Count; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = request.Columns[i].Label;
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightGray;
            }

            // Add data rows
            for (int rowIndex = 0; rowIndex < request.Data.Count; rowIndex++)
            {
                var dataRow = request.Data[rowIndex];
                for (int colIndex = 0; colIndex < request.Columns.Count; colIndex++)
                {
                    var column = request.Columns[colIndex];
                    var value = dataRow.ContainsKey(column.Key) ? dataRow[column.Key] : "";

                    var cell = worksheet.Cell(rowIndex + 2, colIndex + 1);

                    // Format based on column type
                    if (value != null)
                    {
                        switch (column.Type?.ToLower())
                        {
                            case "number":
                                if (decimal.TryParse(value.ToString(), out var decimalValue))
                                {
                                    cell.Value = decimalValue;
                                    cell.Style.NumberFormat.Format = "#,##0.00";
                                }
                                else
                                {
                                    cell.Value = value.ToString();
                                }
                                break;
                            case "date":
                                if (DateTime.TryParse(value.ToString(), out var dateValue))
                                {
                                    cell.Value = dateValue;
                                    cell.Style.DateFormat.Format = "yyyy-MM-dd";
                                }
                                else
                                {
                                    cell.Value = value.ToString();
                                }
                                break;
                            default:
                                cell.Value = value.ToString();
                                break;
                        }
                    }
                }
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            using (var memoryStream = new MemoryStream())
            {
                workbook.SaveAs(memoryStream);
                var content = memoryStream.ToArray();
                return (content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    $"{baseFileName}.xlsx");
            }
        }
    }

    private (byte[] Content, string ContentType, string FileName) ExportToPdf(
        ExportTableRequestDTO request, string baseFileName)
    {
        var document = QuestPDF.Fluent.Document.Create(container =>
            container.Page(page =>
            {
                page.Size(842, 595); // A4 Landscape in points
                page.Margin(20);

                page.Content().Column(column =>
                {
                    // Title
                    // column.Item().Text($"Table Export - {DateTime.Now:yyyy-MM-dd HH:mm:ss}")
                    //     .FontSize(14)
                    //     .Bold();

                    column.Item().PaddingTop(10);

                    // Table
                    column.Item().Table(table =>
                    {
                        // Configure columns
                        table.ColumnsDefinition(columns =>
                        {
                            for (int i = 0; i < request.Columns.Count; i++)
                            {
                                columns.RelativeColumn();
                            }
                        });

                        // Header row
                        table.Header(header =>
                        {
                            for (int i = 0; i < request.Columns.Count; i++)
                            {
                                header.Cell()
                                    .Background("#E0E0E0")
                                    .Padding(5)
                                    .Text(request.Columns[i].Label)
                                    .Bold()
                                    .FontSize(10);
                            }
                        });

                        // Data rows
                        foreach (var dataRow in request.Data)
                        {
                            for (int colIndex = 0; colIndex < request.Columns.Count; colIndex++)
                            {
                                var column = request.Columns[colIndex];
                                var value = dataRow.ContainsKey(column.Key) ? dataRow[column.Key] : "";
                                var displayValue = value?.ToString() ?? "";

                                table.Cell()
                                    .BorderBottom(1)
                                    .BorderColor("#CCCCCC")
                                    .Padding(5)
                                    .Text(displayValue)
                                    .FontSize(9);
                            }
                        }
                    });
                });
            }));

        return (document.GeneratePdf(), "application/pdf", $"{baseFileName}.pdf");
    }
}

