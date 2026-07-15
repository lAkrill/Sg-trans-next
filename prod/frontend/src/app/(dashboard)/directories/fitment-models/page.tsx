"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { fitmentModelsConfig } from "@/lib/directories/fitment-models.config";

export default function FitmentModelsPage() {
  return <DirectoryManager config={fitmentModelsConfig} />;
}
