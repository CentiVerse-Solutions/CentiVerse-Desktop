import React from 'react';
import { cn } from '../../../lib/utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const Card = ({ className, ...props }: DivProps) => (
    <div className={cn("bg-white rounded-lg border shadow-sm", className)} {...props} />
);

const CardHeader = ({ className, ...props }: DivProps) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-xl font-semibold leading-none tracking-tight", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-sm text-gray-500", className)} {...props} />
);

const CardContent = ({ className, ...props }: DivProps) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: DivProps) => (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
