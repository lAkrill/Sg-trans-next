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
import { PersonalWagonCisternSelect } from "@/components/cistern-select";

export const personalWagonDateRepsBaseConfig: BaseDirectoryConfig = {
  name: "personalWagonDateReps",
  endpoint: "personal-cis-repair-periods",
  displayName: "Персональные периоды ремонта вагона",
  description: "Справочник персональных периодов ремонта вагона",
  fields: [
    {
      key: "cisternId",
      label: "Номер вагона",
      type: "custom",
      required: true,
      customComponent: PersonalWagonCisternSelect,
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
    cisternId: "",
    majorRep: 0,
    depoRep: 0,
    intermediateTest: 0,
    periodicTest: 0,
    pprRep: 0,
  }),
  mapToFormData: (item: PersonalWagonDateRepDTO) => ({
    cisternNum: item.cisternNum,
    cisternId: item.cisternId,
    majorRep: item.majorRep,
    depoRep: item.depoRep,
    intermediateTest: item.intermediateTest,
    periodicTest: item.periodicTest,
    pprRep: item.pprRep,
  }),
};
