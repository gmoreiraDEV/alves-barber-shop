import { StackProvider, StackTheme } from "@stackframe/stack";
import type { ReactNode } from "react";
import { stackServerApp } from "@/stack/server";
import { stackTheme } from "@/stack/theme";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <StackProvider app={stackServerApp}>
      <StackTheme theme={stackTheme}>{children}</StackTheme>
    </StackProvider>
  );
}
