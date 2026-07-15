"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { fitmentTypesConfig } from "@/lib/directories/fitment-types.config";

export default function FitmentTypesPage() {
  return <DirectoryManager config={fitmentTypesConfig} />;
}
