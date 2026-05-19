"use client";

import { Train } from "lucide-react";
import type { CisternStatusDTO, CreateCisternStatusDTO, UpdateCisternStatusDTO } from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";
import { useCisternStatuses, useCreateCisternStatus, useDeleteCisternStatus, useUpdateCisternStatus } from "@/hooks/railwayCisternStatus.hook";

// Базовая конфигурация полей
export const cisternStatusBaseConfig: BaseDirectoryConfig = {
  name: 'cisternStatuses',
  endpoint: 'railway-cistern-status',
  displayName: 'Статусы вагон-цистерн',
  description: 'Справочник статусов вагон-цистерн',
  fields: [
    {
      key: 'name',
      label: 'Название',
      type: 'text',
      required: true,
      placeholder: 'Введите название статуса',
    }

  ],
};

// Конфигурация для DirectoryManager
export const cisternStatusConfig: DirectoryConfig<CisternStatusDTO, CreateCisternStatusDTO, UpdateCisternStatusDTO> = {
  title: cisternStatusBaseConfig.displayName,
  description: cisternStatusBaseConfig.description,
  icon: Train,
  fields: cisternStatusBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: useCisternStatuses,
    useCreate: useCreateCisternStatus,
    useUpdate: useUpdateCisternStatus,
    useDelete: useDeleteCisternStatus,
  },
  searchFields: ["name"] as (keyof CisternStatusDTO)[],
  tableColumns: [
    { key: "name", label: "Название" },
  ],
  createInitialData: () => ({ name: "" }),
  mapToFormData: (item: CisternStatusDTO) => ({
    name: item.name,
  }),
};
