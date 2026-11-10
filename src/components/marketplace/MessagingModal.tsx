import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ChatThread from "@/components/marketplace/ChatThread";

interface MessagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: number;
  providerName: string;
}

/**
 * Product-page / CTA messaging dialog. Voice notes, attachments, and delivery
 * status are handled by the shared ChatThread surface.
 */
const MessagingModal = ({
  open,
  onOpenChange,
  providerId,
  providerName,
}: MessagingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b space-y-0">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {providerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>Re: {providerName}</DialogTitle>
              <p className="text-xs text-muted-foreground">Replies from MoE Support</p>
              <p className="text-sm text-muted-foreground">Service Provider</p>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ChatThread
            providerId={providerId}
            providerName={providerName}
            embedded
            compact
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;
