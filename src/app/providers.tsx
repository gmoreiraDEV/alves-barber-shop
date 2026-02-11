"use client";

import type { ReactNode } from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { stackTheme } from "@/stack/theme";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme theme={stackTheme}>{children}</StackTheme>
    </StackProvider>
  );
}
