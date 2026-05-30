"use client";

import { CheckCircle } from "lucide-react";
import {
  usePartStatuses,
  useCreatePartStatus,
  useUpdatePartStatus,
  useDeletePartStatus,
} from "@/hooks";
import type { PartStatusDTO, CreatePartStatusDTO, UpdatePartStatusDTO } from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

// Базовая конфигурация полей
export const partStatusesBaseConfig: BaseDirectoryConfig = {
  name: "partStatuses",
  endpoint: "part-statuses",
  displayName: "Статусы деталей",
  description: "Справочник статусов деталей",
  fields: [
    {
      key: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "Введите название статуса",
    },
    {
      key: "code",
      label: "Код",
      type: "number",
      required: true,
      placeholder: "Введите код",
    },
    {
      key: "color",
      label: "Цвет",
      type: "text",
      required: false,
      placeholder: "Введите цвет (hex)",
    },
  ],
};

// Конфигурация для DirectoryManager
export const partStatusesConfig: DirectoryConfig<PartStatusDTO, CreatePartStatusDTO, UpdatePartStatusDTO> = {
  title: partStatusesBaseConfig.displayName,
  description: partStatusesBaseConfig.description,
  icon: CheckCircle,
  fields: partStatusesBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: usePartStatuses,
    useCreate: useCreatePartStatus,
    useUpdate: useUpdatePartStatus,
    useDelete: useDeletePartStatus,
  },
  searchFields: ["name"] as (keyof PartStatusDTO)[],
  tableColumns: [
    { key: "name", label: "Название" },
    { key: "code", label: "Код" },
    { key: "color", label: "Цвет" },
  ],
  createInitialData: () => ({ name: "", code: 0, color: "" }),
  mapToFormData: (item: PartStatusDTO) => ({
    name: item.name,
    code: item.code,
    color: item.color,
  }),
};
