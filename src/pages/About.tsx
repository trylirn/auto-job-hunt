import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>About — Eplicant</title>
      <meta name="description" content="About Eplicant — our mission to connect people with jobs and opportunities." />
      <link rel="canonical" href="https://eplicant.com/about" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">About Eplicant</h1>
      <p>Eplicant is a curated career platform that helps job seekers discover verified jobs and opportunities — fellowships, scholarships, grants, conferences, and internships — across Africa and beyond.</p>
      <p>We aggregate listings from trusted public sources, clean them with AI, and present them in a clean, fast, and searchable interface. Employers can submit a featured listing for $195 and reach our growing audience for 30 days.</p>
      <p>Our mission is to make career advancement opportunities accessible and trustworthy.</p>
    </main>
    <Footer />
  </div>
);

export default About;
