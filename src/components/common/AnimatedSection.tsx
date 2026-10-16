import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AnimatedSection({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ animationDelay: `${delay}ms` }} className={cn(visible ? "section-animated" : "section-hidden", className)}>{children}</div>;
}