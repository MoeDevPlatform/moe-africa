import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

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
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl">
            We're here to help. Reach out to us through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
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

            {/* Office Info */}
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

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Order Issue</SelectItem>
                        <SelectItem value="payment">Payment Question</SelectItem>
                        <SelectItem value="refund">Refund Request</SelectItem>
                        <SelectItem value="artisan">Artisan Inquiry</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your issue or question in detail..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    <Send className="h-4 w-4 mr-2" />
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
