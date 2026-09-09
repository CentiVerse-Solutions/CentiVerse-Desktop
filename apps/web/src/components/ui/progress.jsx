// src/components/ui/progress.jsx
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

const Progress = React.forwardRef(({ className, value, ...props }, ref) => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        const timer = setTimeout(() => setProgress(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                "relative h-4 w-full overflow-hidden rounded-full bg-gray-100",
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className="h-full w-full flex-1 bg-teal-500 transition-all"
                style={{ transform: `translateX(-${100 - progress}%)` }}
            />
        </ProgressPrimitive.Root>
    );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };