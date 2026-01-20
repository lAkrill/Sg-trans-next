import { z } from "zod";

// Base schema for all parts
export const basePartSchema = z.object({
  partTypeId: z.string().min(1, "Выберите тип детали"),
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем").optional(),
  notes: z.string().optional(),
});

// Wheel Pair schema (code: 1)
export const wheelPairSchema = basePartSchema.extend({
  thicknessLeft: z.number().positive("Толщина должна быть положительной").optional(),
  thicknessRight: z.number().positive("Толщина должна быть положительной").optional(),
  wheelType: z.string().optional(),
});

// Side Frame schema (code: 3)
export const sideFrameSchema = basePartSchema.extend({
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным").optional(),
  extendedUntil: z.string().optional(),
});

// Bolster schema (code: 2)
export const bolsterSchema = basePartSchema.extend({
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным").optional(),
  extendedUntil: z.string().optional(),
});

// Coupler schema (code: 4)
export const couplerSchema = basePartSchema;

// Shock Absorber schema (code: 10)
export const shockAbsorberSchema = basePartSchema.extend({
  model: z.string().optional(),
  manufacturerCode: z.string().optional(),
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным").optional(),
  nextRepairDate: z.string().optional(),
});

// Update schema for parts (without partTypeId since it can't be changed)
export const basePartUpdateSchema = z.object({
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  currentLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.union([
    z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем"),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  ]).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Either depot OR currentLocation, but not both
    const hasDepot = !!data.depotId;
    const hasLocation = !!data.currentLocation;
    return !hasDepot || !hasLocation; // True if NOT both
  },
  {
    message: "Выберите либо депо, либо текущее местоположение, но не оба одновременно",
    path: ["depotId"],
  }
);

export const wheelPairUpdateSchema = z.object({
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  currentLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.union([
    z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем"),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  ]).optional(),
  notes: z.string().optional(),
  thicknessLeft: z.number().positive("Толщина должна быть положительной").optional(),
  thicknessRight: z.number().positive("Толщина должна быть положительной").optional(),
  wheelType: z.string().optional(),
}).refine(
  (data) => {
    const hasDepot = !!data.depotId;
    const hasLocation = !!data.currentLocation;
    return !hasDepot || !hasLocation;
  },
  {
    message: "Выберите либо депо, либо текущее местоположение, но не оба одновременно",
    path: ["depotId"],
  }
);
export const sideFrameUpdateSchema = z.object({
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  currentLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.union([
    z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем"),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  ]).optional(),
  notes: z.string().optional(),
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным").optional(),
  extendedUntil: z.string().optional(),
}).refine(
  (data) => {
    const hasDepot = !!data.depotId;
    const hasLocation = !!data.currentLocation;
    return !hasDepot || !hasLocation;
  },
  {
    message: "Выберите либо депо, либо текущее местоположение, но не оба одновременно",
    path: ["depotId"],
  }
);
export const bolsterUpdateSchema = z.object({
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  currentLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.union([
    z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем"),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  ]).optional(),
  notes: z.string().optional(),
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным").optional(),
  extendedUntil: z.string().optional(),
}).refine(
  (data) => {
    const hasDepot = !!data.depotId;
    const hasLocation = !!data.currentLocation;
    return !hasDepot || !hasLocation;
  },
  {
    message: "Выберите либо депо, либо текущее местоположение, но не оба одновременно",
    path: ["depotId"],
  }
);
export const couplerUpdateSchema = z.object({
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  currentLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.union([
    z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем"),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  ]).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const hasDepot = !!data.depotId;
    const hasLocation = !!data.currentLocation;
    return !hasDepot || !hasLocation;
  },
  {
    message: "Выберите либо депо, либо текущее местоположение, но не оба одновременно",
    path: ["depotId"],
  }
);
export const shockAbsorberUpdateSchema = z.object({
  stampNumberId: z.string().min(1, "Выберите клеймо"),
  statusId: z.string().min(1, "Выберите статус"),
  depotId: z.string().optional(),
  currentLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  manufactureYear: z.union([
    z.number().int().min(1900, "Год должен быть не ранее 1900").max(new Date().getFullYear(), "Год не может быть в будущем"),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате YYYY-MM-DD"),
  ]).optional(),
  notes: z.string().optional(),
  model: z.string().optional(),
  manufacturerCode: z.string().optional(),
  serviceLifeYears: z.number().int().positive("Срок службы должен быть положительным").optional(),
  nextRepairDate: z.string().optional(),
}).refine(
  (data) => {
    const hasDepot = !!data.depotId;
    const hasLocation = !!data.currentLocation;
    return !hasDepot || !hasLocation;
  },
  {
    message: "Выберите либо депо, либо текущее местоположение, но не оба одновременно",
    path: ["depotId"],
  }
);

// Type inference
export type WheelPairFormData = z.infer<typeof wheelPairSchema>;
export type SideFrameFormData = z.infer<typeof sideFrameSchema>;
export type BolsterFormData = z.infer<typeof bolsterSchema>;
export type CouplerFormData = z.infer<typeof couplerSchema>;
export type ShockAbsorberFormData = z.infer<typeof shockAbsorberSchema>;

export type WheelPairUpdateFormData = z.infer<typeof wheelPairUpdateSchema>;
export type SideFrameUpdateFormData = z.infer<typeof sideFrameUpdateSchema>;
export type BolsterUpdateFormData = z.infer<typeof bolsterUpdateSchema>;
export type CouplerUpdateFormData = z.infer<typeof couplerUpdateSchema>;
export type ShockAbsorberUpdateFormData = z.infer<typeof shockAbsorberUpdateSchema>;
