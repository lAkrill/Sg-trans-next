"use client";

import { createElement } from "react";
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
import { ViewFileButton } from "@/components/view-file-button";

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
    {
      key: 'majorRep',
      label: 'Капитальный ремонт',
      type: 'number',
      required: true,
      placeholder: 'Введите период',
    },
    {
      key: 'depoRep',
      label: 'Деповской ремонт',
      type: 'number',
      required: true,
      placeholder: 'Введите период',
    },
    {
      key: 'intermediateTest',
      label: 'Промежуточное испытание',
      type: 'number',
      required: true,
      placeholder: 'Введите период',
    },
    {
      key: 'periodicTest',
      label: 'Периодическое испытание',
      type: 'number',
      required: true,
      placeholder: 'Введите период',
    },
    {
      key: 'pprRep',
      label: 'ППР ремонт',
      type: 'number',
      required: true,
      placeholder: 'Введите период',
    },
  ],
};

const WAGON_MODEL_FILE_DIRECTORY = "WagonModels";
const WAGON_MODEL_IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
const WAGON_MODEL_DOC_ACCEPT = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf";

const wagonModelFileFields = [
  {
    key: "fileImage",
    label: "Изображение",
    type: "file" as const,
    accept: WAGON_MODEL_IMAGE_ACCEPT,
    fileDirectory: WAGON_MODEL_FILE_DIRECTORY,
    fileHint: "PNG, JPG, JPEG, WEBP до 10 МБ",
  },
  {
    key: "fileRE",
    label: "Руководство",
    type: "file" as const,
    accept: WAGON_MODEL_DOC_ACCEPT,
    fileDirectory: WAGON_MODEL_FILE_DIRECTORY,
    fileHint: "PNG, JPG, JPEG, PDF до 10 МБ",
  },
  {
    key: "fileTU",
    label: "Технические условия",
    type: "file" as const,
    accept: WAGON_MODEL_DOC_ACCEPT,
    fileDirectory: WAGON_MODEL_FILE_DIRECTORY,
    fileHint: "PNG, JPG, JPEG, PDF до 10 МБ",
  },
];

const renderViewFileButton = (value: unknown) =>
  createElement(ViewFileButton, { value, directory: WAGON_MODEL_FILE_DIRECTORY });

// Конфигурация для DirectoryManager
export const wagonModelsConfig: DirectoryConfig<WagonModelDTO, CreateWagonModelDTO, UpdateWagonModelDTO> = {
  title: wagonModelsBaseConfig.displayName,
  description: wagonModelsBaseConfig.description,
  icon: Train,
  fields: [
    ...wagonModelsBaseConfig.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: (field.type === "boolean" || field.type === "select" || field.type === "textarea"
        ? "text"
        : field.type) as "text" | "number",
      required: field.required,
      placeholder: field.placeholder,
    })),
    ...wagonModelFileFields,
  ],
  hooks: {
    useGetAll: useWagonModels,
    useCreate: useCreateWagonModel,
    useUpdate: useUpdateWagonModel,
    useDelete: useDeleteWagonModel,
  },
  searchFields: ["name", "firstName", "lastName"] as (keyof WagonModelDTO)[],
  tableColumns: [
    { key: "name", label: "Название модели" },
    { key: "majorRep", label: "Капитальный ремонт" },
    { key: "depoRep", label: "Деповской ремонт" },
    { key: "intermediateTest", label: "Промежуточное испытание" },
    { key: "periodicTest", label: "Периодическое испытание" },
    { key: "pprRep", label: "ППР ремонт" },
    {
      key: "fileImage",
      label: "Изображение",
      render: renderViewFileButton,
    },
    {
      key: "fileRE",
      label: "Руководство",
      render: renderViewFileButton,
    },
    {
      key: "fileTU",
      label: "Технические условия",
      render: renderViewFileButton,
    },
    {
      key: "firstName",
      label: "Фамилия, имя",
      render: (_value, item) => `${item.lastName ?? ""} ${item.firstName ?? ""}`.trim() || "—",
    },
  ],
  createInitialData: () => ({
    name: "",
    majorRep: 0,
    depoRep: 0,
    intermediateTest: 0,
    periodicTest: 0,
    pprRep: 0,
    fileImage: null,
    fileRE: null,
    fileTU: null,
  }),
  mapToFormData: (item: WagonModelDTO) => ({
    name: item.name,
    majorRep: item.majorRep,
    depoRep: item.depoRep,
    intermediateTest: item.intermediateTest,
    periodicTest: item.periodicTest,
    pprRep: item.pprRep,
    fileImage: item.fileImage ?? null,
    fileRE: item.fileRE ?? null,
    fileTU: item.fileTU ?? null,
  }),
};
