// Экспорт базовых типов и утилит
export type { DirectoryConfig, DirectoryField } from './types';
export { directoryUtils } from './types';

// Экспорт базовых конфигураций полей (без хуков)
export { affiliationsConfig } from './affiliations.config';
export { depotsConfig } from './depots.config';
export { manufacturersConfig } from './manufacturers.config';
export { ownersConfig } from './owners.config';
export { wagonTypesConfig } from './wagon-types.config';
export { wagonModelsConfig } from './wagon-models.config';
export { locationsConfig } from './locations.config';
export { partTypesConfig } from './part-types.config';
export { partStatusesConfig } from './part-statuses.config';
export { repairTypesConfig } from './repair-types.config';
export { registrarsConfig } from './registrars.config';
export { stampNumbersConfig } from './stamp-numbers.config';
export { partsBaseConfig } from './parts.config';
export { vesselsConfig } from './vessels.config';

// Объект со всеми базовыми конфигурациями
import { affiliationsBaseConfig } from './affiliations.config';
import { depotsBaseConfig } from './depots.config';
import { manufacturersBaseConfig } from './manufacturers.config';
import { ownersBaseConfig } from './owners.config';
import { wagonTypesBaseConfig } from './wagon-types.config';
import { wagonModelsBaseConfig } from './wagon-models.config';
import { locationsBaseConfig } from './locations.config';
import { partTypesBaseConfig } from './part-types.config';
import { partStatusesBaseConfig } from './part-statuses.config';
import { repairTypesBaseConfig } from './repair-types.config';
import { registrarsBaseConfig } from './registrars.config';
import { stampNumbersBaseConfig } from './stamp-numbers.config';
import { partsBaseConfig } from './parts.config';
import { vesselsBaseConfig } from './vessels.config';
import { DirectoryConfig } from './types';

export const directoriesConfig: Record<string, DirectoryConfig> = {
  affiliations: affiliationsBaseConfig,
  depots: depotsBaseConfig,
  manufacturers: manufacturersBaseConfig,
  owners: ownersBaseConfig,
  wagonTypes: wagonTypesBaseConfig,
  wagonModels: wagonModelsBaseConfig,
  locations: locationsBaseConfig,
  partTypes: partTypesBaseConfig,
  partStatuses: partStatusesBaseConfig,
  repairTypes: repairTypesBaseConfig,
  registrars: registrarsBaseConfig,
  stampNumbers: stampNumbersBaseConfig,
  parts: partsBaseConfig,
  vessels: vesselsBaseConfig,
};

// Утилиты для работы с базовыми конфигурациями
export const directoryConfigUtils = {
  getConfig: (directoryName: string): DirectoryConfig | undefined => {
    return directoriesConfig[directoryName];
  },

  getAllConfigs: (): DirectoryConfig[] => {
    return Object.values(directoriesConfig);
  },

  getFieldsByDirectory: (directoryName: string) => {
    const config = directoriesConfig[directoryName];
    return config?.fields || [];
  },

  getConfigNames: (): string[] => {
    return Object.keys(directoriesConfig);
  },

  getConfigByEndpoint: (endpoint: string): DirectoryConfig | undefined => {
    return Object.values(directoriesConfig).find(config => config.endpoint === endpoint);
  },
};
