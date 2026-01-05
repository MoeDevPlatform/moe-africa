import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-4xl font-display font-bold mb-8">Cookie Policy</h1>
          
          <p className="text-muted-foreground mb-8">
            Last updated: January 5, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mb-2 mt-6">Essential Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies are necessary for the website to function properly. They enable basic 
              functions like page navigation, secure areas access, and shopping cart functionality.
            </p>

            <h3 className="text-xl font-semibold mb-2">Preference Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies remember your preferences such as language settings, location preferences, 
              and personalization choices to enhance your browsing experience.
            </p>

            <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
            <p className="text-muted-foreground mb-4">
              We use analytics cookies to understand how visitors interact with our website. This helps 
              us improve our services and user experience.
            </p>

            <h3 className="text-xl font-semibold mb-2">Marketing Cookies</h3>
            <p className="text-muted-foreground">
              These cookies track your online activity to help advertisers deliver more relevant 
              advertising. We only use these with your consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Through your browser settings - most browsers allow you to refuse or accept cookies</li>
              <li>Through our cookie consent banner when you first visit our site</li>
              <li>By contacting us to update your preferences</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Note: Disabling certain cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground">
              Some cookies on our site are placed by third parties such as payment processors, 
              analytics providers, and social media platforms. These third parties have their own 
              privacy policies governing the use of these cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">Updates to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time. We will notify you of any significant 
              changes by posting a notice on our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about our use of cookies, please contact us at 
              privacy@moemarketplace.com.
            </p>
          </section>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default CookiePolicy;
