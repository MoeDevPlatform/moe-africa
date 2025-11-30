import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isCustomer: boolean;
}

interface MessagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  providerName: string;
}

const MessagingModal = ({
  open,
  onOpenChange,
  providerId,
  providerName,
}: MessagingModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load conversation from localStorage
    const key = `conversation_${providerId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  }, [providerId]);

  useEffect(() => {
    // Save conversation to localStorage
    if (messages.length > 0) {
      const key = `conversation_${providerId}`;
      localStorage.setItem(key, JSON.stringify(messages));
      
      // Also save to conversations list
      const conversations = JSON.parse(localStorage.getItem("conversations") || "[]");
      const existingIndex = conversations.findIndex((c: any) => c.providerId === providerId);
      const lastMessage = messages[messages.length - 1];
      
      const conversationData = {
        providerId,
        providerName,
        lastMessage: lastMessage.text,
        lastMessageTime: lastMessage.timestamp,
        unread: !lastMessage.isCustomer,
      };

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversationData;
      } else {
        conversations.push(conversationData);
      }
      
      localStorage.setItem("conversations", JSON.stringify(conversations));
    }
  }, [messages, providerId, providerName]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: "customer",
      senderName: "You",
      text: newMessage,
      timestamp: new Date(),
      isCustomer: true,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate provider response (for demo)
    setTimeout(() => {
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: providerId.toString(),
        senderName: providerName,
        text: "Thank you for your message! We'll get back to you shortly.",
        timestamp: new Date(),
        isCustomer: false,
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {providerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{providerName}</DialogTitle>
              <p className="text-sm text-muted-foreground">Service Provider</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.isCustomer ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.isCustomer ? "bg-secondary" : "bg-primary"}>
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[70%] ${message.isCustomer ? "items-end" : ""}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.isCustomer
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground px-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-background">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
