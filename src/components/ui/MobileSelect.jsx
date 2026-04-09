import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';

/**
 * MobileSelect — a Drawer-based picker that works reliably in iOS/Android WebViews.
 * Replaces native <select> and Radix SelectContent portals, both of which can
 * trigger touch-event and z-index failures in WebView-wrapped apps.
 */
export default function MobileSelect({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  triggerClassName,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label || placeholder}
          onClick={(e) => e.currentTarget.blur()}
          className={
            triggerClassName ||
            'mt-1 inline-flex items-center justify-between gap-2 px-3 py-2 min-h-[44px] text-[16px] md:text-sm rounded-md border border-input bg-background text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation'
          }
        >
          <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedOption ? selectedOption.label : (placeholder || 'Select…')}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{label || placeholder}</DrawerTitle>
          <DrawerDescription>
            {placeholder ? `Select ${label || placeholder}` : 'Select an option'}
          </DrawerDescription>
        </DrawerHeader>

        <div
          role="listbox"
          aria-label={label || placeholder}
          className="px-4 pb-2 max-h-[55vh] overflow-y-auto scrollbar-hide"
        >
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors min-h-[48px] ${
                    isSelected
                      ? 'bg-brand-gold/40 text-brand-dark dark:bg-brand-dark dark:text-brand-gold'
                      : 'bg-muted hover:bg-muted/70 active:bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {isSelected && <Check className="w-5 h-5 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full min-h-[48px]">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}