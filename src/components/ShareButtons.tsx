import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  title: string;
  company: string;
  jobUrl: string;
  location?: string | null;
  jobType?: string | null;
  salary?: string | null;
}

function buildShareText({ title, company, location, jobType, salary }: Omit<ShareButtonsProps, "jobUrl">) {
  let text = `🚀 Hiring: ${title} at ${company}`;
  const details: string[] = [];
  if (location) details.push(location);
  if (jobType) details.push(jobType);
  if (salary) details.push(salary);
  if (details.length) text += ` | ${details.join(" | ")}`;
  return text;
}

export const ShareButtons = ({ title, company, jobUrl, location, jobType, salary }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareText({ title, company, location, jobType, salary });
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(jobUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n\nApply here: ${jobUrl}`);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        <Share2 className="h-4 w-4" /> Share:
      </span>

      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://wa.me/?text=${encodedText}%0A%0AApply%20here%3A%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </Button>

      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </Button>

      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          X / Twitter
        </a>
      </Button>

      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
};
