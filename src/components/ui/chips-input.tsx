import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipsInputProps {
  value: string[];
  onChange: (chips: string[]) => void;
  placeholder?: string;
  maxChips?: number;
  delimiter?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export const ChipsInput = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter',
  maxChips = 6,
  delimiter = ',',
  className,
  id,
  disabled = false
}: ChipsInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === delimiter) {
      e.preventDefault();
      addChip();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeChip(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.includes(delimiter)) {
      const chips = newValue.split(delimiter).map(c => c.trim()).filter(c => c);
      chips.forEach(chip => addChipDirect(chip));
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const addChip = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && value.length < maxChips) {
      onChange([...value, trimmed]);
      setInputValue('');
    }
  };

  const addChipDirect = (chip: string) => {
    if (chip && !value.includes(chip) && value.length < maxChips) {
      onChange([...value, chip]);
    }
  };

  const removeChip = (chipToRemove: string) => {
    onChange(value.filter(chip => chip !== chipToRemove));
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addChip();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length >= maxChips ? `Maximum ${maxChips} items` : placeholder}
        disabled={disabled || value.length >= maxChips}
        className="bg-white"
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((chip, index) => (
            <Badge
              key={index}
              className="bg-green-100 text-green-800 border border-green-200 hover:bg-red-100 hover:text-red-800 hover:border-red-200 cursor-pointer transition-colors"
              onClick={() => !disabled && removeChip(chip)}
            >
              {chip}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
