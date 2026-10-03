import { Link } from "react-router-dom";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

interface HelpArticlePageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short placeholder sections — ready to be filled with real content. */
  sections: { heading: string; body: string }[];
}

/**
 * Shared layout for dedicated Help Center topic pages
 * (/help/payments, /help/shipping, /help/contact-artisans, /help/getting-started).
 */
const HelpArticlePage = ({ icon: Icon, title, description, sections }: HelpArticlePageProps) => (
  <div className="min-h-screen bg-background">
    <MarketplaceNavbar />

    <main className="container mx-auto px-4 py-8 md:py-12">
      <Link
        to="/marketplace/support/help"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Help Center
      </Link>

      <div className="text-center mb-10 max-w-2xl mx-auto">
        <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {sections.map((section) => (
          <Card key={section.heading}>
            <CardContent className="p-6 md:p-8">
              <h2 className="font-semibold text-lg mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>

    <MarketplaceFooter />
  </div>
);

export default HelpArticlePage;
