import React from 'react';
import { cn } from '../../../lib/utils';

const Button = React.forwardRef(({
    className,
    variant = "default",
    size = "default",
    children,
    ...props
}, ref) => {
    const variants = {
        default: "bg-teal-600 text-white hover:bg-teal-700",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-800",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-800",
        link: "bg-transparent underline-offset-4 hover:underline text-teal-600 hover:bg-transparent"
    };

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6",
        icon: "h-10 w-10"
    };

    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";

// Export as named (for shadcn pattern)
export { Button };