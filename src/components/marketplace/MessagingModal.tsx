import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Mic, Paperclip, Check, CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isCustomer: boolean;
  type: "text" | "image" | "voice" | "file";
  attachmentUrl?: string;
  attachmentName?: string;
  read?: boolean;
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
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load conversation from localStorage
    const key = `conversation_${providerId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMessages(parsed.map((m: any) => ({ 
        ...m, 
        timestamp: new Date(m.timestamp),
        type: m.type || "text",
        read: m.read ?? true 
      })));
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

  const handleSendMessage = (type: "text" | "image" | "voice" | "file" = "text", attachmentUrl?: string, attachmentName?: string) => {
    if (type === "text" && !newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: "customer",
      senderName: "You",
      text: type === "text" ? newMessage : attachmentName || "",
      timestamp: new Date(),
      isCustomer: true,
      type,
      attachmentUrl,
      attachmentName,
      read: false,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate provider typing and response
    setIsTyping(true);
    setTimeout(() => {
      // Mark customer messages as read
      setMessages((prev) => prev.map((m) => m.isCustomer ? { ...m, read: true } : m));
    }, 1000);

    setTimeout(() => {
      setIsTyping(false);
      const autoReply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: providerId.toString(),
        senderName: providerName,
        text: "Thank you for your message! We'll get back to you shortly.",
        timestamp: new Date(),
        isCustomer: false,
        type: "text",
        read: true,
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 2500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleSendMessage("image", url, file.name);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleSendMessage("file", url, file.name);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice note
      handleSendMessage("voice", undefined, "Voice message (0:05)");
    } else {
      setIsRecording(true);
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        setIsRecording(false);
        handleSendMessage("voice", undefined, "Voice message (0:05)");
      }, 5000);
    }
  };

  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case "image":
        return (
          <div>
            <img 
              src={message.attachmentUrl} 
              alt="Shared image" 
              className="max-w-[200px] rounded-lg mb-1"
            />
            <p className="text-xs opacity-70">{message.attachmentName}</p>
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="text-sm">{message.text || "Voice message"}</span>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            <span className="text-sm underline">{message.attachmentName}</span>
          </div>
        );
      default:
        return <p className="text-sm">{message.text}</p>;
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
              <>
                {messages.map((message) => (
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
                        className={cn(
                          "rounded-2xl px-4 py-2",
                          message.isCustomer
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {renderMessageContent(message)}
                      </div>
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {message.isCustomer && (
                          <span className="text-xs text-muted-foreground">
                            {message.read ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary">
                        {providerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-background">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button 
              variant={isRecording ? "destructive" : "outline"} 
              size="icon" 
              className="shrink-0"
              onClick={handleVoiceRecord}
            >
              <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={() => handleSendMessage()} size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
