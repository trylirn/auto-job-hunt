import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029VbBrMe45a23vftujJO22";

export const WhatsAppBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
      <div className="bg-[hsl(142,70%,40%)] text-white">
        <div className="container flex items-center justify-between gap-3 py-2.5 px-4">
          <a
            href={WHATSAPP_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium hover:underline"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Join us on WhatsApp for instant job alerts
          </a>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
