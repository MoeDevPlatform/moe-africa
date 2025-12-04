import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import Footer from "@/components/marketplace/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Shield, 
  Bell, 
  Settings as SettingsIcon, 
  Heart,
  MapPin,
  CreditCard,
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [notificationSettings, setNotificationSettings] = useState({
    inApp: true,
    email: true,
    sms: false,
    push: true,
    orderUpdates: true,
    promotions: false,
    wishlistAlerts: true,
    newMessages: true,
  });

  const handleToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="account" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Addresses</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2 flex-1 min-w-[120px]">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Info */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Manage your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="john.doe@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+234 801 234 5678" />
                </div>
                <Button className="w-full sm:w-auto">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <Button className="w-full sm:w-auto">Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Notification Center */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Center
                  </CardTitle>
                  <CardDescription>
                    Your recent notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>In-app notifications</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>SMS alerts</span>
                    <Badge variant="outline">Set up</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Email confirmations</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Delivery Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">In-App Notifications</p>
                            <p className="text-xs text-muted-foreground">Get notified within the app</p>
                          </div>
                        </div>
                        <Switch 
                          checked={notificationSettings.inApp}
                          onCheckedChange={() => handleToggle('inApp')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Receive updates via email</p>
                          </div>
                        </div>
                        <Switch 
                          checked={notificationSettings.email}
                          onCheckedChange={() => handleToggle('email')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">SMS Alerts</p>
                            <p className="text-xs text-muted-foreground">Get text message updates</p>
                          </div>
                        </div>
                        <Switch 
                          checked={notificationSettings.sms}
                          onCheckedChange={() => handleToggle('sms')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">Push Notifications</p>
                            <p className="text-xs text-muted-foreground">Browser push notifications</p>
                          </div>
                        </div>
                        <Switch 
                          checked={notificationSettings.push}
                          onCheckedChange={() => handleToggle('push')}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Notification Types</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Order Updates</p>
                          <p className="text-xs text-muted-foreground">Status changes, delivery info</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.orderUpdates}
                          onCheckedChange={() => handleToggle('orderUpdates')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Promotions & Deals</p>
                          <p className="text-xs text-muted-foreground">Special offers and discounts</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.promotions}
                          onCheckedChange={() => handleToggle('promotions')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Wishlist Alerts</p>
                          <p className="text-xs text-muted-foreground">Price drops and availability</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.wishlistAlerts}
                          onCheckedChange={() => handleToggle('wishlistAlerts')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">New Messages</p>
                          <p className="text-xs text-muted-foreground">Chat messages from artisans</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.newMessages}
                          onCheckedChange={() => handleToggle('newMessages')}
                        />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full sm:w-auto">Save Preferences</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Addresses */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Saved Addresses
                </CardTitle>
                <CardDescription>
                  Manage your delivery addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">Home</p>
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        15 Marina Road, Victoria Island<br />
                        Lagos, Nigeria
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium mb-1">Office</p>
                      <p className="text-sm text-muted-foreground">
                        45 Broad Street, Lagos Island<br />
                        Lagos, Nigeria
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your payment options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-muted rounded flex items-center justify-center text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your payment information is securely stored and encrypted.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;