import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ChatThread from "@/components/marketplace/ChatThread";
import { messagingService } from "@/lib/apiServices";

/**
 * Dedicated chat route — Issue #4.
 * Resolves provider info from the conversation id (server-side) or from
 * `?providerId=&providerName=` query params (fallback for local-only threads).
 */
const MessageThread = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryProviderId = Number(searchParams.get("providerId")) || null;
  const queryProviderName = searchParams.get("providerName") || "";

  const [providerId, setProviderId] = useState<number | null>(queryProviderId);
  const [providerName, setProviderName] = useState<string>(queryProviderName);
  const [isLoading, setIsLoading] = useState(!queryProviderId);
  const [notFound, setNotFound] = useState(false);

  const numericConversationId = conversationId ? Number(conversationId) : NaN;

  useEffect(() => {
    if (queryProviderId) {
      setIsLoading(false);
      return;
    }
    if (!Number.isFinite(numericConversationId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    messagingService
      .listConversations()
      .then((res) => {
        if (cancelled) return;
        const match = (res?.data ?? []).find((c) => c.id === numericConversationId);
        if (match) {
          setProviderId(match.providerId);
          setProviderName(match.providerName);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [numericConversationId, queryProviderId]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <button
          onClick={() => navigate("/marketplace/messages")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          aria-label="Back to messages"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to messages
        </button>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">Loading conversation…</div>
        ) : notFound || !providerId ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground mb-4">Conversation not found.</p>
            <button
              onClick={() => navigate("/marketplace/messages")}
              className="text-primary hover:underline"
            >
              Return to inbox
            </button>
          </div>
        ) : (
          <ChatThread
            providerId={providerId}
            providerName={providerName || "Artisan"}
            initialConversationId={Number.isFinite(numericConversationId) ? numericConversationId : undefined}
          />
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default MessageThread;