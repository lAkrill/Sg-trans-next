"use client";

import { Wrench } from "lucide-react";
import {
  useFitmentTypes,
  useCreateFitmentType,
  useUpdateFitmentType,
  useDeleteFitmentType,
} from "@/hooks";
import type {
  FitmentTypeDTO,
  CreateFitmentTypeDTO,
  UpdateFitmentTypeDTO,
} from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

export const fitmentTypesBaseConfig: BaseDirectoryConfig = {
  name: "fitmentTypes",
  endpoint: "FitmentTypes",
  displayName: "Типы арматуры",
  description: "Справочник типов арматуры",
  fields: [
    {
      key: "name",
      label: "Название",
      type: "text",
      required: true,
      placeholder: "Введите название типа арматуры",
    },
    {
      key: "code",
      label: "Код",
      type: "number",
      required: true,
      placeholder: "Введите код",
      validation: { min: 0 },
    },
  ],
};

export const fitmentTypesConfig: DirectoryConfig<FitmentTypeDTO, CreateFitmentTypeDTO, UpdateFitmentTypeDTO> = {
  title: fitmentTypesBaseConfig.displayName,
  description: fitmentTypesBaseConfig.description,
  icon: Wrench,
  fields: fitmentTypesBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: useFitmentTypes,
    useCreate: useCreateFitmentType,
    useUpdate: useUpdateFitmentType,
    useDelete: useDeleteFitmentType,
  },
  searchFields: ["name", "code"] as (keyof FitmentTypeDTO)[],
  tableColumns: [
    { key: "name", label: "Название" },
    { key: "code", label: "Код" },
  ],
  createInitialData: () => ({ name: "", code: 0 }),
  mapToFormData: (item: FitmentTypeDTO) => ({
    name: item.name,
    code: item.code,
  }),
};
