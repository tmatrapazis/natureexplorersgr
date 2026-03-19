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
import { Check } from 'lucide-react';

export default function MobileSelect({ value, onValueChange, options, placeholder, label, triggerClassName }) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <>
      {/* Desktop view - hidden on mobile */}
      <div className="hidden md:block">
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={triggerClassName || "w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile view - drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild className="md:hidden">
          <Button variant="outline" className={triggerClassName || "w-full justify-start text-left font-normal"}>
            {selectedOption ? selectedOption.label : placeholder}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label || placeholder}</DrawerTitle>
            <DrawerDescription>Select an option</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="space-y-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors min-h-[44px] ${
                    value === option.value
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {value === option.value && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}