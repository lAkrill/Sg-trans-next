'use client';

import React from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { wagonModelsApi } from '@/api/directories';
import type { WagonModelDTO } from '@/types/directories';

interface WagonModelSelectProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

const WagonModelSelectComponent: React.FC<WagonModelSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [models, setModels] = React.useState<WagonModelDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        const data = await wagonModelsApi.getAll();
        setModels(data);
      } catch (error) {
        console.error('Failed to fetch wagon models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const options: SearchableSelectOption[] = React.useMemo(
    () =>
      models.map((model) => ({
        value: model.id,
        label: model.name,
      })),
    [models]
  );

  return (
    <SearchableSelect
      options={options}
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      placeholder="Выберите модель вагона..."
      searchPlaceholder="Поиск по названию модели..."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};

WagonModelSelectComponent.displayName = 'WagonModelSelect';

export const WagonModelSelect = WagonModelSelectComponent as unknown as React.ComponentType<WagonModelSelectProps>;
