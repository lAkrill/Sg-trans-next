import type { PartDTO } from "@/types/directories";

/** Колёсная пара */
const PART_TYPE_WHEEL_PAIR = 1;
/** Надрессорная балка */
const PART_TYPE_BOLSTER = 2;
/** Боковая рама */
const PART_TYPE_SIDE_FRAME = 3;
/** Автосцепка */
const PART_TYPE_COUPLER = 4;
/** Поглощающий аппарат */
const PART_TYPE_SHOCK_ABSORBER = 10;

const FRAME_OR_BOLSTER_CODES = new Set([PART_TYPE_BOLSTER, PART_TYPE_SIDE_FRAME]);

/** Срок службы поглощающего аппарата до списания (лет) */
const SHOCK_ABSORBER_WRITE_OFF_YEARS = 32;
/** Возраст, с которого поглощающий аппарат снимается на освидетельствование */
const SHOCK_ABSORBER_INSPECTION_YEARS = 15;
/** Возраст, с которого автосцепка снимается при капитальном ремонте */
const COUPLER_REMOVAL_YEARS = 30;
/** Год изготовления колёсной пары: этот год и старше — списание */
const WHEEL_PAIR_WRITE_OFF_YEAR = 1978;
/** Деповской: толщина меньше этого значения — списание/переформирование */
const WHEEL_PAIR_DEPOT_THIN_MM = 350;
/** Деповской: толщина больше этого значения — остаётся под вагоном */
const WHEEL_PAIR_DEPOT_OK_MM = 360;
/** Капитальный: толщина меньше этого значения — снимается */
const WHEEL_PAIR_MAJOR_THIN_MM = 390;
/** Капитальный: толщина больше этого значения — остаётся под вагоном */
const WHEEL_PAIR_MAJOR_OK_MM = 400;

/** Тип ближайшего ремонта, относительно которого считается потребность */
export type UpcomingRepairType = "depot" | "major";

export type UpcomingRepair = {
  repairType: UpcomingRepairType;
  repairDate: Date;
};

/**
 * Вход алгоритма потребности: деталь + контекст ближайшего ремонта вагона.
 * Дата — та, что наступит раньше (деповской или капитальный).
 */
export type PartsNeedInput = {
  part: PartDTO;
  repairType: UpcomingRepairType;
  repairDate: Date;
  /** Модель вагона (для продления рам/балок 28–33 лет) */
  wagonModelName?: string | null;
  /** Толщина обода колёсной пары (мм), обычно из комплектации */
  thicknessLeft?: number | null;
  thicknessRight?: number | null;
};

export type PartsNeedHighlight = "red" | "pink";

export type PartsNeedItem = {
  part: PartDTO;
  repairType: UpcomingRepairType;
  repairDate: Date;
  /** Возраст детали в полных годах на дату ремонта; -1 если неизвестен */
  ageYears: number;
  /**
   * red — замена / списание;
   * pink — продление / освидетельствование;
   * null — тип ещё без алгоритма / без подсветки.
   */
  highlight: PartsNeedHighlight | null;
  /**
   * Срок продления в годах (если применимо).
   * Для возраста 28–33 зависит от модели вагона (2 или 3) — пока не задан.
   */
  extensionYears: number | null;
};

type ManufactureYearValue = string | { year: number; month: number; day: number };

