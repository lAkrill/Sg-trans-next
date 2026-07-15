"use client";

import { Train } from "lucide-react";
import {
  useFitmentModels,
  useCreateFitmentModel,
  useUpdateFitmentModel,
  useDeleteFitmentModel,
} from "@/hooks";
import type {
  FitmentModelDTO,
  CreateFitmentModelDTO,
  UpdateFitmentModelDTO,
} from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

export const fitmentModelsBaseConfig: BaseDirectoryConfig = {
  name: "fitmentModels",
  endpoint: "FitmentModels",
  displayName: "Модели арматуры",
  description: "Справочник моделей арматуры",
  fields: [
    {
      key: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "Введите название модели арматуры",
    },
  ],
};

export const fitmentModelsConfig: DirectoryConfig<FitmentModelDTO, CreateFitmentModelDTO, UpdateFitmentModelDTO> = {
  title: fitmentModelsBaseConfig.displayName,
  description: fitmentModelsBaseConfig.description,
  icon: Train,
  fields: fitmentModelsBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: useFitmentModels,
    useCreate: useCreateFitmentModel,
    useUpdate: useUpdateFitmentModel,
    useDelete: useDeleteFitmentModel,
  },
  searchFields: ["name"] as (keyof FitmentModelDTO)[],
  tableColumns: [
    { key: "name", label: "Название" },
  ],
  createInitialData: () => ({ name: "" }),
  mapToFormData: (item: FitmentModelDTO) => ({
    name: item.name,
  }),
};
