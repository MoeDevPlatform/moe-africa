import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import MessagingModal from "@/components/marketplace/MessagingModal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface Conversation {
  providerId: number;
  providerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<{ id: number; name: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load conversations from localStorage
    const saved = localStorage.getItem("conversations");
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
    }
  }, [selectedProvider]); // Reload when modal closes

  const handleOpenConversation = (providerId: number, providerName: string) => {
    setSelectedProvider({ id: providerId, name: providerName });
    
    // Mark as read
    const updated = conversations.map((c) =>
      c.providerId === providerId ? { ...c, unread: false } : c
    );
    setConversations(updated);
    localStorage.setItem("conversations", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">
              Your conversations with service providers
            </p>
          </div>

          {conversations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">No messages yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a conversation with a service provider to see it here
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations
                .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
                .map((conversation) => (
                  <Card
                    key={conversation.providerId}
                    className="p-4 hover:border-primary cursor-pointer transition-all"
                    onClick={() => handleOpenConversation(conversation.providerId, conversation.providerName)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conversation.providerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">{conversation.providerName}</h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(conversation.lastMessageTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unread && (
                        <Badge variant="default" className="shrink-0">New</Badge>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>

      <MarketplaceFooter />

      {selectedProvider && (
        <MessagingModal
          open={!!selectedProvider}
          onOpenChange={(open) => !open && setSelectedProvider(null)}
          providerId={selectedProvider.id}
          providerName={selectedProvider.name}
        />
      )}
    </div>
  );
};

export default Messages;
