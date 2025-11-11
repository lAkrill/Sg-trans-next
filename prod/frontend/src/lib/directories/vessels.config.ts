"use client";

import { Droplet } from "lucide-react";
import {
  useVessels,
  useCreateVessel,
  useUpdateVessel,
  useDeleteVessel,
} from "@/hooks";
import type {
  VesselDTO,
  VesselListWithCisternNumberDTO,
  CreateVesselDTO,
  UpdateVesselDto,
} from "@/types/vessels";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

// Базовая конфигурация полей
export const vesselsBaseConfig: BaseDirectoryConfig = {
  name: "vessels",
  endpoint: "vessels",
  displayName: "Сосуды (вагоны)",
  description: "Справочник сосудов и вагонов",
  fields: [
    {
      key: "serialNumber",
      label: "Серийный номер",
      type: "text",
      required: true,
      placeholder: "Введите серийный номер",
    },
    {
      key: "buildDate",
      label: "Дата постройки",
      type: "text",
      required: true,
      placeholder: "YYYY-MM-DD",
    },
    {
      key: "manufacturer",
      label: "Производитель",
      type: "text",
      required: true,
      placeholder: "Введите производителя",
    },
    {
      key: "wagonModelId",
      label: "Модель вагона",
      type: "text",
      required: true,
      placeholder: "Введите ID модели вагона",
    },
    {
      key: "pressure",
      label: "Давление (атм)",
      type: "number",
      required: true,
      placeholder: "Введите давление",
    },
    {
      key: "capacity",
      label: "Объём (л)",
      type: "number",
      required: true,
      placeholder: "Введите объём",
    },
    {
      key: "railwayCisternId",
      label: "Железнодорожная цистерна",
      type: "select",
      required: true,
    },
  ],
};

// Конфигурация для DirectoryManager
export const vesselsConfig: DirectoryConfig<
  VesselListWithCisternNumberDTO,
  CreateVesselDTO,
  UpdateVesselDto
> = {
  title: vesselsBaseConfig.displayName,
  description: vesselsBaseConfig.description,
  icon: Droplet,
  fields: vesselsBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type:
      field.type === "boolean" ||
      field.type === "select" ||
      field.type === "textarea"
        ? "text"
        : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: useVessels,
    useCreate: useCreateVessel,
    useUpdate: useUpdateVessel,
    useDelete: useDeleteVessel,
  },
  searchFields: ["serialNumber", "manufacturer"] as (keyof VesselListWithCisternNumberDTO)[],
  tableColumns: [
    { key: "serialNumber", label: "Серийный номер" },
    { key: "buildDate", label: "Дата постройки" },
    { key: "manufacturer", label: "Производитель" },
    { key: "pressure", label: "Давление" },
    { key: "capacity", label: "Объём" },
  ],
  createInitialData: () => ({
    serialNumber: "",
    buildDate: "",
    manufacturer: "",
    wagonModelId: "",
    pressure: 0,
    capacity: 0,
    railwayCisternId: "",
  }),
  mapToFormData: (item: VesselListWithCisternNumberDTO) => ({
    serialNumber: item.serialNumber,
    buildDate: item.buildDate,
    manufacturer: item.manufacturer,
    wagonModelId: item.wagonModelId,
    pressure: item.pressure,
    capacity: item.capacity,
    railwayCisternId: item.railwayCisternIdAndNumberDto?.id || "",
  }),
};
