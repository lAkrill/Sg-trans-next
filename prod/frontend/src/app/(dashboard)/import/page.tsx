"use client";

import { useRef, useState } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@/components/ui";
import { Import, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { importFilesApi, type ImportFileProcessResponse } from "@/api/import-files";

const REPAIRS_FILE_URL = "http://vagon.sgtrans.by:5000/api/RepairsFiles/process-repairs-file";

export default function ImportPage() {
  const repairsFileInputRef = useRef<HTMLInputElement>(null);
  const partsPdfFileInputRef = useRef<HTMLInputElement>(null);
  const partsTxtFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<"repairs" | "parts" | null>(null);
  const [repairsError, setRepairsError] = useState<string | null>(null);
  const [repairsSuccess, setRepairsSuccess] = useState(false);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [partsSuccess, setPartsSuccess] = useState(false);
  const [partsImportResult, setPartsImportResult] =
    useState<ImportFileProcessResponse | null>(null);

  const getUploadErrorMessage = (err: unknown) =>
    err && typeof err === "object" && "response" in err
      ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
      : null;

  const handleRepairsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setRepairsError(null);
    setRepairsSuccess(false);
    setUploadingType("repairs");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(REPAIRS_FILE_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setRepairsSuccess(true);
    } catch (err: unknown) {
      setRepairsError(getUploadErrorMessage(err) || "Ошибка при загрузке файла");
    } finally {
      setUploadingType(null);
    }
  };

  const handlePartsFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "pdf" | "txt"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPartsError(null);
    setPartsSuccess(false);
    setPartsImportResult(null);
    setUploadingType("parts");

    try {
      const result = await importFilesApi.processImportFile(file, fileType);
      setPartsImportResult(result);
      setPartsSuccess(true);
    } catch (err: unknown) {
      setPartsError(getUploadErrorMessage(err) || "Ошибка при загрузке файла комплектации");
    } finally {
      setUploadingType(null);
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} Б`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const partsImportStatistics = partsImportResult?.statistics;

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Импорт данных</h1>
      </div>

 

        {/* System Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Import className="h-5 w-5" />
             Импорт данных о ремонтах
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={repairsFileInputRef}
              type="file"
              accept=".txt,.csv"
              className="hidden"
              onChange={handleRepairsFileChange}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => repairsFileInputRef.current?.click()}
              >
                {uploadingType === "repairs" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить данные о ремонтах"
                )}
              </Button>
              {repairsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{repairsError}</p>
              )}
              {repairsSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Файл успешно обработан
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Import className="h-5 w-5" />
             Импорт данных о комплектации вагона-цистерны
            </CardTitle>
          
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={partsPdfFileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handlePartsFileChange(e, "pdf")}
            />
            <input
              ref={partsTxtFileInputRef}
              type="file"
              accept=".txt"
              className="hidden"
              onChange={(e) => handlePartsFileChange(e, "txt")}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => partsPdfFileInputRef.current?.click()}
              >
                {uploadingType === "parts" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить PDF комплектации"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingType !== null}
                onClick={() => partsTxtFileInputRef.current?.click()}
              >
                {uploadingType === "parts" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  "Загрузить TXT файл комплектации"
                )}
              </Button>
              {partsError && (
                <p className="text-sm text-red-600 dark:text-red-400">{partsError}</p>
              )}
              {partsSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {partsImportResult?.message || "Файл комплектации успешно обработан"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      <Dialog
        open={Boolean(partsImportResult)}
        onOpenChange={(open) => {
          if (!open) setPartsImportResult(null);
        }}
      >
        <DialogContent className="max-h-[85vh] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Результат обработки файла комплектации</DialogTitle>
            <DialogDescription>
              {partsImportResult?.message || "Статус выполнения импорта комплектации"}
            </DialogDescription>
          </DialogHeader>

          {partsImportResult ? (
            <div className="space-y-4 min-h-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Файл</div>
                  <div className="text-sm font-medium break-all">{partsImportResult.filename}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Размер</div>
                  <div className="text-sm font-medium">{formatFileSize(partsImportResult.size)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Статус</div>
                  <Badge variant={partsImportResult.status === "success" ? "default" : "destructive"}>
                    {partsImportResult.status}
                  </Badge>
                </div>
              </div>

              {partsImportStatistics ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Всего обработано</div>
                    <div className="text-xl font-semibold">
                      {partsImportStatistics.total_processed}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Успешно</div>
                    <div className="text-xl font-semibold text-green-600">
                      {partsImportStatistics.success}
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Ошибки</div>
                    <div className="text-xl font-semibold text-red-600">
                      {partsImportStatistics.errors}
                    </div>
                  </div>
                </div>
              ) : null}

              {partsImportResult.details?.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Детали обработки</div>
                  <ScrollArea className="h-[320px] rounded-md border">
                    <div className="divide-y">
                      {partsImportResult.details.map((detail, index) => (
                        <div key={`${detail.EquipmentTypeId}-${detail.Part_number}-${index}`} className="p-3">
                          <div className="grid gap-2 text-sm sm:grid-cols-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Тип оборудования</div>
                              <div className="font-medium">{detail.EquipmentTypeId || "—"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Клеймо</div>
                              <div className="font-medium">{detail.Part_stamp || "—"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Зав. номер</div>
                              <div className="font-medium">{detail.Part_number || "—"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Год</div>
                              <div className="font-medium">{detail.Part_year || "—"}</div>
                            </div>
                          </div>
                          <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-2 text-xs">
                            {detail.status || "—"}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
  

     
    </div>
  );
}
