"use client";

import { Users } from "lucide-react";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks";
import type {
  EmployeeDTO,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
} from "@/types/directories";
import type { DirectoryConfig } from "@/components/directory-manager";
import { DirectoryConfig as BaseDirectoryConfig } from "./types";

export const employeesBaseConfig: BaseDirectoryConfig = {
  name: "employees",
  endpoint: "employees",
  displayName: "Сотрудники",
  description: "Справочник сотрудников",
  fields: [
    {
      key: "lastName",
      label: "Фамилия",
      type: "text",
      required: true,
      placeholder: "Введите фамилию",
    },
    {
      key: "firstName",
      label: "Имя",
      type: "text",
      required: true,
      placeholder: "Введите имя",
    },
    {
      key: "patronymic",
      label: "Отчество",
      type: "text",
      required: true,
      placeholder: "Введите отчество",
    },
    {
      key: "initials",
      label: "Инициалы",
      type: "text",
      required: true,
      placeholder: "Введите инициалы",
    },
    {
      key: "position",
      label: "Должность",
      type: "text",
      required: true,
      placeholder: "Введите должность",
    },
  ],
};

export const employeesConfig: DirectoryConfig<
  EmployeeDTO,
  CreateEmployeeDTO,
  UpdateEmployeeDTO
> = {
  title: employeesBaseConfig.displayName,
  description: employeesBaseConfig.description,
  icon: Users,
  fields: employeesBaseConfig.fields.map((field) => ({
    key: field.key,
    label: field.label,
    type:
      field.type === "boolean" || field.type === "select" || field.type === "textarea"
        ? "text"
        : field.type,
    required: field.required,
    placeholder: field.placeholder,
  })),
  hooks: {
    useGetAll: useEmployees,
    useCreate: useCreateEmployee,
    useUpdate: useUpdateEmployee,
    useDelete: useDeleteEmployee,
  },
  searchFields: [
    "lastName",
    "firstName",
    "patronymic",
    "initials",
    "position",
  ] as (keyof EmployeeDTO)[],
  tableColumns: [
    { key: "lastName", label: "Фамилия" },
    { key: "firstName", label: "Имя" },
    { key: "patronymic", label: "Отчество" },
    { key: "initials", label: "Инициалы" },
    { key: "position", label: "Должность" },
  ],
  createInitialData: () => ({
    lastName: "",
    firstName: "",
    patronymic: "",
    initials: "",
    position: "",
  }),
  mapToFormData: (item: EmployeeDTO) => ({
    lastName: item.lastName,
    firstName: item.firstName,
    patronymic: item.patronymic,
    initials: item.initials,
    position: item.position,
  }),
};
