import React from 'react';
import { cn } from '../../../lib/utils';

const Badge = ({ className, variant = "default", children, ...props }) => {
    const variantClassMap = {
        default: "bg-teal-100 text-teal-800 hover:bg-teal-200",
        secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        success: "bg-green-100 text-green-800 hover:bg-green-200",
        warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        danger: "bg-red-100 text-red-800 hover:bg-red-200",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variantClassMap[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export { Badge };