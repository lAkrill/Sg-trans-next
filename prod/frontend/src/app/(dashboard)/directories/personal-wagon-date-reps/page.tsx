"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { personalWagonDateRepsConfig } from "@/lib/directories/personal-wagon-date-reps.config";

export default function PersonalWagonDateRepsPage() {
  return <DirectoryManager config={personalWagonDateRepsConfig} />;
}
