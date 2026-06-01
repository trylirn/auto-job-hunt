import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>About — Eplicant</title>
      <meta name="description" content="Eplicant is a job board for international development professionals — connecting talent with mission-driven roles worldwide." />
      <link rel="canonical" href="https://eplicant.com/about" />
      <meta property="og:title" content="About — Eplicant" />
      <meta property="og:description" content="Eplicant is a job board for international development professionals — connecting talent with mission-driven roles worldwide." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://eplicant.com/about" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">About Eplicant</h1>

      <p>
        Eplicant is a job board built for the international development community. We bring together
        roles, fellowships, scholarships, grants, internships, and conferences from organisations
        working on the issues that shape our world — humanitarian response, global health, climate,
        education, governance, human rights, and economic development.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Our Mission</h2>
      <p>
        We exist to make it easier for people who want to do meaningful work to find it. The
        international development sector is large, fragmented, and difficult to navigate. Roles
        are spread across hundreds of agencies, NGOs, foundations, multilaterals, social
        enterprises, and research institutions. Our mission is to bring those opportunities into
        one clear, searchable place — so applicants spend less time hunting and more time doing
        the work that matters.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">What We Do</h2>
      <p>
        Eplicant is a focused job board. We publish open roles and opportunities from across the
        sector and present them in a clean, fast interface designed around how job seekers
        actually search — by location, remote eligibility, deadline, type of work, and the kind
        of organisation behind the role.
      </p>
      <p>
        Every listing links to the original employer, so you apply directly to the organisation
        hiring. We do not stand between you and the opportunity.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Who We Serve</h2>
      <p>
        Our audience is the global community of international development professionals: programme
        managers, M&amp;E specialists, policy advisors, public health practitioners, climate and
        environment experts, humanitarian responders, researchers, consultants, communications and
        operations staff, and the next generation of professionals entering the field through
        fellowships, internships, and graduate programmes.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">Why International Development</h2>
      <p>
        Mission-driven work deserves mission-driven infrastructure. Generic job boards bury
        development roles under tech, finance, and retail listings. Specialist platforms are often
        slow, outdated, or paywalled. Eplicant focuses entirely on this sector so the experience
        — the filters, the categories, the deadlines, the language — is built for the people who
        actually use it.
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
        Subscribe to our weekly newsletter to receive a hand-picked digest of new roles and
        opportunities. If you have feedback, spot a broken listing, or want to suggest an
        organisation we should cover, please reach us via the <a href="/contact" className="text-primary">contact page</a>.
      </p>
    </main>
    <Footer />
  </div>
);

export default About;
