import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import PreferenceModal from "@/components/marketplace/PreferenceModal";
import MarketplaceFooter from "@/components/marketplace/Footer";

const Landing = () => {
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-4xl">
          <img src={logo} alt="MOE" className="h-24 md:h-32 w-auto mx-auto mb-8" />
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
            Discover Africa's Best
            <br />
            <span className="bg-gradient-warm bg-clip-text text-transparent">
              Custom Creations
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Connect with skilled artisans for tailor-made clothing, handcrafted shoes, 
            bespoke furniture, and authentic African craftsmanship.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => setShowPreferences(true)}
            className="bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-12 py-6 h-auto"
          >
            Let's Go
          </Button>
        </div>
      </main>

      <MarketplaceFooter />
      
      <PreferenceModal 
        open={showPreferences} 
        onOpenChange={setShowPreferences}
      />
    </div>
  );
};

export default Landing;
