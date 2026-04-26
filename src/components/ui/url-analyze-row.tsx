import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrlAnalyzeRowProps {
  urlValue: string;
  onUrlChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
  manualInputToggle?: boolean;
  onManualInputChange?: (value: boolean) => void;
  placeholder?: string;
  analyzeLabel?: string;
  className?: string;
  urlInputId?: string;
  analyzeButtonId?: string;
  toggleId?: string;
}

export const UrlAnalyzeRow = ({
  urlValue,
  onUrlChange,
  onAnalyze,
  isAnalyzing = false,
  disabled = false,
  manualInputToggle = false,
  onManualInputChange,
  placeholder = 'Paste URL here',
  analyzeLabel = 'Analyze',
  className,
  urlInputId,
  analyzeButtonId,
  toggleId
}: UrlAnalyzeRowProps) => {
  // URL validation
  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    const urlPattern = /^https?:\/\/.+/i;
    return urlPattern.test(url);
  };

  const isUrlValid = isValidUrl(urlValue);
  const isDisabled = disabled || manualInputToggle || !isUrlValid;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-3">
        <Input
          id={urlInputId}
          type="url"
          placeholder={placeholder}
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          className="flex-1"
          disabled={manualInputToggle}
        />
        <Button
          id={analyzeButtonId}
          onClick={onAnalyze}
          disabled={isDisabled || isAnalyzing}
          className="bg-slate-100 hover:bg-slate-200 text-slate-900 h-10 px-6"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" />
              {analyzeLabel}
            </>
          )}
        </Button>
      </div>

      {onManualInputChange && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Or fill in manually</span>
          <div className="flex items-center gap-2">
            <Switch
              id={toggleId}
              checked={manualInputToggle}
              onCheckedChange={onManualInputChange}
              data-testid="manual-input-toggle"
            />
            <Label htmlFor={toggleId} className="text-sm font-medium">
              Manual Input
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};
