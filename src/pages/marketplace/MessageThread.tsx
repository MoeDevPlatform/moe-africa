import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ChatThread from "@/components/marketplace/ChatThread";
import { Button } from "@/components/ui/button";
import { messagingService } from "@/lib/apiServices";

/**
 * Dedicated chat route.
 * Resolves provider via GET /conversations/:id, list fallback, or query params.
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
  const [emptyHint, setEmptyHint] = useState(false);

  const numericConversationId = conversationId ? Number(conversationId) : NaN;

  useEffect(() => {
    if (queryProviderId) {
      setIsLoading(false);
      setNotFound(false);
      return;
    }
    if (!Number.isFinite(numericConversationId) || numericConversationId <= 0) {
      // Route used without a real conversation — show empty guidance, not a hard error.
      setEmptyHint(true);
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);
    setEmptyHint(false);

    (async () => {
      let resolved = false;
      try {
        const one = await messagingService.getConversation(numericConversationId);
        if (!cancelled && one?.providerId) {
          setProviderId(one.providerId);
          setProviderName(one.providerName || one.artisanName || "Artisan");
          resolved = true;
        }
      } catch {
        /* fall through to the inbox list */
      }
      if (!resolved && !cancelled) {
        try {
          const res = await messagingService.listConversations();
          const match = (res?.data ?? []).find((c) => c.id === numericConversationId);
          if (!cancelled && match?.providerId) {
            setProviderId(match.providerId);
            setProviderName(match.providerName || "Artisan");
            resolved = true;
          }
        } catch {
          /* show the unavailable state below */
        }
      }
      if (!cancelled) {
        if (!resolved) setNotFound(true);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
        ) : emptyHint ? (
          <div className="py-16 text-center space-y-4" data-testid="messages-empty-thread">
            <p className="text-muted-foreground">
              No conversation selected. Open your inbox to start or continue a chat.
            </p>
            <Button onClick={() => navigate("/marketplace/messages")}>Go to Messages</Button>
          </div>
        ) : notFound || !providerId ? (
          <div className="py-16 text-center space-y-4" data-testid="conversation-not-found">
            <p className="text-muted-foreground">
              This conversation isn’t available. It may have been removed, or you may not have
              access.
            </p>
            <Button variant="outline" onClick={() => navigate("/marketplace/messages")}>
              Return to inbox
            </Button>
          </div>
        ) : (
          <ChatThread
            providerId={providerId}
            providerName={providerName || "Artisan"}
            initialConversationId={
              Number.isFinite(numericConversationId) && numericConversationId > 0
                ? numericConversationId
                : undefined
            }
          />
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default MessageThread;
