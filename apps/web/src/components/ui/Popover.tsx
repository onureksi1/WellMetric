'use client';

import * as React from "react";
import { Popover as HeadlessPopover, Transition } from "@headlessui/react";
import { clsx } from "clsx";

export const Popover = ({ open, onOpenChange, children, ...props }: any) => {
  // HeadlessUI doesn't support controlled 'open' easily on Popover.
  // We'll pass it down or handle it if needed.
  return (
    <HeadlessPopover {...props}>
      {children}
    </HeadlessPopover>
  );
};

export const PopoverTrigger = ({ asChild, children, ...props }: any) => {
  return (
    <HeadlessPopover.Button as={asChild ? React.Fragment : "button"} {...props}>
      {children}
    </HeadlessPopover.Button>
  );
};

export const PopoverContent = React.forwardRef<HTMLDivElement, any>(
  ({ className, children, ...props }, ref) => (
    <Transition
      as={React.Fragment}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <HeadlessPopover.Panel
        ref={ref}
        className={clsx(
          "absolute z-50 mt-3 w-screen max-w-sm transform px-4 sm:px-0 lg:max-w-3xl",
          className
        )}
        {...props}
      >
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
          {children}
        </div>
      </HeadlessPopover.Panel>
    </Transition>
  )
);
PopoverContent.displayName = "PopoverContent";
