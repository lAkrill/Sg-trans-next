"use client";

import { Train } from "lucide-react";
import {
  useWagonModels,
  useCreateWagonModel,
  useUpdateWagonModel,
  useDeleteWagonModel,
} from "@/hooks";
import type { WagonModelDTO, CreateWagonModelDTO, UpdateWagonModelDTO } from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

// Базовая конфигурация полей
export const wagonModelsBaseConfig: BaseDirectoryConfig = {
  name: 'wagonModels',
  displayName: 'Модели вагонов',
  description: 'Справочник моделей вагонов',
  endpoint: '/api/wagon-models',
  fields: [
    {
      key: 'name',
      label: 'Название модели',
      type: 'text',
      required: true,
      placeholder: 'Введите название модели',
    },
  ],
};

// Конфигурация для DirectoryManager
export const wagonModelsConfig: DirectoryConfig<WagonModelDTO, CreateWagonModelDTO, UpdateWagonModelDTO> = {
  title: wagonModelsBaseConfig.displayName,
  description: wagonModelsBaseConfig.description,
  icon: Train,
  fields: wagonModelsBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: useWagonModels,
    useCreate: useCreateWagonModel,
    useUpdate: useUpdateWagonModel,
    useDelete: useDeleteWagonModel,
  },
  searchFields: ["name"] as (keyof WagonModelDTO)[],
  tableColumns: [
    { key: "name", label: "Название модели" },
  ],
  createInitialData: () => ({ name: ""}),
  mapToFormData: (item: WagonModelDTO) => ({
    name: item.name,
  }),
};
