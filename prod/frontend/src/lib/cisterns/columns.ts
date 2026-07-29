export type CisternColumnOption = {
  value: string;
  label: string;
};

/** Единый список колонок / полей сортировки с русскими названиями */
export const CISTERN_COLUMN_OPTIONS: CisternColumnOption[] = [
  { value: "number", label: "Номер" },
  { value: "manufacturer.name", label: "Производитель" },
  { value: "builddate", label: "Дата постройки" },
  { value: "serviceenddate", label: "Конец срока эксплуатации" },
  { value: "extensionservicelifedate", label: "Продление срока эксплуатации" },
  { value: "tareweight", label: "Тара" },
  { value: "loadcapacity", label: "Грузоподъемность" },
  { value: "length", label: "Длина" },
  { value: "axlecount", label: "Количество осей" },
  { value: "volume", label: "Объем" },
  { value: "fillingvolume", label: "Заполняемый объем" },
  { value: "initialtareweight", label: "Начальный вес тары" },
  { value: "type.name", label: "Тип" },
  { value: "model.name", label: "Модель" },
  { value: "commissioningdate", label: "Дата ввода в эксплуатацию" },
  { value: "serialnumber", label: "Серийный номер" },
  { value: "registrationnumber", label: "Регистрационный номер" },
  { value: "registrationdate", label: "Дата регистрации" },
  { value: "registrar.name", label: "Регистратор" },
  { value: "notes", label: "Примечания" },
  { value: "owner.name", label: "Собственник" },
  { value: "railwaycisternstatus.name", label: "Статус" },
  { value: "techconditions", label: "Техническое состояние" },
  { value: "pripiska", label: "Приписка" },
  { value: "reregistrationdate", label: "Перерегистрация" },
  { value: "reregistrationnextdate", label: "Следующая перерегистрация" },
  { value: "pressure", label: "Давление" },
  { value: "testpressure", label: "Испытательное давление" },
  { value: "rent", label: "Аренда" },
  { value: "affiliation.value", label: "Принадлежность" },
  { value: "servicelifeyears", label: "Срок службы (лет)" },
  { value: "periodmajorrepair", label: "Период капитального ремонта" },
  { value: "periodperiodictest", label: "Период периодического освидетельствования" },
  { value: "periodintermediatetest", label: "Период промежуточного освидетельствования" },
  { value: "perioddepotrepair", label: "Период деповского ремонта" },
  { value: "dangerclass", label: "Класс опасности" },
  { value: "substance", label: "Вещество" },
  { value: "tareweight2", label: "Тара 2" },
  { value: "tareweight3", label: "Тара 3" },
  { value: "createdat", label: "Дата создания" },
  { value: "updatedat", label: "Дата обновления" },
];

const COLUMN_LABEL_BY_VALUE = Object.fromEntries(
  CISTERN_COLUMN_OPTIONS.map((option) => [option.value, option.label])
) as Record<string, string>;

/** Русское название колонки; для неизвестных ключей возвращает сам ключ */
export function getCisternColumnLabel(column: string): string {
  return COLUMN_LABEL_BY_VALUE[column] ?? column;
}
