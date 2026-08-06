import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

const UnCareersGuide = () => {
  const canonical = "https://eplicant.com/guides/un-careers";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "UN Career Paths and Job Grades — A Practical Guide",
    description:
      "How United Nations careers work: G, NO, P, and D grades, the Inspira recruitment process, the Personal History Profile (PHP), and how to apply.",
    author: { "@type": "Organization", name: "Eplicant" },
    publisher: {
      "@type": "Organization",
      name: "Eplicant",
      logo: { "@type": "ImageObject", url: "https://eplicant.com/logo.png" },
    },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>UN Career Paths and Job Grades — A Practical Guide | Eplicant</title>
        <meta
          name="description"
          content="Understand UN career paths, job grades (G, NO, P, D), the Inspira recruitment process, and how to craft a winning Personal History Profile (PHP)."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content="UN Career Paths and Job Grades — A Practical Guide" />
        <meta
          property="og:description"
          content="A practical guide to United Nations job grades, the Inspira recruitment process, and the Personal History Profile."
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />
      <main className="container max-w-3xl py-10">
        <article className="prose prose-sm max-w-none">
          <h1 className="font-display text-3xl font-bold mb-4">
            UN Career Paths and Job Grades — A Practical Guide
          </h1>
          <p className="text-muted-foreground">
            A working career in the United Nations system is one of the most sought-after paths in
            international development. This guide explains how UN careers are structured, what the
            grades mean, and how the recruitment process actually works.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8">The UN Category System</h2>
          <p>
            The UN Secretariat and most UN agencies (UNDP, UNICEF, UNHCR, WFP, WHO, FAO, IOM,
            UNFPA, UN Women and others) share a common grading system built around four
            categories:
          </p>
          <ul>
            <li><strong>General Service (G-1 to G-7)</strong> — locally recruited administrative and support roles.</li>
            <li><strong>National Officer (NO-A to NO-D)</strong> — nationally recruited professional roles requiring local expertise.</li>
            <li><strong>Professional (P-1 to P-5)</strong> — internationally recruited professional roles, rotational across duty stations.</li>
            <li><strong>Director (D-1 to D-2)</strong> — senior leadership. Above D-2 sit Assistant Secretary-General (ASG) and Under-Secretary-General (USG) posts.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8">Professional (P) Grades in Detail</h2>
          <p>
            P grades are the pathway most international candidates aim for. Typical expectations:
          </p>
          <ul>
            <li><strong>P-1 / P-2</strong> — entry level; usually filled through the Young Professionals Programme (YPP) or JPO schemes. Requires a first university degree and up to 2 years of experience.</li>
            <li><strong>P-3</strong> — 5+ years of relevant experience, advanced degree, second UN language preferred.</li>
            <li><strong>P-4</strong> — 7+ years, proven technical specialisation and often field experience.</li>
            <li><strong>P-5</strong> — 10+ years, team leadership and complex programme management.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8">Entry Routes Worth Knowing</h2>
          <ul>
            <li><strong>Young Professionals Programme (YPP)</strong> — annual exam for candidates under 32 from under-represented countries. Entry at P-1/P-2.</li>
            <li><strong>Junior Professional Officer (JPO)</strong> — sponsored by donor governments (e.g. Netherlands, Germany, Japan, Nordic states). Two-year P-2 placement.</li>
            <li><strong>UN Volunteers (UNV)</strong> — assignments across the UN system; a common stepping-stone.</li>
            <li><strong>Consultancies and Individual Contractor Agreements (ICA)</strong> — short-term contracts that build UN experience.</li>
            <li><strong>Internships</strong> — unpaid but valuable for gaining agency-specific exposure.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8">Inspira and Agency Portals</h2>
          <p>
            The UN Secretariat uses <strong>Inspira</strong> (careers.un.org) as its central
            recruitment platform. Most specialised agencies run their own portals — UNICEF, UNDP,
            WHO, WFP, UNHCR, FAO, IOM, UN Women and UNFPA each have separate careers sites. You
            need a profile on each.
          </p>
          <p>Once you apply, the pipeline typically runs:</p>
          <ol>
            <li>Application screening against the evaluation criteria.</li>
            <li>Written assessment (often a technical case exercise).</li>
            <li>Competency-based interview using the CBI / STAR format.</li>
            <li>Reference checks and roster placement.</li>
          </ol>

          <h2 className="font-display text-xl font-semibold mt-8">The Personal History Profile (PHP)</h2>
          <p>
            The PHP is the UN's structured application form. It replaces a CV for most agencies and
            is scored against the vacancy's stated requirements. A few things that consistently
            separate strong PHPs from weak ones:
          </p>
          <ul>
            <li><strong>Mirror the vacancy language.</strong> Screeners look for exact matches to the required competencies and duties.</li>
            <li><strong>Quantify every achievement.</strong> Budget managed, people supervised, beneficiaries reached, funds mobilised — numbers stand out.</li>
            <li><strong>Complete every section.</strong> Blank fields (languages, publications, references) reduce your score even when they seem optional.</li>
            <li><strong>Write the cover letter to the criteria, not the role.</strong> Address each requirement in order with concrete examples.</li>
            <li><strong>Prepare for CBI questions</strong> using STAR (Situation, Task, Action, Result). UN interviews are strict about this format.</li>
          </ul>

          <h2 className="font-display text-xl font-semibold mt-8">Duty Stations and Hardship</h2>
          <p>
            The UN classifies duty stations from <strong>H (headquarters, family)</strong> through
            <strong> A to E (progressively harder non-family)</strong>. Hardship posts carry
            additional allowances and often faster promotion, but the mobility requirement is real
            — P-staff are expected to rotate. Reviewing the ICSC hardship classification before
            applying helps you plan the shape of a career, not just the next job.
          </p>

          <h2 className="font-display text-xl font-semibold mt-8">Where to Find Live UN Vacancies</h2>
          <p>
            Eplicant aggregates verified UN and wider international development roles as they open.
            Explore current listings:
          </p>
          <ul>
            <li><Link to="/">All open jobs</Link></li>
            <li><Link to="/jobs/in">Browse by country</Link></li>
          </ul>

          <p className="text-muted-foreground mt-8">
            This guide is educational. For binding rules always consult the UN Staff Regulations,
            ICSC guidance and the specific vacancy announcement.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default UnCareersGuide;
