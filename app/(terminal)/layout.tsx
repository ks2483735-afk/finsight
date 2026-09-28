import type { ReactNode } from "react";
import { Shell } from "@/components/layout/shell";

/** All authenticated-workspace style routes render inside the terminal shell. */
export default function TerminalLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
