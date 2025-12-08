import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const faqCategories = [
  {
    title: "Orders & Delivery",
    faqs: [
      {
        question: "How long does delivery take?",
        answer: "Delivery times vary depending on the artisan and product. Custom-made items typically take 5-14 days to create, plus 2-5 days for delivery within Nigeria. International orders may take longer. You can see estimated delivery times on each product page.",
      },
      {
        question: "Can I track my order?",
        answer: "Yes! Once your order is shipped, you'll receive a tracking number via email and SMS. You can also track your order status in your account under 'My Orders'.",
      },
      {
        question: "What if my order is delayed?",
        answer: "If your order is taking longer than expected, please contact the artisan through the messaging feature or reach out to our support team. We'll work to resolve any delays as quickly as possible.",
      },
    ],
  },
  {
    title: "Payments",
    faqs: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept bank transfers, debit/credit cards (Visa, Mastercard), mobile money, and Paystack. All payments are processed securely through our payment partners.",
      },
      {
        question: "Is my payment information secure?",
        answer: "Absolutely. We use industry-standard SSL encryption and never store your full card details. All transactions are processed through PCI-compliant payment providers.",
      },
      {
        question: "Can I pay in installments?",
        answer: "Currently, we don't offer installment payments. However, we're working on adding this feature soon. Stay tuned for updates!",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    faqs: [
      {
        question: "What is your return policy?",
        answer: "Custom-made items are generally non-refundable as they're made specifically for you. However, if there's a quality issue or the item doesn't match your specifications, we'll work with the artisan to make it right. Ready-to-wear items can be returned within 7 days of delivery.",
      },
      {
        question: "How do I request a refund?",
        answer: "To request a refund, go to 'My Orders', select the order, and click 'Request Refund'. Our team will review your request and respond within 2-3 business days.",
      },
      {
        question: "How long do refunds take?",
        answer: "Once approved, refunds are processed within 5-10 business days. The time it takes to appear in your account depends on your bank or payment provider.",
      },
    ],
  },
  {
    title: "Custom Orders",
    faqs: [
      {
        question: "How do custom orders work?",
        answer: "When you place a custom order, you'll provide your measurements, preferences, and any specific requirements. The artisan will create your item from scratch based on your specifications. You can communicate directly with the artisan throughout the process.",
      },
      {
        question: "Can I request changes to my custom order?",
        answer: "Minor changes can usually be accommodated if requested early in the production process. Contact the artisan as soon as possible if you need modifications. Major changes may affect pricing and delivery time.",
      },
      {
        question: "What if my custom order doesn't fit?",
        answer: "If your custom item doesn't fit despite providing accurate measurements, contact the artisan immediately. Many artisans offer alterations for custom pieces. We'll work with you to find a solution.",
      },
    ],
  },
  {
    title: "Account & Privacy",
    faqs: [
      {
        question: "How do I create an account?",
        answer: "Click 'Sign In' in the top right corner, then select 'Create Account'. You can sign up with your email address or phone number.",
      },
      {
        question: "How is my personal information protected?",
        answer: "We take privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties without your consent. Read our Privacy Policy for more details.",
      },
      {
        question: "How do I delete my account?",
        answer: "To delete your account, go to Settings > Account > Delete Account. Note that this action is permanent and will remove all your order history and saved information.",
      },
    ],
  },
];

const FAQs = () => {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Link */}
        <Link 
          to="/marketplace/support/help"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Help Center
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-2xl">
            Find answers to the most common questions about shopping on MOE
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category) => (
            <div key={category.title}>
              <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`${category.title}-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 p-6 bg-muted/50 rounded-xl text-center">
          <h3 className="font-semibold mb-2">Didn't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is happy to help
          </p>
          <Link 
            to="/marketplace/support/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default FAQs;
