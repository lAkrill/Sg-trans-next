"use client";

import { Settings } from "lucide-react";
import {
  usePartTypes,
  useCreatePartType,
  useUpdatePartType,
  useDeletePartType,
} from "@/hooks";
import type { PartTypeDTO, CreatePartTypeDTO, UpdatePartTypeDTO } from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

// Базовая конфигурация полей
export const partTypesBaseConfig: BaseDirectoryConfig = {
  name: "partTypes",
  endpoint: "part-types",
  displayName: "Типы деталей",
  description: "Справочник типов деталей",
  fields: [
    {
      key: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "Введите название типа детали",
    },
    {
      key: "code",
      label: "Код",
      type: "number",
      required: true,
      placeholder: "Введите код",
    },
    {
      key: "description",
      label: "Описание",
      type: "textarea",
      required: false,
      placeholder: "Введите описание",
    },
    {
      key: "weight",
      label: "Средний вес (списание)",
      type: "number",
      required: false,
      placeholder: "Введите вес",
    },
  ],
};

// Конфигурация для DirectoryManager
export const partTypesConfig: DirectoryConfig<PartTypeDTO, CreatePartTypeDTO, UpdatePartTypeDTO> = {
  title: partTypesBaseConfig.displayName,
  description: partTypesBaseConfig.description,
  icon: Settings,
  fields: partTypesBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: usePartTypes,
    useCreate: useCreatePartType,
    useUpdate: useUpdatePartType,
    useDelete: useDeletePartType,
  },
  searchFields: ["name", "description"] as (keyof PartTypeDTO)[],
  tableColumns: [
    { key: "name", label: "Название" },
    { key: "code", label: "Код" },
    { key: "description", label: "Описание" },
    { key: "weight", label: "Средний вес (списание)" },
  ],
  createInitialData: () => ({ name: "", code: 0, description: "", weight: 0 }),
  mapToFormData: (item: PartTypeDTO) => ({
    name: item.name,
    code: item.code,
    description: item.description,
    weight: item.weight ?? 0,
  }),
};
