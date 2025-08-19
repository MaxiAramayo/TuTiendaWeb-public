"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import React from "react";

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function Counter({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: CounterProps) {
  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-8 text-center font-medium">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
} 