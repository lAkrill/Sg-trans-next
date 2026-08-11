"use client";

import { DirectoryManager } from "@/components/directory-manager";
import { employeesConfig } from "@/lib/directories/employees.config";

export default function EmployeesPage() {
  return <DirectoryManager config={employeesConfig} />;
}
