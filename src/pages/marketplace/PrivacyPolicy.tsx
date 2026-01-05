import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-4xl font-display font-bold mb-8">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-8">
            Last updated: January 5, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us for support. This may include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name and contact information</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information</li>
              <li>Order history and preferences</li>
              <li>Communications with artisans</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders</li>
              <li>Personalize your shopping experience</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our platform and services</li>
              <li>Detect and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We share your information with artisans to fulfill your orders, with payment processors 
              to complete transactions, and with shipping partners to deliver your purchases. We do not 
              sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">5. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at 
              privacy@moemarketplace.com or through our Contact Us page.
            </p>
          </section>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default PrivacyPolicy;
