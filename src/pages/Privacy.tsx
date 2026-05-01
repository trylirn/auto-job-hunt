import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Privacy Policy — Eplicant</title>
      <meta name="description" content="Eplicant privacy policy." />
      <link rel="canonical" href="https://eplicant.com/privacy" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="font-display text-xl font-semibold mt-6">Information we collect</h2>
      <ul>
        <li>Email addresses provided when you subscribe to the newsletter.</li>
        <li>Submission information (company name, listing details, contact email) when you post a paid listing.</li>
        <li>Standard log data such as IP address and browser type.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">How we use it</h2>
      <ul>
        <li>To deliver the newsletter and product updates.</li>
        <li>To process payments and publish your listing.</li>
        <li>To improve and secure the Service.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-6">Sharing</h2>
      <p>We do not sell your data. We share limited data with payment processors (Stripe) and email providers strictly to operate the Service.</p>

      <h2 className="font-display text-xl font-semibold mt-6">Your rights</h2>
      <p>You may request deletion of your data at any time by emailing us via the contact page.</p>

      <h2 className="font-display text-xl font-semibold mt-6">Cookies</h2>
      <p>We use minimal cookies necessary for the site to function. We do not use third-party advertising cookies.</p>
    </main>
    <Footer />
  </div>
);

export default Privacy;
