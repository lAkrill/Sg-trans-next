'use client';

import React from 'react';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { useCisternIdAndNumbers } from '@/hooks/cisterns.hook';

interface CisternSelectProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  /** When set, onChange emits both id and number under the given form field keys */
  fieldsMapping?: {
    idKey: string;
    numberKey: string;
  };
}

type CisternSelectType = React.FC<CisternSelectProps> & {
  displayName: string;
};

const CisternSelectComponent: React.FC<CisternSelectProps> = ({
  value,
  onChange,
  disabled = false,
  fieldsMapping,
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

  const handleChange = (selectedId: unknown) => {
    if (!fieldsMapping) {
      onChange(selectedId);
      return;
    }

    const id = typeof selectedId === 'string' ? selectedId : '';
    const cistern = cisterns.find((item) => item.id === id);

    onChange({
      [fieldsMapping.idKey]: id,
      [fieldsMapping.numberKey]: cistern?.number ?? '',
    });
  };

  return (
    <SearchableSelect
      options={options}
      value={typeof value === 'string' ? value : ''}
      onChange={handleChange}
      placeholder="Выберите железнодорожную цистерну..."
      searchPlaceholder="Поиск по номеру..."
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};

CisternSelectComponent.displayName = 'CisternSelect';

export const CisternSelect = CisternSelectComponent as unknown as React.ComponentType<CisternSelectProps>;

/** Selects a cistern and writes both cisternId and cisternNum into the form */
export const PersonalWagonCisternSelect: React.ComponentType<{
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <CisternSelectComponent
    value={value}
    onChange={onChange}
    disabled={disabled}
    fieldsMapping={{ idKey: 'cisternId', numberKey: 'cisternNum' }}
  />
);
