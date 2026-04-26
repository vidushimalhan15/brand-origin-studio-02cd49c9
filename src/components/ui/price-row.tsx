import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PriceRowProps {
  priceValue: number | 'Free' | 'Contact' | null;
  currencyValue: '$' | '€' | '£' | '₹';
  onPriceChange: (value: number | 'Free' | 'Contact' | null) => void;
  onCurrencyChange: (value: '$' | '€' | '£' | '₹') => void;
  disabled?: boolean;
  className?: string;
  priceInputId?: string;
  currencySelectId?: string;
}

export const PriceRow = ({
  priceValue,
  currencyValue,
  onPriceChange,
  onCurrencyChange,
  disabled = false,
  className,
  priceInputId,
  currencySelectId
}: PriceRowProps) => {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    // Check for keywords
    if (value.toLowerCase() === 'free') {
      onPriceChange('Free');
      return;
    }
    if (value.toLowerCase() === 'contact') {
      onPriceChange('Contact');
      return;
    }

    // Parse as number
    if (value === '') {
      onPriceChange(null);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onPriceChange(numValue);
    }
  };

  const displayValue = priceValue === null ? '' : String(priceValue);

  return (
    <div className={cn('flex gap-2', className)}>
      <Select
        value={currencyValue}
        onValueChange={onCurrencyChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={currencySelectId}
          className="w-20"
          data-testid="currency-select"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="$">$</SelectItem>
          <SelectItem value="€">€</SelectItem>
          <SelectItem value="£">£</SelectItem>
          <SelectItem value="₹">₹</SelectItem>
        </SelectContent>
      </Select>

      <Input
        id={priceInputId}
        type="text"
        placeholder="Enter price, 'Free', or 'Contact'"
        value={displayValue}
        onChange={handlePriceChange}
        disabled={disabled}
        className="flex-1"
        data-testid="price-input"
      />
    </div>
  );
};
