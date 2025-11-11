"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { vesselsConfig } from "@/lib/directories";

export default function VesselsPage() {
  return <DirectoryManager config={vesselsConfig} />;
}
