'use client';

import * as React from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { clsx } from "clsx";

export const Form = FormProvider;

export const FormField = Controller;

export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx("space-y-2", className)} {...props} />
  )
);
FormItem.displayName = "FormItem";

export const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={clsx("text-xs font-bold text-gray-500 uppercase tracking-wider", className)} {...props} />
  )
);
FormLabel.displayName = "FormLabel";

export const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div ref={ref} {...props} />
  )
);
FormControl.displayName = "FormControl";

export const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const context = useFormContext();
    if (!context) return null;
    
    const { formState: { errors } } = context;
    // Note: This is a simplified version. Ideally we'd need the field name here.
    // For now, let's just render the children if provided.
    
    if (!children) return null;

    return (
      <p ref={ref} className={clsx("text-xs font-medium text-danger", className)} {...props}>
        {children}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";
