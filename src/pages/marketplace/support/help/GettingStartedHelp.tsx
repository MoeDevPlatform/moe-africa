import { BookOpen } from "lucide-react";
import HelpArticlePage from "./HelpArticlePage";

const GettingStartedHelp = () => (
  <HelpArticlePage
    icon={BookOpen}
    title="Getting Started"
    description="New to MOE? Learn how to browse, order, and customize"
    sections={[
      {
        heading: "Creating your account",
        body: "A walkthrough of signing up as a customer or artisan and setting up your profile will appear here.",
      },
      {
        heading: "Browsing, ordering & customizing",
        body: "An introduction to finding artisans, placing orders, and requesting customizations will appear here.",
      },
    ]}
  />
);

export default GettingStartedHelp;
