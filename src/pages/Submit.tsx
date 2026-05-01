import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, X } from "lucide-react";

const schema = z.object({
  listing_type: z.enum(["job", "opportunity"]),
  company: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20).max(20000),
  tags: z.array(z.string().min(1).max(30)).max(10),
  location: z.string().trim().min(1).max(80),
  work_arrangement: z.enum(["On-site", "Hybrid", "Remote"]),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  salary_currency: z.string().optional(),
  salary_period: z.string().optional(),
  company_logo: z.string().url().optional().or(z.literal("")),
  apply_method: z.enum(["url", "email"]),
  apply_url: z.string().url().optional().or(z.literal("")),
  apply_email: z.string().email().optional().or(z.literal("")),
  submitter_email: z.string().email(),
});

const Submit = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({
    listing_type: "job" as "job" | "opportunity",
    company: "",
    title: "",
    description: "",
    tags: [] as string[],
    location: "",
    work_arrangement: "Remote" as "On-site" | "Hybrid" | "Remote",
    salary_min: "",
    salary_max: "",
    salary_currency: "USD",
    salary_period: "Per Year",
    company_logo: "",
    apply_method: "url" as "url" | "email",
    apply_url: "",
    apply_email: "",
    submitter_email: "",
  });

  const update = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t) || form.tags.length >= 10) return;
    update("tags", [...form.tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => update("tags", form.tags.filter((x) => x !== t));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("company-logos").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
      update("company_logo", data.publicUrl);
      toast({ title: "Logo uploaded" });
    } catch (err) {
      console.error(err);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast({ title: "Check the form", description: `${first.path.join(".")}: ${first.message}`, variant: "destructive" });
      return;
    }
    if (form.apply_method === "url" && !form.apply_url) {
      toast({ title: "Apply URL required", variant: "destructive" });
      return;
    }
    if (form.apply_method === "email" && !form.apply_email) {
      toast({ title: "Apply email required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-submission-checkout", {
        body: {
          ...form,
          salary_min: form.salary_min ? Number(form.salary_min) : null,
          salary_max: form.salary_max ? Number(form.salary_max) : null,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Could not start checkout", description: (err as Error).message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Post a Job — Featured for 30 days · Eplicant</title>
        <meta name="description" content="Post your job or opportunity on Eplicant. $195 for 30 days featured placement. No account needed." />
        <link rel="canonical" href="https://eplicant.com/submit" />
      </Helmet>
      <Header />
      <main className="container max-w-3xl py-8">
        <div className="mb-6">
          <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 gap-1 mb-3">
            <Sparkles className="h-3 w-3" /> Featured for 30 days
          </Badge>
          <h1 className="font-display text-3xl font-bold">Post a job or opportunity</h1>
          <p className="text-muted-foreground mt-1">
            One-time payment of <strong>$195</strong>. Your listing appears at the top for 30 days. No account required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <Label>Listing type *</Label>
                <RadioGroup
                  value={form.listing_type}
                  onValueChange={(v) => update("listing_type", v)}
                  className="flex gap-4 mt-2"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="job" id="t-job" /> Job
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="opportunity" id="t-opp" /> Opportunity
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="company">Company / Organization name *</Label>
                <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} maxLength={120} required />
                <p className="text-xs text-muted-foreground mt-1">Brand/trade name without Inc., Ltd., B.V., Pte., etc.</p>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={120} required />
                <p className="text-xs text-muted-foreground mt-1">A single position like "Machine Learning Engineer", not a sentence.</p>
              </div>

              <div>
                <Label>Tags / Keywords / Stack *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Type a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    maxLength={30}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1">
                        {t}
                        <button type="button" onClick={() => removeTag(t)}><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input id="location" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. United States, Nigeria, Worldwide" maxLength={80} required />
              </div>

              <div>
                <Label>Work arrangement</Label>
                <RadioGroup
                  value={form.work_arrangement}
                  onValueChange={(v) => update("work_arrangement", v)}
                  className="flex gap-4 mt-2"
                >
                  {["On-site", "Hybrid", "Remote"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value={v} id={`wa-${v}`} /> {v}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Salary range (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Listings with salary info receive significantly more applications.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input placeholder="Min" type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)} />
                  <Input placeholder="Max" type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)} />
                  <Select value={form.salary_currency} onValueChange={(v) => update("salary_currency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "JPY", "INR", "SGD"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={form.salary_period} onValueChange={(v) => update("salary_period", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Per Year">Per Year</SelectItem>
                      <SelectItem value="Per Month">Per Month</SelectItem>
                      <SelectItem value="Per Hour">Per Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="logo">Company logo (optional, max 2MB)</Label>
                <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} disabled={logoUploading} />
                {form.company_logo && (
                  <img src={form.company_logo} alt="Logo preview" className="mt-2 h-12 w-12 rounded-lg border object-contain" />
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={10}
                  maxLength={20000}
                  required
                  placeholder="Describe the role/opportunity, responsibilities, requirements, benefits..."
                />
              </div>

              <div>
                <Label>How should candidates apply? *</Label>
                <RadioGroup
                  value={form.apply_method}
                  onValueChange={(v) => update("apply_method", v)}
                  className="flex gap-4 mt-2"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="url" id="ap-url" /> Apply Link
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <RadioGroupItem value="email" id="ap-email" /> Apply Email
                  </label>
                </RadioGroup>
                {form.apply_method === "url" ? (
                  <div className="mt-3">
                    <Input placeholder="https://..." type="url" value={form.apply_url} onChange={(e) => update("apply_url", e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Apply URLs with a form receive more applicants.</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Input placeholder="apply@company.com" type="email" value={form.apply_email} onChange={(e) => update("apply_email", e.target.value)} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="invoice">Invoice email *</Label>
                <Input
                  id="invoice"
                  type="email"
                  value={form.submitter_email}
                  onChange={(e) => update("submitter_email", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">We send the invoice and edit link here. Make sure it's accessible.</p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting || logoUploading}>
            {submitting ? "Redirecting to checkout..." : "Continue to payment — $195"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your listing publishes automatically once payment is confirmed.
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Submit;
