'use client';

import * as React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown } from "lucide-react";
import { clsx } from "clsx";

export const Select = ({ onValueChange, ...props }: any) => (
  <Listbox onChange={onValueChange} {...props} />
);

export const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(
  ({ className, children, ...props }, ref) => (
    <Listbox.Button
      ref={ref}
      className={clsx(
        "flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-gray-50 px-4 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronsUpDown className="h-4 w-4 opacity-50" />
    </Listbox.Button>
  )
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = ({ placeholder, children, ...props }: any) => {
  return (
    <span {...props}>
      {children || placeholder}
    </span>
  );
};

export const SelectContent = ({ className, children, ...props }: any) => (
  <Transition
    as={React.Fragment}
    leave="transition ease-in duration-100"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <Listbox.Options
      className={clsx(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm",
        className
      )}
      {...props}
    >
      {children}
    </Listbox.Options>
  </Transition>
);

export const SelectItem = React.forwardRef<HTMLDivElement, any>(
  ({ className, children, value, ...props }, ref) => (
    <Listbox.Option
      ref={ref}
      className={({ active }) =>
        clsx(
          "relative cursor-default select-none py-2 pl-10 pr-4",
          active ? "bg-primary/10 text-primary" : "text-gray-900",
          className
        )
      }
      value={value}
      {...props}
    >
      {({ selected }) => (
        <>
          <span className={clsx("block truncate", selected ? "font-medium" : "font-normal")}>
            {children}
          </span>
          {selected ? (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
        </>
      )}
    </Listbox.Option>
  )
);
SelectItem.displayName = "SelectItem";
