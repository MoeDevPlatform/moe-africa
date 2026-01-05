import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
          
          <p className="text-muted-foreground mb-8">
            Last updated: January 5, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using MOE Marketplace, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">2. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To access certain features, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Updating your information as needed</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">3. Orders and Payments</h2>
            <p className="text-muted-foreground mb-4">
              When you place an order on MOE Marketplace:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Prices are as displayed at the time of order</li>
              <li>Custom orders are subject to the artisan's specifications</li>
              <li>Payment must be completed before production begins</li>
              <li>Refunds are subject to our Return Policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">4. Artisan Responsibilities</h2>
            <p className="text-muted-foreground">
              Artisans on our platform are independent sellers. MOE Marketplace facilitates transactions 
              but is not responsible for the quality or delivery of individual artisan products beyond 
              our stated guarantees.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">5. Prohibited Activities</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Engage in fraudulent activities</li>
              <li>Interfere with the platform's operation</li>
              <li>Harass or abuse other users or artisans</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              MOE Marketplace shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages arising from your use of the platform, to the maximum extent permitted 
              by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">7. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the platform 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at legal@moemarketplace.com.
            </p>
          </section>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default TermsOfService;
