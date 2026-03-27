import { Package } from "lucide-react";

interface EmptySectionProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

const EmptySection = ({ icon, title, description }: EmptySectionProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="p-3 rounded-full bg-muted mb-3">
      {icon || <Package className="h-6 w-6 text-muted-foreground" />}
    </div>
    <p className="font-medium text-muted-foreground">{title}</p>
    {description && (
      <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">{description}</p>
    )}
  </div>
);

export default EmptySection;
