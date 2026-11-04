// Homepage FAQ copy. Lives in a plain data file (no imports) so the Netlify
// edge renderer can show the same questions to crawlers as the React page.

export const HOME_FAQS: { question: string; answer: string }[] = [
  {
    question: "What is Eplicant?",
    answer:
      "Eplicant is a remote-only job board. Every listing is a fully remote role you can do from anywhere — engineering, design, marketing, sales, support, operations, finance and more.",
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
      "Listings come from established employers hiring remotely. Expired or suspicious postings are removed to keep the board trustworthy.",
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
