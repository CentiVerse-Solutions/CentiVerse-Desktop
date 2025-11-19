// src/components/ui/badge.jsx
import React from "react";
import { cn } from "../../lib/utils";

const Badge = React.forwardRef(({
    className,
    variant = "default",
    children,
    ...props
}, ref) => {
    const variantStyles = {
        default: "bg-teal-100 text-teal-800 hover:bg-teal-200",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        outline: "bg-transparent border border-gray-200 text-gray-800 hover:bg-gray-100",
        destructive: "bg-red-100 text-red-800 hover:bg-red-200"
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variantStyles[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

Badge.displayName = "Badge";

export { Badge };