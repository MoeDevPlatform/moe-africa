import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FloatingRefreshButton = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleRefresh}
            className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
            aria-label="Refresh page"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">Refresh page</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FloatingRefreshButton;
