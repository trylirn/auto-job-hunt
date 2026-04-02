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
  cleanDescription?: string | null;
}

function extractResponsibilities(html: string | null | undefined): string[] {
  if (!html) return [];
  // Look for content after "Key Responsibilities" or "Requirements" headings
  const sectionRegex = /<h3>(?:Key Responsibilities|Responsibilities)<\/h3>\s*([\s\S]*?)(?=<h3>|$)/i;
  const match = html.match(sectionRegex);
  if (!match) return [];
  // Extract list items
  const liRegex = /<li>(.*?)<\/li>/gi;
  const items: string[] = [];
  let liMatch;
  while ((liMatch = liRegex.exec(match[1])) !== null && items.length < 4) {
    const text = liMatch[1].replace(/<[^>]+>/g, "").trim();
    if (text) items.push(text);
  }
  return items;
}

function extractDeadline(html: string | null | undefined): string | null {
  if (!html) return null;
  const deadlineRegex = /<h3>(?:Deadline|Application Deadline)<\/h3>\s*([\s\S]*?)(?=<h3>|$)/i;
  const match = html.match(deadlineRegex);
  if (!match) return null;
  const text = match[1].replace(/<[^>]+>/g, "").trim();
  return text.length > 100 ? text.slice(0, 100) : text || null;
}

function buildShareText({ title, company, location, jobType, salary }: Omit<ShareButtonsProps, "jobUrl" | "cleanDescription">) {
  let text = `🚀 Hiring: ${title} at ${company}`;
  const details: string[] = [];
  if (location) details.push(location);
  if (jobType) details.push(jobType);
  if (salary) details.push(salary);
  if (details.length) text += ` | ${details.join(" | ")}`;
  return text;
}

function buildRichCopyText({ title, company, jobUrl, location, salary, cleanDescription }: ShareButtonsProps) {
  let text = `${company} is on the lookout for a ${title}. Apply now!\n\n`;
  text += `🔗 Link: ${jobUrl}\n`;
  if (salary) text += `💰 Salary: ${salary}\n`;
  if (location) text += `📍 Location: ${location}\n`;

  const deadline = extractDeadline(cleanDescription);
  if (deadline) text += `⏰ Deadline: ${deadline}\n`;

  const responsibilities = extractResponsibilities(cleanDescription);
  if (responsibilities.length > 0) {
    text += `\nSummary of Key Responsibilities:\n`;
    responsibilities.forEach((r) => {
      text += `→ ${r}\n`;
    });
  }

  text += `\n🧑‍💼 Share this with your network or tag someone who might benefit.\n`;
  text += `\nFollow Eplicant for verified opportunities.`;
  return text;
}

export const ShareButtons = ({ title, company, jobUrl, location, jobType, salary, cleanDescription }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const richText = buildRichCopyText({ title, company, jobUrl, location, jobType, salary, cleanDescription });
  const encodedRichText = encodeURIComponent(richText);
  const encodedUrl = encodeURIComponent(jobUrl);

  // Condensed version for X/Twitter (280 char limit)
  const twitterText = (() => {
    let t = `🚀 Hiring: ${title} at ${company}`;
    if (location) t += ` | 📍 ${location}`;
    if (salary) t += ` | 💰 ${salary}`;
    t += `\n\nApply now 👇`;
    return t.slice(0, 250); // leave room for URL
  })();
  const encodedTwitterText = encodeURIComponent(twitterText);

  const handleCopy = async () => {
    const richText = buildRichCopyText({ title, company, jobUrl, location, jobType, salary, cleanDescription });
    await navigator.clipboard.writeText(richText);
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
          href={`https://wa.me/?text=${encodedRichText}`}
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
