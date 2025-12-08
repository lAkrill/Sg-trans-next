'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

export const SearchableSelect = React.forwardRef<
  HTMLDivElement,
  SearchableSelectProps
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Выберите...',
      disabled = false,
      searchPlaceholder = 'Поиск...',
      isLoading = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Фильтрованные опции (поиск только по названию/label)
    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options;
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm]);

    // Выбранное значение
    const selectedOption = React.useMemo(
      () => options.find((opt) => opt.value === value),
      [options, value]
    );

    // Обработка клика вне компонента
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Фокус на поле поиска при открытии
    React.useEffect(() => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setSearchTerm('');
    };

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className="relative w-full"
      >
        {/* Trigger Button */}
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm',
            'shadow-xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'placeholder:text-muted-foreground',
            disabled && 'cursor-not-allowed opacity-50',
            isOpen && 'ring-1 ring-ring'
          )}
        >
          <span
            className={cn(
              'truncate',
              !selectedOption && 'text-muted-foreground'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
              <X
                size={16}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={16}
              className={cn(
                'text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              'absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-input bg-background shadow-lg',
              'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2'
            )}
          >
            {/* Search Input */}
            <div className="border-b border-input p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm',
                  'placeholder:text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
              />
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                  Загрузка...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-center text-sm text-muted-foreground">
                  {searchTerm ? 'Ничего не найдено' : 'Нет опций'}
                </div>
              ) : (
                <ul className="py-1">
                  {filteredOptions.map((option) => (
                    <li key={option.value}>
                      <button
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm',
                          'hover:bg-accent hover:text-accent-foreground',
                          value === option.value &&
                            'bg-primary text-primary-foreground'
                        )}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';
