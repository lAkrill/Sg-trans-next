'use client';

import React from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { useFitmentModelOptions } from '@/hooks/fitmentModels.hook';

interface FitmentModelSelectProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

const FitmentModelSelectComponent: React.FC<FitmentModelSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { data: options = [], isLoading } = useFitmentModelOptions();

  return (
    <SearchableSelect
      options={options}
      value={typeof value === 'string' ? value : ''}
      onChange={(val) => onChange(val)}
      placeholder="Выберите модель арматуры..."
      searchPlaceholder="Поиск модели арматуры..."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};

FitmentModelSelectComponent.displayName = 'FitmentModelSelect';

export const FitmentModelSelect = FitmentModelSelectComponent as unknown as React.ComponentType<FitmentModelSelectProps>;
