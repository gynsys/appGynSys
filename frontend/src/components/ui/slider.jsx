import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs) => {
    return twMerge(clsx(inputs));
};

const Slider = React.forwardRef(({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    return (
        <input
            type="range"
            ref={ref}
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={(e) => onValueChange([parseInt(e.target.value)])}
            className={cn(
                "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary",
                className
            )}
            {...props}
        />
    );
});
Slider.displayName = "Slider";

export { Slider };
