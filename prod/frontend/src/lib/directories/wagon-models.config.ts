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
  searchFields: ["name", "firstName", "lastName"] as (keyof WagonModelDTO)[],
  tableColumns: [
    { key: "name", label: "Название модели" },
    { key: "majorRep", label: "Капитальный ремонт" },
    { key: "depoRep", label: "Деповской ремонт" },
    { key: "intermediateTest", label: "Промежуточное испытание" },
    { key: "periodicTest", label: "Периодическое испытание" },
    { key: "pprRep", label: "ППР ремонт" },
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
  }),
  mapToFormData: (item: WagonModelDTO) => ({
    name: item.name,
    majorRep: item.majorRep,
    depoRep: item.depoRep,
    intermediateTest: item.intermediateTest,
    periodicTest: item.periodicTest,
    pprRep: item.pprRep,
  }),
};
