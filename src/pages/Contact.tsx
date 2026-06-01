import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Mail } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Contact — Eplicant</title>
      <meta name="description" content="Contact the Eplicant team for partnerships, feedback, or questions about jobs and opportunities in international development." />
      <link rel="canonical" href="https://eplicant.com/contact" />
      <meta property="og:title" content="Contact — Eplicant" />
      <meta property="og:description" content="Contact the Eplicant team for partnerships, feedback, or questions about jobs and opportunities in international development." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://eplicant.com/contact" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10">
      <h1 className="font-display text-3xl font-bold mb-6">Contact us</h1>
      <p className="text-muted-foreground mb-6">Have a question, partnership idea, or feedback? Reach out:</p>
      <a
        href="mailto:hello@eplicant.com"
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-3 hover:border-primary transition-colors"
      >
        <Mail className="h-5 w-5 text-primary" />
        hello@eplicant.com
      </a>
    </main>
    <Footer />
  </div>
);

export default Contact;
