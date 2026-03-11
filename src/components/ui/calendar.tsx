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
      size="icon-sm"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={modifiers.selected}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      className={cn(
        "mx-auto size-(--cell-size) rounded-(--cell-radius) text-sm font-medium text-stone-200 transition-colors",
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
  navLayout = "around",
  fixedWeeks = true,
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
      navLayout={navLayout}
      fixedWeeks={fixedWeeks}
      locale={locale}
      className={cn(
        "w-full min-w-70 max-w-[20rem] rounded-[1.75rem] border border-stone-800/80 bg-stone-950/95 p-3.5 text-stone-100 shadow-2xl sm:min-w-76 sm:p-4",
        "[--cell-size:2.25rem] [--cell-radius:0.95rem] sm:[--cell-size:2.6rem]",
        className,
      )}
      classNames={{
        ...defaultClassNames,
        root: "w-full",
        months: "w-full",
        month:
          "grid w-full grid-cols-[2.25rem_1fr_2.25rem] items-center gap-y-3 sm:grid-cols-[2.5rem_1fr_2.5rem]",
        month_caption:
          "col-start-2 row-start-1 flex items-center justify-center px-2 text-center",
        caption_label: "text-sm font-semibold text-stone-200 whitespace-nowrap",
        nav: "flex items-center justify-between",
        button_previous: cn(
          "col-start-1 row-start-1",
          "inline-flex size-9 items-center justify-center rounded-full border border-stone-800/90 bg-stone-900/80 text-stone-300 shadow-sm",
          "hover:bg-stone-800/70 hover:text-stone-100",
          "focus-visible:ring-2 focus-visible:ring-amber-400/70",
          buttonVariant === "outline" ? "border-stone-700 bg-stone-950" : "",
        ),
        button_next: cn(
          "col-start-3 row-start-1",
          "inline-flex size-9 items-center justify-center rounded-full border border-stone-800/90 bg-stone-900/80 text-stone-300 shadow-sm",
          "hover:bg-stone-800/70 hover:text-stone-100",
          "focus-visible:ring-2 focus-visible:ring-amber-400/70",
          buttonVariant === "outline" ? "border-stone-700 bg-stone-950" : "",
        ),
        chevron: "h-4 w-4",
        month_grid:
          "col-span-3 w-full table-fixed border-separate border-spacing-y-1.5",
        weekdays: "text-center",
        weekday:
          "pb-1 text-center text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-stone-500 sm:text-[0.7rem]",
        weeks: "w-full",
        week: "w-full",
        day: "h-[calc(var(--cell-size)+0.35rem)] p-0 text-center align-middle",
        day_button: "mx-auto",
        selected: "text-stone-950",
        today: "font-semibold text-stone-100",
        outside: "text-stone-600",
        disabled: "opacity-50",
        range_start: "rounded-l-[var(--cell-radius)] bg-stone-800/40",
        range_end: "rounded-r-[var(--cell-radius)] bg-stone-800/40",
        range_middle: "bg-stone-800/50 text-stone-100",
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
