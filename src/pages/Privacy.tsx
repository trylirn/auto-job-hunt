import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Privacy Policy — Eplicant</title>
      <meta name="description" content="How Eplicant collects, uses, and protects your personal information." />
      <link rel="canonical" href="https://eplicant.com/privacy" />
      <meta property="og:title" content="Privacy Policy — Eplicant" />
      <meta property="og:description" content="How Eplicant collects, uses, and protects your personal information." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://eplicant.com/privacy" />
    </Helmet>
    <Header />
    <main className="container max-w-3xl py-10 prose prose-sm">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        This Privacy Policy explains how Eplicant ("we", "us", "our") collects, uses, stores, and
        protects information when you visit eplicant.com (the "Service"). By using the Service,
        you agree to the practices described below.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">1. Who We Are</h2>
      <p>
        Eplicant is a job board for the international development sector. We operate the website
        eplicant.com and a related weekly email newsletter. For privacy questions, please reach
        us via the <a href="/contact" className="text-primary">contact page</a>.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">2. Information We Collect</h2>
      <p>We collect only what we need to operate the Service:</p>
      <h3 className="font-display text-base font-semibold mt-4">Information you provide</h3>
      <ul>
        <li><strong>Email address</strong> — when you subscribe to the newsletter or contact us.</li>
        <li><strong>Message content</strong> — when you reach out through the contact page.</li>
      </ul>
      <h3 className="font-display text-base font-semibold mt-4">Information collected automatically</h3>
      <ul>
        <li><strong>Log data</strong> — IP address, browser type and version, device type, referring page, and timestamps of your visit.</li>
        <li><strong>Usage data</strong> — pages viewed, searches performed, filters applied, and links clicked, in aggregated form.</li>
        <li><strong>Cookies and similar technologies</strong> — used to keep the site working and to measure traffic anonymously.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-8">3. How We Use Information</h2>
      <ul>
        <li>To operate, maintain, and improve the Service.</li>
        <li>To send the newsletter and occasional product updates to subscribers.</li>
        <li>To respond to your messages and support requests.</li>
        <li>To detect, prevent, and address technical issues, abuse, and fraud.</li>
        <li>To produce aggregated, non-identifying analytics about how the Service is used.</li>
      </ul>

      <h2 className="font-display text-xl font-semibold mt-8">4. Legal Basis for Processing (EEA/UK Users)</h2>
      <p>
        Where the GDPR applies, we rely on the following legal bases: your <strong>consent</strong>
        (for newsletter subscriptions), our <strong>legitimate interests</strong> in operating
        and improving the Service, and <strong>compliance with legal obligations</strong> where
        required.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">5. Data Retention</h2>
      <p>
        We retain newsletter email addresses until you unsubscribe or request deletion. Contact
        messages are retained for as long as needed to handle your request and for a reasonable
        period afterwards for record-keeping. Server logs are typically retained for up to 90 days.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">6. Sharing &amp; Third-Party Services</h2>
      <p>
        We do not sell your personal information. We share limited data only with service providers
        we use to run Eplicant, including:
      </p>
      <ul>
        <li><strong>Hosting and infrastructure providers</strong> — to deliver the website.</li>
        <li><strong>Email delivery providers</strong> — to send the newsletter.</li>
        <li><strong>Analytics providers</strong> — to understand site traffic in aggregate.</li>
      </ul>
      <p>
        These providers process data on our behalf under contractual obligations to keep it
        confidential and secure.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">7. International Data Transfers</h2>
      <p>
        Eplicant is accessible globally and our service providers may be located in different
        countries. Where personal data is transferred internationally, we rely on appropriate
        safeguards such as standard contractual clauses or equivalent mechanisms.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">8. Your Rights</h2>
      <p>
        Depending on your jurisdiction, you may have the right to:
      </p>
      <ul>
        <li>Access the personal information we hold about you.</li>
        <li>Request correction of inaccurate information.</li>
        <li>Request deletion of your information.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Withdraw consent at any time (this does not affect prior processing).</li>
        <li>Lodge a complaint with your local data protection authority.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us via the contact page. You can unsubscribe
        from the newsletter at any time using the link at the bottom of every email.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">9. Children's Privacy</h2>
      <p>
        Eplicant is not directed to children under 16, and we do not knowingly collect personal
        information from them. If you believe a child has provided us with personal data, please
        contact us and we will delete it.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">10. Security</h2>
      <p>
        We use reasonable technical and organisational measures to protect personal information
        against loss, misuse, and unauthorised access. No system is perfectly secure, and we
        cannot guarantee absolute security.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">11. Cookies</h2>
      <p>
        We use a small number of cookies necessary for the site to function and to measure
        traffic in aggregate. We do not use third-party advertising cookies for retargeting or
        cross-site profiling. You can disable cookies in your browser settings, though parts of
        the Service may not work as expected.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we make material changes, we
        will update the "Last updated" date at the top of this page. Continued use of the Service
        after changes indicates acceptance of the revised Policy.
      </p>

      <h2 className="font-display text-xl font-semibold mt-8">13. Contact</h2>
      <p>
        For privacy questions, requests, or concerns, please reach us via the
        {" "}<a href="/contact" className="text-primary">contact page</a>.
      </p>
    </main>
    <Footer />
  </div>
);

export default Privacy;