function parseLocalDate(value: string | undefined): Date | null {
  if (!value) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Выбирает ближайший ремонт: деповской или капитальный (что раньше).
 * При равных датах приоритет у капитального.
 */
export function resolveUpcomingRepair(input: {
  planPeriodDepotRepair?: string;
  planPeriodMajorRepair?: string;
}): UpcomingRepair | null {
  const depotDate = parseLocalDate(input.planPeriodDepotRepair);
  const majorDate = parseLocalDate(input.planPeriodMajorRepair);

  if (!depotDate && !majorDate) return null;
  if (!depotDate) return { repairType: "major", repairDate: startOfLocalDay(majorDate!) };
  if (!majorDate) return { repairType: "depot", repairDate: startOfLocalDay(depotDate) };

  const depotDay = startOfLocalDay(depotDate).getTime();
  const majorDay = startOfLocalDay(majorDate).getTime();

  if (majorDay <= depotDay) {
    return { repairType: "major", repairDate: startOfLocalDay(majorDate) };
  }
  return { repairType: "depot", repairDate: startOfLocalDay(depotDate) };
}

function getManufactureDate(yearData?: ManufactureYearValue): Date | null {
  if (!yearData) return null;

  if (typeof yearData === "string") {
    const parsed = new Date(yearData);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const yearMatch = yearData.match(/^(\d{4})/);
    if (!yearMatch) return null;
    return new Date(Number(yearMatch[1]), 0, 1);
  }

  return new Date(yearData.year, (yearData.month || 1) - 1, yearData.day || 1);
}

/** Календарный год изготовления детали. */
export function getManufactureYear(
  yearData?: ManufactureYearValue
): number | null {
  const date = getManufactureDate(yearData);
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.getFullYear();
}

/**
 * Рабочая толщина колёсной пары — минимум из левой и правой
 * (ограничивает более тонкий обод).
 */
export function getWheelPairThicknessMm(input: {
  thicknessLeft?: number | null;
  thicknessRight?: number | null;
  part?: PartDTO;
}): number | null {
  const fromPart = input.part as PartDTO & {
    thicknessLeft?: number | null;
    thicknessRight?: number | null;
  };

  const left = input.thicknessLeft ?? fromPart.thicknessLeft;
  const right = input.thicknessRight ?? fromPart.thicknessRight;

  const values = [left, right].filter(
    (v): v is number => typeof v === "number" && !Number.isNaN(v) && v > 0
  );
  if (!values.length) return null;
  return Math.min(...values);
}

/** Полные годы от даты изготовления до asOf (по календарной годовщине). */
export function getPartAgeYears(
  manufactureYear: ManufactureYearValue | undefined,
  asOf: Date = new Date()
): number | null {
  const manufactured = getManufactureDate(manufactureYear);
  if (!manufactured || Number.isNaN(manufactured.getTime())) return null;

  let age = asOf.getFullYear() - manufactured.getFullYear();
  const monthDiff = asOf.getMonth() - manufactured.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && asOf.getDate() < manufactured.getDate())
  ) {
    age -= 1;
  }

  return age < 0 ? 0 : age;
}

function getPartTypeCode(part: PartDTO): number | undefined {
  return part.partType?.code;
}

function isFrameOrBolster(part: PartDTO): boolean {
  const code = getPartTypeCode(part);
  return code != null && FRAME_OR_BOLSTER_CODES.has(code);
}

function toItem(
  input: PartsNeedInput,
  ageYears: number,
  highlight: PartsNeedHighlight | null,
  extensionYears: number | null = null
): PartsNeedItem {
  return {
    part: input.part,
    repairType: input.repairType,
    repairDate: input.repairDate,
    ageYears,
    highlight,
    extensionYears,
  };
}

/**
 * Потребность в боковой раме / надрессорной балке при деповском/капитальном ремонте.
 *
 * - age > 35  → в списке, красный (замена)
 * - age === 35 → в списке, розовый (продление на 2 года)
 * - age === 34 → в списке, розовый (продление на 3 года)
 * - 28 ≤ age ≤ 33 → в списке, розовый (продление на 2–3 года по модели вагона)
 * - age < 28 → не нужна (остаётся под вагоном)
 * - год изготовления неизвестен → в списке, красный (требует проверки)
 */
function evaluateFrameOrBolsterNeed(input: PartsNeedInput): PartsNeedItem | null {
  const ageYears = getPartAgeYears(input.part.manufactureYear, input.repairDate);

  if (ageYears == null) {
    return toItem(input, -1, "red");
  }

  if (ageYears > 35) {
    return toItem(input, ageYears, "red");
  }

  if (ageYears === 35) {
    return toItem(input, ageYears, "pink", 2);
  }

  if (ageYears === 34) {
    return toItem(input, ageYears, "pink", 3);
  }

  // младше 34 и старше 28 включительно → [28, 33]
  if (ageYears >= 28 && ageYears < 34) {
    return toItem(input, ageYears, "pink", null);
  }

  // младше 28 — остаётся под вагоном-цистерной
  return null;
}

/**
 * Потребность в поглощающем аппарате при деповском/капитальном ремонте.
 *
 * - age > 32  → в списке, красный (списание; срок службы до списания не менее 32 лет)
 * - age ≥ 15  → в списке, розовый (снятие на освидетельствование)
 * - age < 15  → не нужна (остаётся под вагоном)
 * - год изготовления неизвестен → в списке, красный (требует проверки)
 */
function evaluateShockAbsorberNeed(input: PartsNeedInput): PartsNeedItem | null {
  const ageYears = getPartAgeYears(input.part.manufactureYear, input.repairDate);

  if (ageYears == null) {
    return toItem(input, -1, "red");
  }

  if (ageYears > SHOCK_ABSORBER_WRITE_OFF_YEARS) {
    return toItem(input, ageYears, "red");
  }

  if (ageYears >= SHOCK_ABSORBER_INSPECTION_YEARS) {
    return toItem(input, ageYears, "pink");
  }

  // младше 15 — остаётся под вагоном-цистерной
  return null;
}

/**
 * Потребность в автосцепке при капитальном ремонте.
 * При деповском ремонте автосцепка в список потребности не попадает.
 *
 * - age ≥ 30 → в списке, красный (снимается)
 * - age < 30  → не нужна (остаётся под вагоном)
 * - год изготовления неизвестен → в списке, красный (требует проверки)
 */
