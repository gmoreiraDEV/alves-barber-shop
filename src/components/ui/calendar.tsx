"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import type * as React from "react";
import {
  type ChevronProps,
  type DayButton,
  DayPicker,
  getDefaultClassNames,
  type Locale,
} from "react-day-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  locale?: Partial<Locale>;
};

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      className={cn(
        "size-[var(--cell-size)] rounded-[var(--cell-radius)] text-sm font-medium text-stone-200",
        "hover:bg-stone-800/70 hover:text-stone-100",
        "data-[selected=true]:bg-amber-500/90 data-[selected=true]:text-stone-950",
        "data-[today=true]:border data-[today=true]:border-amber-500",
        "data-[outside=true]:text-stone-600",
        "data-[disabled=true]:text-stone-700 data-[disabled=true]:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-amber-400/70",
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      locale={locale}
      className={cn(
        "rounded-2xl border border-stone-800/80 bg-stone-950/95 p-3 text-stone-100",
        "[--cell-size:2.4rem] [--cell-radius:999px]",
        className,
      )}
      classNames={{
        ...defaultClassNames,
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-4",
        caption: "flex items-center justify-between gap-2",
        caption_label: "text-sm font-semibold text-stone-200",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-8 w-8 rounded-full border border-stone-800 text-stone-300",
          "hover:bg-stone-800/70 hover:text-stone-100",
          "focus-visible:ring-2 focus-visible:ring-amber-400/70",
        ),
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7",
        head_cell:
          "h-8 text-center text-[10px] uppercase tracking-widest text-stone-500",
        row: "mt-2 grid grid-cols-7",
        cell: "h-[var(--cell-size)] w-[var(--cell-size)] place-self-center text-center",
        day: "flex items-center justify-center",
        day_selected: "bg-amber-500/90 text-stone-950",
        day_today: "border border-amber-500",
        day_outside: "text-stone-600",
        day_disabled: "text-stone-700 opacity-50",
        day_range_start: "rounded-l-[var(--cell-radius)]",
        day_range_end: "rounded-r-[var(--cell-radius)]",
        day_range_middle: "bg-stone-800/50 text-stone-100",
        ...classNames,
      }}
      components={{
        Chevron: ({
          className: iconClass,
          orientation,
          disabled: _disabled,
          ...iconProps
        }: ChevronProps) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;

          return <Icon className={cn("h-4 w-4", iconClass)} {...iconProps} />;
        },
        DayButton: ({ ...dayButtonProps }) => (
          <CalendarDayButton locale={locale} {...dayButtonProps} />
        ),
        ...components,
      }}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      {...props}
    />
  );
}
