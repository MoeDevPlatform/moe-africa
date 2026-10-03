import { CreditCard } from "lucide-react";
import HelpArticlePage from "./HelpArticlePage";

const PaymentsHelp = () => (
  <HelpArticlePage
    icon={CreditCard}
    title="Payments & Billing"
    description="Payment methods, refunds, and billing inquiries"
    sections={[
      {
        heading: "Accepted payment methods",
        body: "Details about the cards, bank transfers, and other payment options accepted on MOE will appear here.",
      },
      {
        heading: "Refunds & billing questions",
        body: "Information about refund timelines, invoices, and resolving billing issues will appear here.",
      },
    ]}
  />
);

export default PaymentsHelp;