function evaluateCouplerNeed(input: PartsNeedInput): PartsNeedItem | null {
  if (input.repairType !== "major") return null;

  const ageYears = getPartAgeYears(input.part.manufactureYear, input.repairDate);

  if (ageYears == null) {
    return toItem(input, -1, "red");
  }

  if (ageYears >= COUPLER_REMOVAL_YEARS) {
    return toItem(input, ageYears, "red");
  }

  // младше 30 — остаётся под вагоном-цистерной
  return null;
}

/**
 * Потребность в колёсной паре при деповском / капитальном ремонте.
 *
 * Общее:
 * - год ≤ 1978 → в списке, красный (списание)
 * - год неизвестен → в списке, красный (требует проверки)
 *
 * Деповской (младше 1978):
 * - толщина < 350 → розовый (списание/переформирование)
 * - толщина > 360 → не нужна
 * - 350–360 или толщина неизвестна → розовый (пограничный / требует проверки)
 *
 * Капитальный (младше 1978):
 * - толщина < 390 → розовый (снимается)
 * - толщина > 400 → не нужна
 * - 390–400 или толщина неизвестна → розовый (пограничный / требует проверки)
 */
function evaluateWheelPairNeed(input: PartsNeedInput): PartsNeedItem | null {
  const ageYears = getPartAgeYears(input.part.manufactureYear, input.repairDate);
  const year = getManufactureYear(input.part.manufactureYear);

  if (year == null) {
    return toItem(input, ageYears ?? -1, "red");
  }

  if (year <= WHEEL_PAIR_WRITE_OFF_YEAR) {
    return toItem(input, ageYears ?? -1, "red");
  }

  const thickness = getWheelPairThicknessMm(input);

  if (input.repairType === "depot") {
    if (thickness == null) {
      return toItem(input, ageYears ?? -1, "pink");
    }
    if (thickness > WHEEL_PAIR_DEPOT_OK_MM) return null;
    if (thickness < WHEEL_PAIR_DEPOT_THIN_MM) {
      return toItem(input, ageYears ?? -1, "pink");
    }
    // 350–360 — пограничный, оставляем в списке розовым
    return toItem(input, ageYears ?? -1, "pink");
  }

  // капитальный
  if (thickness == null) {
    return toItem(input, ageYears ?? -1, "pink");
  }
  if (thickness > WHEEL_PAIR_MAJOR_OK_MM) return null;
  if (thickness < WHEEL_PAIR_MAJOR_THIN_MM) {
    return toItem(input, ageYears ?? -1, "pink");
  }
  // 390–400 — пограничный, оставляем в списке розовым
  return toItem(input, ageYears ?? -1, "pink");
}

/**
 * Оценка потребности одной детали в контексте ближайшего ремонта вагона.
 * Возраст считается на дату ремонта (что раньше: ДР или КР).
 */
export function evaluatePartNeed(input: PartsNeedInput): PartsNeedItem | null {
  if (getPartTypeCode(input.part) === PART_TYPE_WHEEL_PAIR) {
    return evaluateWheelPairNeed(input);
  }

  if (isFrameOrBolster(input.part)) {
    return evaluateFrameOrBolsterNeed(input);
  }

  if (getPartTypeCode(input.part) === PART_TYPE_SHOCK_ABSORBER) {
    return evaluateShockAbsorberNeed(input);
  }

  if (getPartTypeCode(input.part) === PART_TYPE_COUPLER) {
    return evaluateCouplerNeed(input);
  }

  // TODO: фильтрация по типу детали (остальные типы)
  return toItem(
    input,
    getPartAgeYears(input.part.manufactureYear, input.repairDate) ?? -1,
    null
  );
}

/**
 * Проверка потребности в замене деталей.
 *
 * На вход — детали с типом и датой ближайшего ремонта вагона
 * (что раньше: деповской или капитальный). Возраст считается на дату ремонта.
 */
export function checkPartsNeed(inputs: PartsNeedInput[]): PartsNeedItem[] {
  if (!inputs?.length) return [];
  return inputs.flatMap((input) => {
    const item = evaluatePartNeed(input);
    return item ? [item] : [];
  });
}

export function getPartsNeedRowClass(highlight: PartsNeedHighlight | null | undefined): string | undefined {
  if (highlight === "red") {
    return "bg-red-700 text-white hover:bg-red-700/90 dark:bg-red-950 dark:text-white dark:hover:bg-red-950/90";
  }
  if (highlight === "pink") {
    return "bg-pink-200/80 hover:bg-pink-200/90 dark:bg-pink-900/60 dark:hover:bg-pink-900/70";
  }
  return undefined;
}

export function formatUpcomingRepairType(repairType: UpcomingRepairType): string {
  return repairType === "major" ? "Капитальный" : "Деповской";
}
