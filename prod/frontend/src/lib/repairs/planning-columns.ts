export const PLANNING_COLUMN_OPTIONS = [
  { value: "number", label: "Вагон" },
  { value: "registrationNumber", label: "Рег. №" },
  { value: "serviceLifeYears", label: "Срок эксплуатации" },
  { value: "buildDate", label: "Дата постройки" },
  { value: "wagonModelName", label: "Модель" },
  { value: "majorRepair", label: "Капитальный ремонт" },
  { value: "depotRepair", label: "Деповской ремонт" },
  { value: "periodicTest", label: "ГИ (периодическое испытание)" },
  { value: "intermediateTest", label: "ИГ (промежуточное испытание)" },
  { value: "pprRepair", label: "Профремонт (ППР)" },
  { value: "milage", label: "Пробег" },
  { value: "periodPaintRepair", label: "Покраска" },
  { value: "commissioningEndDate", label: "Дата окончания эксплуатации" },
  { value: "uncouplingRepair", label: "Текущий отцепочный ремонт" },
] as const;

export type PlanningColumnKey = (typeof PLANNING_COLUMN_OPTIONS)[number]["value"];

export const DEFAULT_PLANNING_VISIBLE_COLUMNS: PlanningColumnKey[] = PLANNING_COLUMN_OPTIONS.map(
  (o) => o.value
);

const PAIRED_COLUMN_KEYS: PlanningColumnKey[] = [
  "majorRepair",
  "depotRepair",
  "periodicTest",
  "intermediateTest",
  "pprRepair",
];

export function isPlanningColumnVisible(
  visibleColumns: string[],
  key: PlanningColumnKey
): boolean {
  return visibleColumns.includes(key);
}

export function countPlanningVisibleLeafColumns(visibleColumns: string[]): number {
  let count = 0;
  for (const option of PLANNING_COLUMN_OPTIONS) {
    if (!visibleColumns.includes(option.value)) continue;
    count += PAIRED_COLUMN_KEYS.includes(option.value) ? 2 : 1;
  }
  return count;
}

/** Ключи полей экспорта, соответствующие видимым столбцам таблицы */
const EXPORT_KEYS_BY_VISIBLE: Record<PlanningColumnKey, string[]> = {
  number: ["number"],
  registrationNumber: ["registrationNumber"],
  serviceLifeYears: ["serviceLifeYears"],
  buildDate: ["buildDate"],
  wagonModelName: ["model"],
  majorRepair: ["periodMajorRepair", "planPeriodMajorRepair"],
  depotRepair: ["periodDepotRepair", "planPeriodDepotRepair"],
  periodicTest: ["periodPeriodicTest", "planPeriodPeriodicTest"],
  intermediateTest: ["periodIntermediateTest", "planPeriodIntermediateTest"],
  pprRepair: ["periodPPRRepair", "planPeriodPPRRepair"],
  milage: ["mileage"],
  periodPaintRepair: ["paintingLast"],
  commissioningEndDate: ["serviceEndDate"],
  uncouplingRepair: ["currentUncouplingLast"],
};

export function getPlanningExportColumnKeys(visibleColumns: string[]): Set<string> {
  const keys = new Set<string>();
  for (const option of PLANNING_COLUMN_OPTIONS) {
    if (!visibleColumns.includes(option.value)) continue;
    for (const exportKey of EXPORT_KEYS_BY_VISIBLE[option.value]) {
      keys.add(exportKey);
    }
  }
  return keys;
}
