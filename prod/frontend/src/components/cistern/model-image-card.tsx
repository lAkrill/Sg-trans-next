"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { filesApi } from "@/api/files";

function parseStoredFilePath(fileValue: string, fallbackDirectory: string) {
  const normalized = fileValue.replace(/\\/g, "/");
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex === -1) {
    return { directory: fallbackDirectory, fileName: normalized };
  }
  return {
    directory: normalized.slice(0, slashIndex) || fallbackDirectory,
    fileName: normalized.slice(slashIndex + 1),
  };
}

interface ModelImageCardProps {
  fileImage: string;
  directory?: string;
}

export function ModelImageCard({
  fileImage,
  directory = "WagonModels",
}: ModelImageCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      setImageUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev);
        return null;
      });

      try {
        const { directory: fileDirectory, fileName } = parseStoredFilePath(
          fileImage,
          directory
        );
        const blob = await filesApi.download(fileName, fileDirectory);
        objectUrl = window.URL.createObjectURL(blob);

        if (cancelled) {
          window.URL.revokeObjectURL(objectUrl);
          return;
        }

        setImageUrl(objectUrl);
      } catch (error) {
        console.error("Ошибка при загрузке изображения модели:", error);
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileImage, directory]);

  return (
    <Card className="h-full">
      <CardContent>
        <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-md border bg-muted/30">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : hasError || !imageUrl ? (
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span>Не удалось загрузить изображение</span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Изображение модели вагона"
              className="max-h-[320px] w-full object-contain"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
