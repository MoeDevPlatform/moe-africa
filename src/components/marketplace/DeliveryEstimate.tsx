import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Truck, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DeliveryEstimateProps {
  estimatedDeliveryDays: number;
  onRushOrderChange?: (enabled: boolean, additionalCost: number) => void;
}

const DeliveryEstimate = ({ estimatedDeliveryDays, onRushOrderChange }: DeliveryEstimateProps) => {
  const [rushOrder, setRushOrder] = useState(false);
  
  // Calculate estimates
  const creationDays = estimatedDeliveryDays;
  const deliveryDays = creationDays <= 5 ? "1-3" : creationDays <= 10 ? "2-4" : "3-5";
  const rushCreationDays = Math.max(1, Math.ceil(creationDays * 0.6));
  const rushAdditionalCost = 5000; // Fixed rush fee
  
  const totalDaysMin = rushOrder ? rushCreationDays + 1 : creationDays + parseInt(deliveryDays.split("-")[0]);
  const totalDaysMax = rushOrder ? rushCreationDays + 2 : creationDays + parseInt(deliveryDays.split("-")[1]);

  const handleRushToggle = (checked: boolean) => {
    setRushOrder(checked);
    onRushOrderChange?.(checked, checked ? rushAdditionalCost : 0);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Truck className="h-4 w-4 text-primary" />
          <span>Delivery Estimate</span>
        </div>
        
        <div className="space-y-3">
          {/* Creation Time */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Creation Time</p>
              <p className="text-xs text-muted-foreground">
                {rushOrder ? `${rushCreationDays} days (rush)` : `${creationDays} days`}
              </p>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Truck className="h-4 w-4 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Nationwide Delivery</p>
              <p className="text-xs text-muted-foreground">{deliveryDays} days</p>
            </div>
          </div>

          {/* Total */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Estimated Time</span>
              <span className="text-sm font-bold text-primary">
                {totalDaysMin}-{totalDaysMax} days
              </span>
            </div>
          </div>
        </div>

        {/* Rush Order Option */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              <Label htmlFor="rush-order" className="text-sm font-medium cursor-pointer">
                Rush Order
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[200px] text-xs">
                      Rush orders are prioritized and completed faster. 
                      Additional ₦{rushAdditionalCost.toLocaleString()} fee applies.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="rush-order"
              checked={rushOrder}
              onCheckedChange={handleRushToggle}
            />
          </div>
          {rushOrder && (
            <p className="text-xs text-accent mt-2">
              +₦{rushAdditionalCost.toLocaleString()} for priority processing
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryEstimate;
