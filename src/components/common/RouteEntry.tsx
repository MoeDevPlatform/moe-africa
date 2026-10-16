import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function RouteEntry({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <div key={pathname} className="route-entry">{children}</div>;
}