import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>About — Eplicant</title>
      <meta name="description" content="Eplicant is a remote-only job board — fully remote roles across every industry, updated daily." />
      <link rel="canonical" href="https://eplicant.com/about" />
      <meta property="og:title" content="About — Eplicant" />
      <meta property="og:description" content="Eplicant is a remote-only job board — fully remote roles across every industry, updated daily." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://eplicant.com/about" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">About Eplicant</h1>

      <p>
        Eplicant is a remote-only job board. Every role we publish can be done from
        anywhere — no office, no commute, no relocation. We cover every industry:
        engineering, design, product, marketing, sales, customer support, operations,
        finance, writing and more.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Our Mission</h2>
      <p>
        Remote work is spread thin across hundreds of company career pages and general
        job boards where it sits buried under on-site listings. Our mission is to bring
        genuinely remote roles into one clear, fast, searchable place — so you spend less
        time filtering and more time applying.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">What We Do</h2>
      <p>
        We publish open remote roles and present them in a clean, fast interface built
        around how people actually search — by keyword, by the country you can work from,
        and by deadline. Hybrid and on-site positions are filtered out.
      </p>
      <p>
        Every listing links to the original employer, so you apply directly to the company
        hiring. We do not stand between you and the role.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Who We Serve</h2>
      <p>
        Anyone who wants to work remotely — experienced professionals looking for their next
        role, people moving out of office-based work, and teams hiring talent wherever it is.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Why Remote Only</h2>
      <p>
        "Remote" on most job boards means hybrid, remote-in-one-city, or occasionally remote.
        We only keep roles that are genuinely location-independent, so what you see is what
        you get.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Our Values</h2>
      <ul>
        <li><strong>Clarity.</strong> Listings should be readable, complete, and easy to scan.</li>
        <li><strong>Speed.</strong> Pages load fast. Search returns instantly. No friction between you and the role.</li>
        <li><strong>Honesty.</strong> We surface deadlines clearly, mark expired roles, and never hide important details behind clicks.</li>
        <li><strong>Free for job seekers.</strong> Browsing, searching, and subscribing are free, and will always be.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-8">Get Involved</h2>
      <p>
        Subscribe to our weekly newsletter to receive a hand-picked digest of new remote
        roles. If you have feedback, spot a broken listing, or want to suggest a company we
        should cover, please reach us via the <a href="/contact" className="text-primary">contact page</a>.
      </p>
    </main>
    <Footer />
  </div>
);

export default About;
