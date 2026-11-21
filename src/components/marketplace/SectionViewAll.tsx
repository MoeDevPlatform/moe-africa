import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

/** Heading link used by homepage shelves. Visible text stays "View all". */
export function SectionViewAll({ to, testId, label }: { to: string; testId: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-primary underline-offset-4 hover:underline"
      data-testid={testId}
      aria-label={label}
    >
      View all <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
