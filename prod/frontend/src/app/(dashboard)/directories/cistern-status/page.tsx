"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { cisternStatusConfig } from "@/lib/directories/railwayCistern-status";

export default function CisternStatusPage() {
  return <DirectoryManager config={cisternStatusConfig} />;
}
