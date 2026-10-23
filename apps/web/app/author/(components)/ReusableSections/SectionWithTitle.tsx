"use client";

import Title from "@/components/Title";
import { cn } from "@/lib/strings";
import type { ComponentPropsWithoutRef, ElementType } from "react";

export function SectionWithTitle<T extends ElementType = "section">(
  props: Omit<ComponentPropsWithoutRef<T>, "as" | "className"> & {
    description?: string | JSX.Element;
    required?: boolean;
    as?: T;
    className?: string;
    IconForTitle?: ElementType;
    error?: string;
    compact?: boolean;
  },
) {
  const {
    as,
    title,
    description,
    className,
    children,
    IconForTitle,
    required = false,
    compact = false,
    error,
    ...rest
  } = props;
  const Component = as ?? "section";
  return (
    <Component
      className="group relative flex max-w-full flex-col items-start gap-y-5 rounded-2xl border border-gray-200/70 bg-white px-5 py-5 shadow-card transition-shadow duration-200 hover:shadow-soft max-md:px-5 sm:px-7 sm:py-7 dark:border-gray-700/70 dark:bg-gray-800"
      {...rest}
    >
      <div className="flex flex-col gap-y-1.5">
        <Title
          className={cn(
            "flex items-center gap-2 max-md:flex-wrap",
            compact
              ? "text-base font-semibold text-gray-700 dark:text-gray-200"
              : "text-xl font-bold tracking-[-0.01em] text-gray-900 dark:text-gray-100",
          )}
        >
          {IconForTitle && (
            <IconForTitle className="shrink-0 my-auto w-5 aspect-square text-brand-500 dark:text-brand-400" />
          )}
          <span className={cn(IconForTitle && "pl-1.5")}>{title}</span>
          {required && (
            <span className="rounded-pill border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300">
              Required
            </span>
          )}
        </Title>
        {description && (
          <p className="text-base leading-6 text-gray-600 dark:text-gray-300 font-[450]">
            {description}
          </p>
        )}
      </div>
      <div className={cn("w-full", className)}>{children}</div>
      {error && (
        <p className="text-sm text-red-500" id={`error-${error}`}>
          {error}
        </p>
      )}
    </Component>
  );
}

export default SectionWithTitle;
