import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Terms of Service — Eplicant</title>
      <meta name="description" content="Eplicant terms of service — the rules for using our job board." />
      <link rel="canonical" href="https://eplicant.com/terms" />
      <meta property="og:title" content="Terms of Service — Eplicant" />
      <meta property="og:description" content="Eplicant terms of service — the rules for using our job board." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://eplicant.com/terms" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of eplicant.com and any
        related services we offer (together, the "Service"). Please read them carefully. By using
        the Service you confirm that you have read, understood, and agree to be bound by these
        Terms. If you do not agree, you must stop using the Service.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">1. About Eplicant</h2>
      <p>
        Eplicant publishes jobs and opportunities for the international development sector. We are
        a job board: we display openings and link applicants to the organisations advertising
        them. We are not the employer for any role listed and we are not party to any application,
        interview, offer, contract, or employment relationship that may result from your use of
        the Service.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">2. Eligibility</h2>
      <p>
        You must be at least 16 years old to use the Service. By using Eplicant you represent that
        you meet this requirement and that you have the legal capacity to agree to these Terms in
        your jurisdiction.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">3. Use of the Service</h2>
      <p>
        You may browse listings, use search and filters, subscribe to our newsletter, and follow
        external links to apply directly with the listed organisation. The Service is provided for
        personal, non-commercial use by individuals exploring career opportunities.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">4. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
        <li>Scrape, copy, redistribute, resell, or systematically extract content from the Service.</li>
        <li>Attempt to interfere with, disrupt, or compromise the integrity or security of the Service.</li>
        <li>Use automated tools, bots, or crawlers without our prior written consent.</li>
        <li>Misrepresent your identity or impersonate any person or organisation.</li>
        <li>Submit false, misleading, or harmful information through the contact form.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-8">5. Intellectual Property</h2>
      <p>
        The Eplicant name, logo, design, and the original content we create (such as our
        newsletter copy, page layouts, and editorial wording) are the property of Eplicant or our
        licensors and are protected by intellectual-property laws. Job listings and related
        details remain the property of the organisations posting them. Nothing in these Terms
        grants you a licence to use our trademarks or content beyond browsing the Service for
        personal use.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">6. External Links and Third-Party Content</h2>
      <p>
        The Service contains links to external websites operated by employers and other third
        parties. We do not control these sites and are not responsible for their content,
        accuracy, privacy practices, or any interaction you have with them. Visiting an external
        site is at your own risk and subject to that site's own terms and privacy policies.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">7. Accounts &amp; Security</h2>
      <p>
        Eplicant does not require an account to browse or apply. Where you provide an email
        address (for example, to subscribe to the newsletter), you are responsible for ensuring
        the email is yours and accurate. Notify us promptly if you believe your email is being
        used on the Service without your permission.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">8. Disclaimer</h2>
      <p>
        The Service and all content on it are provided on an "as is" and "as available" basis,
        without warranties of any kind, whether express or implied. We do not guarantee that
        listings are accurate, complete, current, available, or free from errors. We do not
        guarantee any particular outcome from applying to a role. Always verify information
        independently with the employer before submitting personal data, paying any fee, or
        making career decisions.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Eplicant and its operators will not be liable for
        any indirect, incidental, special, consequential, or punitive damages, or any loss of
        profits, revenue, data, or goodwill, arising out of or in connection with your use of —
        or inability to use — the Service, even if we have been advised of the possibility of
        such damages.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Eplicant and its operators from any claim,
        demand, loss, or expense (including reasonable legal fees) arising from your use of the
        Service, your violation of these Terms, or your violation of any law or third-party right.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">11. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without
        notice, if we believe you have violated these Terms or if we need to do so to protect the
        Service or other users. Sections that by their nature should survive termination
        (including intellectual property, disclaimers, limitation of liability, and indemnity)
        will continue to apply.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">12. Governing Law</h2>
      <p>
        These Terms are governed by the laws applicable at our place of operation, without regard
        to conflict-of-law principles. Disputes arising out of or related to these Terms or the
        Service will be subject to the exclusive jurisdiction of the competent courts in that
        jurisdiction, except where mandatory consumer-protection laws of your country of
        residence provide otherwise.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">13. Severability</h2>
      <p>
        If any provision of these Terms is found to be unenforceable, the remaining provisions
        will remain in full force and effect, and the unenforceable provision will be modified to
        the minimum extent necessary to make it enforceable while preserving its intent.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. When we make material changes we will update
        the "Last updated" date at the top of this page. Continued use of the Service after
        changes constitutes acceptance of the revised Terms.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">15. Contact</h2>
      <p>
        Questions about these Terms? Please reach us via the
        {" "}<a href="/contact" className="text-primary">contact page</a>.
      </p>
    </main>
    <Footer />
  </div>
);

export default Terms;
