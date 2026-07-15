'use client';

import React from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useManufacturerOptions } from '@/hooks';

interface ManufacturerSelectProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

const ManufacturerSelectComponent: React.FC<ManufacturerSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { data: options = [], isLoading } = useManufacturerOptions();

  return (
    <SearchableSelect
      options={options}
      value={typeof value === 'string' ? value : ''}
      onChange={(val) => onChange(val)}
      placeholder="Выберите производителя..."
      searchPlaceholder="Поиск производителя..."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};

ManufacturerSelectComponent.displayName = 'ManufacturerSelect';

export const ManufacturerSelect = ManufacturerSelectComponent as unknown as React.ComponentType<ManufacturerSelectProps>;
