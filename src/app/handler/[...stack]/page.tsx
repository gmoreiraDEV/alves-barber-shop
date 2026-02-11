import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "../../../stack/server";

export default function Handler(props: { params: unknown; searchParams: unknown }) {
  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
