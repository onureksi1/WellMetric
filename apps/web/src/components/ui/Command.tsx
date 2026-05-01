'use client';

import * as React from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";

export const Command = React.forwardRef<HTMLDivElement, any>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-900",
        className
      )}
      {...props}
    />
  )
);
Command.displayName = "Command";

export const CommandInput = React.forwardRef<HTMLInputElement, any>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={clsx(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = "CommandInput";

export const CommandList = React.forwardRef<HTMLDivElement, any>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  )
);
CommandList.displayName = "CommandList";

export const CommandEmpty = React.forwardRef<HTMLDivElement, any>(
  (props, ref) => (
    <div
      ref={ref}
      className="py-6 text-center text-sm"
      {...props}
    />
  )
);
CommandEmpty.displayName = "CommandEmpty";

export const CommandGroup = React.forwardRef<HTMLDivElement, any>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "overflow-hidden p-1 text-gray-900 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500",
        className
      )}
      {...props}
    />
  )
);
CommandGroup.displayName = "CommandGroup";

export const CommandItem = React.forwardRef<HTMLDivElement, any>(
  ({ className, onSelect, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-primary/10 hover:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={onSelect}
      {...props}
    />
  )
);
CommandItem.displayName = "CommandItem";
