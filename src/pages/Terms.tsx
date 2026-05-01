import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Terms of Service — Eplicant</title>
      <meta name="description" content="Eplicant terms of service." />
      <link rel="canonical" href="https://eplicant.com/terms" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="font-display text-xl font-semibold mt-6">1. Acceptance of Terms</h2>
      <p>By accessing Eplicant ("the Service"), you agree to be bound by these Terms. If you do not agree, please do not use the Service.</p>

      <h2 className="font-display text-xl font-semibold mt-6">2. Use of the Service</h2>
      <p>Eplicant aggregates publicly listed jobs and opportunities. You may browse listings and apply via external links provided by employers. You must not scrape, redistribute, or misuse content from the Service.</p>

      <h2 className="font-display text-xl font-semibold mt-6">3. Paid Listings</h2>
      <p>Employers may submit a paid listing (currently $195) for a 30-day featured placement. Once payment is processed, listings are non-refundable. Eplicant reserves the right to remove any listing that violates these Terms or applicable law.</p>

      <h2 className="font-display text-xl font-semibold mt-6">4. Disclaimer</h2>
      <p>Listings are provided "as is". Eplicant does not guarantee accuracy, availability, or outcomes from applications. Always verify information independently before applying or sharing personal data.</p>

      <h2 className="font-display text-xl font-semibold mt-6">5. Limitation of Liability</h2>
      <p>Eplicant is not liable for any direct, indirect, incidental, or consequential damages arising from use of the Service.</p>

      <h2 className="font-display text-xl font-semibold mt-6">6. Changes</h2>
      <p>We may update these Terms at any time. Continued use of the Service constitutes acceptance of the revised Terms.</p>

      <h2 className="font-display text-xl font-semibold mt-6">7. Contact</h2>
      <p>Questions? Reach us via the <a href="/contact" className="text-primary">contact page</a>.</p>
    </main>
    <Footer />
  </div>
);

export default Terms;
