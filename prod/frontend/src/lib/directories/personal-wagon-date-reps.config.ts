"use client";

import { Train } from "lucide-react";
import {
  usePersonalWagonDateReps,
  useCreatePersonalWagonDateRep,
  useUpdatePersonalWagonDateRep,
  useDeletePersonalWagonDateRep,
} from "@/hooks";
import type {
  PersonalWagonDateRepDTO,
  CreatePersonalWagonDateRepDTO,
  UpdatePersonalWagonDateRepDTO,
} from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

export const personalWagonDateRepsBaseConfig: BaseDirectoryConfig = {
  name: "personalWagonDateReps",
  endpoint: "personal-cis-repair-periods",
  displayName: "Персональные периоды ремонта вагона",
  description: "Справочник персональных периодов ремонта вагона",
  fields: [
    {
      key: "number",
      label: "Номер вагона",
      type: "text",
      required: true,
      placeholder: "Введите номер вагона",
    },
    {
      key: "majorRep",
      label: "Капитальный ремонт",
      type: "number",
      required: true,
      placeholder: "Введите период",
    },
    {
      key: "depoRep",
      label: "Деповской ремонт",
      type: "number",
      required: true,
      placeholder: "Введите период",
    },
    {
      key: "intermediateTest",
      label: "Промежуточное испытание",
      type: "number",
      required: true,
      placeholder: "Введите период",
    },
    {
      key: "periodicTest",
      label: "Периодическое испытание",
      type: "number",
      required: true,
      placeholder: "Введите период",
    },
    {
      key: "pprRep",
      label: "ППР ремонт",
      type: "number",
      required: true,
      placeholder: "Введите период",
    },
  ],
};

export const personalWagonDateRepsConfig: DirectoryConfig<
  PersonalWagonDateRepDTO,
  CreatePersonalWagonDateRepDTO,
  UpdatePersonalWagonDateRepDTO
> = {
  title: personalWagonDateRepsBaseConfig.displayName,
  description: personalWagonDateRepsBaseConfig.description,
  icon: Train,
  fields: personalWagonDateRepsBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type === "boolean" || field.type === "select" || field.type === "textarea" ? "text" : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: usePersonalWagonDateReps,
    useCreate: useCreatePersonalWagonDateRep,
    useUpdate: useUpdatePersonalWagonDateRep,
    useDelete: useDeletePersonalWagonDateRep,
  },
  searchFields: ["cisternNum"] as (keyof PersonalWagonDateRepDTO)[],
  tableColumns: [
    { key: "cisternNum", label: "Номер вагона" },
    { key: "majorRep", label: "Капитальный ремонт" },
    { key: "depoRep", label: "Деповской ремонт" },
    { key: "intermediateTest", label: "Промежуточное испытание" },
    { key: "periodicTest", label: "Периодическое испытание" },
    { key: "pprRep", label: "ППР ремонт" },

  ],
  createInitialData: () => ({
    cisternNum: "",
    majorRep: 0,
    depoRep: 0,
    intermediateTest: 0,
    periodicTest: 0,
    pprRep: 0,
  }),
  mapToFormData: (item: PersonalWagonDateRepDTO) => ({
    cisternNum: item.cisternNum,
    majorRep: item.majorRep,
    depoRep: item.depoRep,
    intermediateTest: item.intermediateTest,
    periodicTest: item.periodicTest,
    pprRep: item.pprRep,
  }),
};
