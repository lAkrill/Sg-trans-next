import React from 'react';

// Базовые типы для конфигурации справочников
export interface DirectoryConfig {
  name: string;
  endpoint: string;
  displayName: string;
  description: string;
  fields: DirectoryField[];
}

export interface DirectoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'custom';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  customComponent?: React.ComponentType<{
    value: unknown;
    onChange: (value: unknown) => void;
    disabled?: boolean;
  }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Утилиты для работы со справочниками
export const directoryUtils = {
  validateField: (field: DirectoryField, value: unknown): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} обязательно для заполнения`;
    }

    if (field.type === 'number' && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.label} должно быть числом`;
      }
      if (field.validation?.min !== undefined && numValue < field.validation.min) {
        return `${field.label} должно быть не менее ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && numValue > field.validation.max) {
        return `${field.label} должно быть не более ${field.validation.max}`;
      }
    }

    if (field.validation?.pattern && value && typeof value === 'string') {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return `${field.label} не соответствует требуемому формату`;
      }
    }

    return null;
  },
};
