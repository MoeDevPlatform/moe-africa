import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, Upload, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";

const ReportIssue = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    issueType: "",
    orderNumber: "",
    urgency: "normal",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Report Submitted",
      description: "We'll investigate and respond within 24-48 hours.",
    });
    setFormData({ issueType: "", orderNumber: "", urgency: "normal", description: "" });
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Report an Issue</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Having a problem? Let us know and we'll help resolve it as quickly as possible.
          </p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Issue Type */}
                <div className="space-y-2">
                  <Label>What type of issue are you reporting?</Label>
                  <Select 
                    value={formData.issueType}
                    onValueChange={(value) => setFormData({ ...formData, issueType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order-not-received">Order Not Received</SelectItem>
                      <SelectItem value="wrong-item">Received Wrong Item</SelectItem>
                      <SelectItem value="damaged">Item Damaged</SelectItem>
                      <SelectItem value="quality">Quality Issue</SelectItem>
                      <SelectItem value="sizing">Sizing/Fit Issue</SelectItem>
                      <SelectItem value="payment">Payment Problem</SelectItem>
                      <SelectItem value="artisan">Issue with Artisan</SelectItem>
                      <SelectItem value="website">Website/App Problem</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Number */}
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number (if applicable)</Label>
                  <Input 
                    id="orderNumber"
                    placeholder="e.g., MOE-123456"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  />
                </div>

                {/* Urgency */}
                <div className="space-y-3">
                  <Label>How urgent is this issue?</Label>
                  <RadioGroup 
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="font-normal cursor-pointer">
                        Low - Can wait a few days
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="font-normal cursor-pointer">
                        Normal - Within 24-48 hours
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="font-normal cursor-pointer">
                        High - Need immediate attention
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Describe the issue</Label>
                  <Textarea 
                    id="description" 
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                    required
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Attach Photos (optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default ReportIssue;
