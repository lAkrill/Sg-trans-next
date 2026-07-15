"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { fitmentsConfig } from "@/lib/directories/fitments.config";

export default function FitmentsPage() {
  return <DirectoryManager config={fitmentsConfig} />;
}
