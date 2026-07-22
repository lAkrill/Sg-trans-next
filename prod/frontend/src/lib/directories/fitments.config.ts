"use client";

import { Wrench } from "lucide-react";
import {
  useFitments,
  useCreateFitment,
  useUpdateFitment,
  useDeleteFitment,
} from "@/hooks";
import type {
  FitmentDTO,
  CreateFitmentDTO,
  UpdateFitmentDTO,
} from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";
import { FitmentTypeSelect } from "@/components/fitment-type-select";
import { FitmentModelSelect } from "@/components/fitment-model-select";

export const fitmentsBaseConfig: BaseDirectoryConfig = {
  name: "fitments",
  endpoint: "Fitments",
  displayName: "Арматура",
  description: "Справочник арматуры для железнодорожных цистерн",
  fields: [
    {
      key: "fitmentTypeId",
      label: "Тип арматуры",
      type: "custom",
      required: true,
      customComponent: FitmentTypeSelect,
    },
    {
      key: "serialNumber",
      label: "Серийный номер",
      type: "text",
      required: true,
      placeholder: "Введите серийный номер",
    },
    {
      key: "passportNumber",
      label: "Номер паспорта",
      type: "text",
      required: false,
      placeholder: "Введите номер паспорта",
    },
    {
      key: "buildDate",
      label: "Дата изготовления",
      type: "text",
      required: true,
      placeholder: "Введите дату изготовления",
    },
    {
      key: "lastRepairDate",
      label: "Дата последнего ремонта",
      type: "text",
      required: false,
      placeholder: "Введите дату последнего ремонта",
    },
    {
      key: "periodRep",
      label: "Период ремонта",
      type: "number",
      required: true,
      placeholder: "Введите период ремонта",
      validation: { min: 0 },
    },
    {
      key: "serviceLifeYears",
      label: "Срок службы (лет)",
      type: "number",
      required: true,
      placeholder: "Введите срок службы",
      validation: { min: 0 },
    },
    {
      key: "modelId",
      label: "Модель арматуры",
      type: "custom",
      required: true,
      customComponent: FitmentModelSelect,
    },
    {
      key: "depotId",
      label: "Производитель (депо)",
      type: "text",
      required: false,
      placeholder: "ID депо-производителя",
    },
    {
      key: "code",
      label: "Местоположение (код)",
      type: "number",
      required: false,
      placeholder: "0 — не установлена, 1 — вагон, 2 — депо",
      validation: { min: 0 },
    },
    {
      key: "locationDepoId",
      label: "Депо (местоположение)",
      type: "text",
      required: false,
      placeholder: "ID депо",
    },
    {
      key: "locationCisternId",
      label: "Вагон (местоположение)",
      type: "text",
      required: false,
      placeholder: "ID вагона-цистерны",
    },
  ],
};

export const fitmentsConfig: DirectoryConfig<FitmentDTO, CreateFitmentDTO, UpdateFitmentDTO> = {
  title: fitmentsBaseConfig.displayName,
  description: fitmentsBaseConfig.description,
  icon: Wrench,
  fields: fitmentsBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type:
      field.type === "custom"
        ? "custom"
        : field.type === "boolean" || field.type === "select" || field.type === "textarea"
        ? "text"
        : field.type,
    required: field.required,
    placeholder: field.placeholder,
    customComponent: field.customComponent,
  })),
  hooks: {
    useGetAll: useFitments,
    useCreate: useCreateFitment,
    useUpdate: useUpdateFitment,
    useDelete: useDeleteFitment,
  },
  searchFields: ["serialNumber", "passportNumber"] as (keyof FitmentDTO)[],
  tableColumns: [
    { key: "serialNumber", label: "Серийный номер" },
    { key: "passportNumber", label: "Номер паспорта" },
    { key: "buildDate", label: "Дата изготовления" },
    { key: "lastRepairDate", label: "Дата ремонта" },
    { key: "periodRep", label: "Период ремонта" },
    { key: "serviceLifeYears", label: "Срок службы" },
    {
      key: "fitmentTypeId",
      label: "Тип арматуры",
      render: (_, item) => item.fitmentType?.name ?? "-",
    },
    {
      key: "modelId",
      label: "Модель арматуры",
      render: (_, item) => item.model?.name ?? "-",
    },
    {
      key: "depotId",
      label: "Производитель",
      render: (_, item) => item.depot?.shortName ?? "-",
    },
  ],
  createInitialData: () => ({
    fitmentTypeId: "",
    serialNumber: "",
    passportNumber: "",
    buildDate: "",
    lastRepairDate: "",
    periodRep: 0,
    serviceLifeYears: 0,
    modelId: "",
    depotId: null,
    code: 0,
    locationDepoId: null,
    locationCisternId: null,
  }),
  mapToFormData: (item: FitmentDTO) => ({
    fitmentTypeId: item.fitmentTypeId,
    serialNumber: item.serialNumber,
    passportNumber: item.passportNumber,
    buildDate: item.buildDate,
    lastRepairDate: item.lastRepairDate ?? "",
    periodRep: item.periodRep,
    serviceLifeYears: item.serviceLifeYears,
    modelId: item.modelId,
    depotId: item.depot?.id ?? null,
    code: 0,
    locationDepoId: null,
    locationCisternId: null,
  }),
};
