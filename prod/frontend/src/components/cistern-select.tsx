'use client';

import React from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { useCisternIdAndNumbers } from '@/hooks/cisterns.hook';

interface CisternSelectProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

type CisternSelectType = React.FC<CisternSelectProps> & {
  displayName: string;
};

const CisternSelectComponent: React.FC<CisternSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { data: cisterns = [], isLoading } = useCisternIdAndNumbers();

  const options: SearchableSelectOption[] = React.useMemo(
    () =>
      cisterns.map((cistern) => ({
        value: cistern.id,
        label: cistern.number,
      })),
    [cisterns]
  );

  return (
    <SearchableSelect
      options={options}
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      placeholder="Выберите железнодорожную цистерну..."
      searchPlaceholder="Поиск по номеру..."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};

CisternSelectComponent.displayName = 'CisternSelect';

export const CisternSelect = CisternSelectComponent as unknown as React.ComponentType<CisternSelectProps>;
