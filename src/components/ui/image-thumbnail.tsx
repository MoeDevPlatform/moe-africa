import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageThumbnailProps extends ButtonProps {
  selected: boolean;
}

/** Draw selection and keyboard focus above the image, inside its clipping bounds. */
export const ImageThumbnail = ({ selected, className, children, ...props }: ImageThumbnailProps) => (
  <Button
    {...props}
    type="button"
    variant="ghost"
    aria-pressed={selected}
    className={cn(
      "relative shrink-0 overflow-hidden p-0 bg-muted transition-opacity focus-visible:ring-0 focus-visible:ring-offset-0 after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-2 after:border-transparent focus-visible:after:border-ring",
      selected ? "after:border-primary" : "opacity-60 hover:opacity-100 focus-visible:opacity-100",
      className,
    )}
  >
    {children}
  </Button>
);