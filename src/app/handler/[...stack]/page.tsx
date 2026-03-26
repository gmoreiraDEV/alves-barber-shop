import { StackHandler } from "@stackframe/stack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Handler() {
  return <StackHandler fullPage />;
}
