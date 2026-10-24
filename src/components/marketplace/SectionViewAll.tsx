import { Link } from "react-router-dom";

/** Heading link used by homepage shelves. Visible text stays "View all". */
export function SectionViewAll({ to, testId, label }: { to: string; testId: string; label: string }) {
  return (
    <Link
      to={to}
      className="shrink-0 whitespace-nowrap text-sm font-medium text-primary hover:underline"
      data-testid={testId}
      aria-label={label}
    >
      View all
    </Link>
  );
}
