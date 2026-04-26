import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NextStepButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'lg' | 'default';
}

export const NextStepButton = ({
  onClick,
  disabled = false,
  isLoading = false,
  className,
  size = 'sm'
}: NextStepButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size={size}
      variant="ghost"
      className={cn(
        disabled ? "text-gray-400" : "text-purple-600 hover:text-purple-700 hover:bg-purple-50",
        className
      )}
    >
      {isLoading ? 'Loading...' : 'Next'}
      {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
    </Button>
  );
};