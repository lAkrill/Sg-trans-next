import { z } from "zod";

export const createFitmentSchema = z.object({
  fitmentTypeId: z.string().min(1, "Выберите тип арматуры"),
  serialNumber: z.string().trim().min(1, "Введите заводской номер"),
  passportNumber: z.string().trim().min(1, "Введите номер паспорта"),
  buildDate: z.string().min(1, "Укажите дату постройки"),
  lastRepairDate: z.string().optional(),
  periodRep: z.number().int("Период ремонта должен быть целым числом").min(0, "Период ремонта не может быть отрицательным"),
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным"),
  modelId: z.string().min(1, "Выберите модель"),
  depotId: z.string().optional(),
  code: z.number().int("Код должен быть целым числом").min(0, "Код не может быть отрицательным").optional(),
  locationDepoId: z.string().optional(),
  locationCisternId: z.string().optional(),
});

export type CreateFitmentFormData = z.infer<typeof createFitmentSchema>;
