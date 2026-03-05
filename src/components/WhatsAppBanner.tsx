import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBrMe45a23vftujJO22";

export const WhatsAppBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={WHATSAPP_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,40%)] text-white shadow-lg hover:bg-[hsl(142,70%,35%)] transition-colors"
              aria-label="Join us on WhatsApp for instant job alerts"
            >
              <MessageCircle className="h-6 w-6" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDismissed(true);
                }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </a>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Join us on WhatsApp for instant job alerts</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
