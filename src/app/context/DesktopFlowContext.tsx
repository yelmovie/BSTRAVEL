/**
 * DesktopFlowContext
 *
 * Previously maintained its own budget / indoorPref / purpose state.
 * These fields are now unified in AppContext so they work on BOTH mobile and desktop.
 * This file is kept purely for backward-compatibility; it re-exports the
 * relevant fields from AppContext via a thin hook wrapper.
 */
import { type ReactNode } from "react";

export type { BudgetLevel, IndoorPref } from "./AppContext";
export { useApp as useDesktopFlow } from "./AppContext";

// DesktopFlowProvider is now a no-op passthrough — the real state lives
// in AppProvider which wraps the whole app in App.tsx.
export function DesktopFlowProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
