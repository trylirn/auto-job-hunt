import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(200),
  company: z.string().trim().min(2, "Company name is too short").max(150),
  location: z.string().trim().min(2, "Location is required").max(150),
  job_type: z.string().min(1, "Select a job type"),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  salary: z.string().trim().max(100).optional().or(z.literal("")),
  apply_url: z.string().trim().url("Must be a valid URL").max(500),
  description: z.string().trim().min(50, "Please provide at least 50 characters").max(10000),
  submitter_email: z.string().trim().email("Invalid email").max(255),
  is_remote: z.boolean(),
  listing_type: z.enum(["job", "opportunity"]),
});

const Submit = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "",
    category: "",
    salary: "",
    apply_url: "",
    description: "",
    submitter_email: "",
    is_remote: false,
    listing_type: "job" as "job" | "opportunity",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast({ title: "Please check the form", description: first, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const d = parsed.data;
    const { error } = await supabase.from("jobs").insert({
      title: d.title,
      company: d.company,
      location: d.location,
      job_type: d.job_type,
      category: d.category || null,
      salary: d.salary || null,
      apply_url: d.apply_url,
      url: d.apply_url,
      description: d.description,
      submitter_email: d.submitter_email,
      is_remote: d.is_remote,
      listing_type: d.listing_type,
      source: "user_submission",
      is_featured: false,
      payment_status: "free",
      posted_at: new Date().toISOString(),
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Job submitted!", description: "Your listing is now live." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Post a Job — Free | Eplicant</title>
        <meta name="description" content="Post a job for international development professionals — free, no account needed." />
        <link rel="canonical" href="https://eplicant.com/submit" />
        <meta property="og:title" content="Post a Job — Free | Eplicant" />
        <meta property="og:description" content="Post a job for international development professionals — free, no account needed." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eplicant.com/submit" />
      </Helmet>
      <Header />
      <main className="container max-w-2xl py-8 md:py-12">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Post a Job</h1>
            <p className="text-sm text-muted-foreground">Free for everyone — your listing goes live immediately.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 rounded-xl border bg-card p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Job title *</Label>
              <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Programme Officer" required />
            </div>
            <div>
              <Label htmlFor="company">Organisation *</Label>
              <Input id="company" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Acme Foundation" required />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Nairobi, Kenya" required />
            </div>
            <div>
              <Label htmlFor="job_type">Type *</Label>
              <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                <SelectTrigger id="job_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="listing_type">Listing</Label>
              <Select value={form.listing_type} onValueChange={(v) => update("listing_type", v as "job" | "opportunity")}>
                <SelectTrigger id="listing_type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="opportunity">Opportunity (fellowship/grant/etc.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Public Health" />
            </div>
            <div>
              <Label htmlFor="salary">Salary (optional)</Label>
              <Input id="salary" value={form.salary} onChange={(e) => update("salary", e.target.value)} placeholder="$60k–$80k" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="apply_url">Application URL *</Label>
              <Input id="apply_url" type="url" value={form.apply_url} onChange={(e) => update("apply_url", e.target.value)} placeholder="https://..." required />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <Checkbox id="is_remote" checked={form.is_remote} onCheckedChange={(v) => update("is_remote", !!v)} />
              <Label htmlFor="is_remote" className="cursor-pointer">This role is remote</Label>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Job description *</Label>
              <Textarea id="description" rows={8} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the role, responsibilities, requirements..." required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="submitter_email">Your email *</Label>
              <Input id="submitter_email" type="email" value={form.submitter_email} onChange={(e) => update("submitter_email", e.target.value)} placeholder="you@example.com" required />
              <p className="mt-1 text-xs text-muted-foreground">We'll only use this to contact you about your listing.</p>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Posting..." : "Post job for free"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Submit;
