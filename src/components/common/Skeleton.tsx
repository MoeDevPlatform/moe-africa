import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  variant?: "card" | "text" | "image" | "circle" | "table-row";
  width?: CSSProperties["width"];
  aspectRatio?: string;
  className?: string;
}

export default function Skeleton({ variant = "text", width, aspectRatio, className }: SkeletonProps) {
  return <div aria-hidden="true" style={{ width, aspectRatio }} className={cn("commerce-skeleton", {
    "h-80 w-full": variant === "card",
    "h-4 w-full": variant === "text",
    "w-full aspect-[4/3]": variant === "image",
    "h-12 w-12 rounded-full": variant === "circle",
    "h-20 w-full": variant === "table-row",
  }, className)} />;
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return <div role="status" aria-label="Loading" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: count }, (_, i) => <Skeleton key={i} variant="card" />)}</div>;
}