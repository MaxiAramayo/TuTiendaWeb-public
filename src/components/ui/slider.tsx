/**
 * Componente Slider nativo sin dependencias externas
 * 
 * @module components/ui
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max: number;
  min: number;
  step: number;
  className?: string;
}

/**
 * Componente Slider para selección de rangos usando input nativo
 * 
 * @param props - Propiedades del componente
 * @returns Componente Slider
 */
const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, max, min, step, className, ...props }, ref) => {
    const [minValue, maxValue] = value;
    
    /**
     * Maneja el cambio del valor mínimo
     */
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = parseInt(e.target.value);
      if (newMin <= maxValue) {
        onValueChange([newMin, maxValue]);
      }
    };
    
    /**
     * Maneja el cambio del valor máximo
     */
    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = parseInt(e.target.value);
      if (newMax >= minValue) {
        onValueChange([minValue, newMax]);
      }
    };
    
    // Calcular porcentajes para el track visual
    const minPercent = ((minValue - min) / (max - min)) * 100;
    const maxPercent = ((maxValue - min) / (max - min)) * 100;
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        {/* Track de fondo */}
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
          {/* Track activo */}
          <div
            className="absolute h-full bg-blue-600 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
        </div>
        
        {/* Input para valor mínimo */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: 1 }}
        />
        
        {/* Input para valor máximo */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: 2 }}
        />
        
        <style jsx>{`
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #2563eb;
            border: 2px solid #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .slider-thumb::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #2563eb;
            border: 2px solid #ffffff;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .slider-thumb::-webkit-slider-track {
            background: transparent;
          }
          
          .slider-thumb::-moz-range-track {
            background: transparent;
          }
        `}</style>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };