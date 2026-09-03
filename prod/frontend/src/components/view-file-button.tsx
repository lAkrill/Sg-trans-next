"use client";

import { useState, type ComponentType } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
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

interface ViewFileButtonProps {
  value: unknown;
  directory: string;
  label?: string;
  title?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function ViewFileButton({
  value,
  directory,
  label = "Посмотреть",
  title,
  icon: Icon = Eye,
}: ViewFileButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (typeof value !== "string" || !value.trim()) {
    return "—";
  }

  const handleView = async () => {
    setIsLoading(true);
    try {
      const { directory: fileDirectory, fileName } = parseStoredFilePath(value, directory);
      const blob = await filesApi.download(fileName, fileDirectory);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error("Ошибка при открытии файла:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleView}
      disabled={isLoading}
      title={title ?? (label || "Посмотреть")}
    >
      {isLoading ? (
        <Loader2 className={label ? "mr-2 h-4 w-4 animate-spin" : "h-4 w-4 animate-spin"} />
      ) : (
        <Icon className={label ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      )}
      {label}
    </Button>
  );
}
