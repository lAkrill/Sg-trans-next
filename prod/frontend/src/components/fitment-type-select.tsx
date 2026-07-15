'use client';

import React from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { useFitmentTypeOptions } from '@/hooks/fitmentTypes.hook';

interface FitmentTypeSelectProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

const FitmentTypeSelectComponent: React.FC<FitmentTypeSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { data: options = [], isLoading } = useFitmentTypeOptions();

  return (
    <SearchableSelect
      options={options}
      value={typeof value === 'string' ? value : ''}
      onChange={(val) => onChange(val)}
      placeholder="Выберите тип арматуры..."
      searchPlaceholder="Поиск типа арматуры..."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};

FitmentTypeSelectComponent.displayName = 'FitmentTypeSelect';

export const FitmentTypeSelect = FitmentTypeSelectComponent as unknown as React.ComponentType<FitmentTypeSelectProps>;
