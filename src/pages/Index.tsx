import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { ListingBrowser } from "@/components/ListingBrowser";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useListingStats } from "@/hooks/useListingStats";
import {
  buildMeta,
  faqJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { getStaticRoute } from "@/lib/routes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "What is Eplicant?",
    answer:
      "Eplicant is a job board for international development professionals. Every listing is a fully remote role you can do from anywhere — humanitarian, global health, climate, education, governance and human rights work.",
  },
  {
    question: "Are all the jobs really remote?",
    answer:
      "Yes. Eplicant only publishes fully remote roles. Hybrid and on-site positions are filtered out, so everything you see can be done from wherever you are based.",
  },
  {
    question: "How often are jobs updated?",
    answer:
      "New remote roles are published every day. Subscribe to the weekly digest if you would rather have them delivered to your inbox.",
  },
  {
    question: "Are these jobs legitimate?",
    answer:
      "Listings come from established organisations and employers hiring in the sector. Expired or suspicious postings are removed to keep the board trustworthy.",
  },
  {
    question: "How do I apply for a job?",
    answer:
      "Open any listing to read the full details, then use the Apply button to go straight to the employer's application page or application email address. You apply directly to the organisation hiring.",
  },
  {
    question: "Can I post a remote role?",
    answer:
      "Yes — posting is free. Use the Post a remote job link in the header, fill in the details and your role goes live alongside every other listing.",
  },
];


const Index = () => {
  const { data: stats } = useListingStats();
  const route = getStaticRoute("/")!;

  const meta = buildMeta({
    title: route.title,
    description: route.description,
    path: "/",
  });

  return (
    <Layout>
      <Seo
        {...meta}
        jsonLd={[organizationJsonLd, websiteJsonLd, faqJsonLd(FAQS)]}
      />

      {/* Masthead */}
      <section className="border-b border-rule bg-card">
        <div className="container py-12 md:py-20">
          <div className="grid gap-10 md:grid-cols-[1.7fr_1fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                The remote international development job board
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] md:text-6xl">
                Remote jobs for people who work on what matters
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
                Humanitarian response, global health, climate, education,
                governance and human rights roles you can do from anywhere —
                fully remote only, updated daily.
              </p>
            </div>

            <dl className="flex gap-10 border-l border-rule pl-6 md:flex-col md:gap-5">
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Live remote jobs
                </dt>
                <dd className="font-display text-4xl">
                  {stats ? stats.jobs.toLocaleString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                  Updated
                </dt>
                <dd className="font-display text-4xl">Daily</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="container pt-8 md:pt-10">
        <NewsletterSignup id="home-newsletter" />
      </div>

      <div className="container py-10 md:py-14">
        <ListingBrowser
          basePath="/"
          heading="Latest remote jobs"
          resultNoun="job"
          searchPlaceholder="Search remote jobs by title, organisation or keyword"
        />
      </div>



      {/* FAQ */}
      <section className="border-t border-rule bg-card">
        <div className="container grid gap-8 py-14 md:grid-cols-[1fr_1.6fr] md:py-20">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Still curious? Read more <Link to="/about" className="text-primary underline underline-offset-2">about Eplicant</Link>.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="text-left font-display text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
