import { MessageSquare } from "lucide-react";
import HelpArticlePage from "./HelpArticlePage";

const ContactArtisansHelp = () => (
  <HelpArticlePage
    icon={MessageSquare}
    title="Contact Artisans"
    description="How to message artisans and custom order inquiries"
    sections={[
      {
        heading: "Messaging an artisan",
        body: "Steps for starting a conversation with an artisan from their storefront or a product page will appear here.",
      },
      {
        heading: "Custom order inquiries",
        body: "Tips for requesting quotes, sharing measurements, and agreeing on timelines will appear here.",
      },
    ]}
  />
);

export default ContactArtisansHelp;
