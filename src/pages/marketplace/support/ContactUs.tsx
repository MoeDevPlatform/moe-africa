import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { supportService } from "@/lib/apiServices";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@moe.africa",
    description: "Get a response within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+234 800 MOE HELP",
    description: "Mon-Sat, 8AM-8PM WAT",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    value: "Chat with us",
    description: "Available 24/7",
  },
];

const ContactUs = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactMessage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supportService.submitContact({
        contactName: formData.contactName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactMessage: formData.contactMessage.trim(),
      });
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ contactName: "", contactEmail: "", contactMessage: "" });
    } catch (err: unknown) {
      toast({
        title: "Could not send message",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link 
          to="/marketplace/support/help"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Help Center
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl">
            We&apos;re here to help. Reach out to us through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Card key={method.title}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{method.title}</h3>
                        <p className="text-primary font-medium">{method.value}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Visit Us</h3>
                    <p className="text-sm text-muted-foreground">
                      MOE Headquarters<br />
                      Victoria Island, Lagos<br />
                      Nigeria
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Business Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday: 8AM - 8PM<br />
                      Saturday: 9AM - 6PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Your Name</Label>
                      <Input 
                        id="contact-name"
                        name="contactName"
                        data-contact-name=""
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email Address</Label>
                      <Input 
                        id="contact-email"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea 
                      id="contact-message"
                      name="contactMessage"
                      rows={5}
                      value={formData.contactMessage}
                      onChange={(e) => setFormData({ ...formData, contactMessage: e.target.value })}
                      placeholder="Describe your issue or question in detail..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    data-testid="contact-submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default ContactUs;
