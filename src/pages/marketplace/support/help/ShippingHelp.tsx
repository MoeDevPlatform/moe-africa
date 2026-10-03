import { Truck } from "lucide-react";
import HelpArticlePage from "./HelpArticlePage";

const ShippingHelp = () => (
  <HelpArticlePage
    icon={Truck}
    title="Shipping & Delivery"
    description="Delivery times, shipping costs, and international orders"
    sections={[
      {
        heading: "Delivery times",
        body: "Guidance on how long made-to-order and ready-to-wear items take to arrive will appear here.",
      },
      {
        heading: "Shipping costs & international orders",
        body: "Information about shipping fees, supported regions, and customs will appear here.",
      },
    ]}
  />
);

export default ShippingHelp;
