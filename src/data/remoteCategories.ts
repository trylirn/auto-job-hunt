import type { JobFamily } from "@/lib/salaryBenchmarks";

export interface RemoteCategory {
  slug: string;
  name: string;
  /** Salary-benchmark family used for the live pay table. */
  family: JobFamily;
  /** Title words that identify a listing in this category. */
  titleTerms: string[];
  metaTitle: string;
  metaDescription: string;
  intro: string;
  roles: { name: string; summary: string }[];
  skills: string[];
  tips: string[];
  faqs: { question: string; answer: string }[];
}

export const REMOTE_CATEGORIES: RemoteCategory[] = [
  {
    slug: "software-engineering",
    name: "Software engineering",
    family: "Engineering",
    titleTerms: ["engineer", "developer", "devops", "sre", "architect"],
    metaTitle: "Remote Software Engineering Jobs",
    metaDescription:
      "Fully remote software engineering jobs: backend, frontend, full-stack, DevOps and platform roles, with real salary ranges and advice on getting hired.",
    intro:
      "Software engineering has more fully remote jobs than any other field. Code reviews, tickets and deployments already happen online, so most engineering teams can hire across time zones without changing how they work. This page lists live remote engineering roles and explains what employers expect.",
    roles: [
      { name: "Backend engineer", summary: "Builds the APIs, data models and services behind a product. Common stacks are Go, Python, Java, Node.js and Ruby, usually on a cloud platform." },
      { name: "Frontend engineer", summary: "Builds the interface people use, most often in React or Vue with TypeScript. Accessibility and performance come up in many interviews." },
      { name: "Full-stack engineer", summary: "Works on both sides of the product. Startups and small teams often hire this role first." },
      { name: "DevOps / platform / SRE", summary: "Keeps systems reliable, automates deployment and handles on-call. Kubernetes, Terraform and observability tools come up often." },
      { name: "Security engineer", summary: "Protects infrastructure and code through threat modelling, audits and incident response." },
    ],
    skills: [
      "Clear written communication: design documents, pull-request descriptions and status updates replace hallway chats",
      "Comfort working on your own: picking up a ticket, unblocking yourself and asking good questions in writing",
      "Testing and code review habits that let a team ship safely without being in the same room",
      "Familiarity with Git, CI/CD and at least one major cloud provider",
    ],
    tips: [
      "Link to code you can show: a public repository, an open-source contribution or a short write-up of a system you built.",
      "Check the location line carefully. Many \"remote\" engineering roles still require you to live in specific countries for payroll or tax reasons.",
      "Expect take-home tasks or pair-programming calls. Treat the written parts as part of the test, because they show how you work remotely.",
      "Mention the time-zone overlap you can offer, such as \"available 9:00–13:00 Eastern\".",
    ],
    faqs: [
      { question: "Do I need a degree for a remote engineering job?", answer: "Many employers on Eplicant list skills and experience instead of a degree. A strong portfolio and clear interview performance count for more at most remote-first companies." },
      { question: "Are remote engineering salaries lower than office salaries?", answer: "Not necessarily. Some companies pay one global rate and others adjust pay to where you live. Check the salary range in each listing, and see the live figures on this page." },
    ],
  },
  {
    slug: "design",
    name: "Design",
    family: "Design",
    titleTerms: ["designer", "design", "ux", "ui "],
    metaTitle: "Remote Design Jobs — UX, Product & Brand",
    metaDescription:
      "Remote design jobs in product, UX, UI and brand design. Browse live roles, see real pay ranges and learn what remote design teams look for.",
    intro:
      "Remote design teams work in shared tools such as Figma and run critiques over video or in comment threads. Companies hiring remote designers want people who can explain their decisions in writing as clearly as they show them on screen.",
    roles: [
      { name: "Product designer", summary: "Owns user flows from research to final screens and works closely with product managers and engineers." },
      { name: "UX researcher", summary: "Plans and runs interviews and usability tests, often fully online, and turns the findings into recommendations." },
      { name: "UI / visual designer", summary: "Creates interface details, design systems and component libraries." },
      { name: "Brand designer", summary: "Shapes a company's visual identity across its website, campaigns and product marketing." },
    ],
    skills: [
      "A portfolio built around case studies (problem, process, result), not just final screens",
      "Fluency in Figma, including components, variants and dev handoff",
      "Running remote research sessions and workshops",
      "Writing clear design rationale that engineers and stakeholders can act on later",
    ],
    tips: [
      "Lead your portfolio with two or three in-depth case studies instead of many thumbnails.",
      "Show proof of collaboration, such as comments, specs or a design-system contribution, because remote teams cannot watch you work.",
      "Be ready for a portfolio walkthrough over video, and practise screen-sharing beforehand.",
    ],
    faqs: [
      { question: "Is a portfolio required for remote design jobs?", answer: "Almost always. A short, focused portfolio with written case studies is the most important part of a remote design application." },
      { question: "Which tools do remote design teams use?", answer: "Figma is the most common, along with tools such as FigJam or Miro for workshops, Maze or Lookback for testing, and Notion or Confluence for documentation." },
    ],
  },
  {
    slug: "product-management",
    name: "Product management",
    family: "Product",
    titleTerms: ["product manager", "product owner", "product lead", "program manager"],
    metaTitle: "Remote Product Manager Jobs",
    metaDescription:
      "Remote product manager, product owner and program manager jobs. Live listings, real salary data and practical advice for remote product interviews.",
    intro:
      "Product managers decide what gets built and why. In a remote team, that means writing a lot: specs, decision records and updates that keep engineering, design and leadership in step without daily meetings.",
    roles: [
      { name: "Product manager", summary: "Owns a product area's roadmap, prioritisation and results." },
      { name: "Technical product manager", summary: "Focuses on platform, API or infrastructure products and works closely with engineering." },
      { name: "Program / project manager", summary: "Coordinates work that spans several teams, keeping schedules, dependencies and risks on track." },
      { name: "Product operations", summary: "Builds the processes, tools and data that help product teams work well." },
    ],
    skills: [
      "Strong written product specs and decision documents",
      "Using data to set priorities: metrics, experiments and customer research",
      "Facilitating productive meetings across time zones, and knowing when not to hold one",
      "Stakeholder communication that does not rely on being in the room",
    ],
    tips: [
      "Bring a short written example of your work, such as a redacted spec or launch summary. Remote hiring managers value it highly.",
      "Quantify outcomes on your CV, for example \"cut onboarding drop-off by 18%\".",
      "Ask in interviews how decisions are recorded and shared. It tells you how mature the team's remote practice is.",
    ],
    faqs: [
      { question: "Can I move into remote product management from another role?", answer: "Yes. Many remote product managers started in engineering, design, support or analytics. Show that you have owned outcomes and written clear plans." },
    ],
  },
  {
    slug: "data",
    name: "Data & analytics",
    family: "Data & Analytics",
    titleTerms: ["data", "analyst", "analytics", "machine learning", "scientist"],
    metaTitle: "Remote Data & Analytics Jobs",
    metaDescription:
      "Remote data analyst, data engineer, data scientist and machine learning jobs. Browse live roles with pay ranges and tips for remote data interviews.",
    intro:
      "Data work suits remote teams well. Warehouses, notebooks and dashboards live in the cloud, and results are shared as written analysis. Remote data roles range from reporting and business analysis to large-scale data engineering and machine learning.",
    roles: [
      { name: "Data analyst", summary: "Answers business questions with SQL, spreadsheets and dashboards." },
      { name: "Analytics engineer", summary: "Models clean, tested datasets, often with dbt, so other teams can trust the numbers." },
      { name: "Data engineer", summary: "Builds the pipelines and infrastructure that move and store data." },
      { name: "Data scientist / ML engineer", summary: "Builds statistical models and machine-learning systems and puts them into production." },
    ],
    skills: [
      "SQL fluency, plus Python or R for analysis",
      "A modern data stack: a cloud warehouse, dbt, orchestration tools and a BI tool",
      "Turning analysis into a clear written recommendation",
      "Data-quality and documentation habits that let others reuse your work",
    ],
    tips: [
      "Publish a small end-to-end project with a short write-up explaining the question, the method and what you found.",
      "In take-home tasks, explain your assumptions in writing. Reviewers check your reasoning as well as the result.",
      "Look for wording such as \"US time zones\" or \"EMEA overlap\" in the listing before you apply.",
    ],
    faqs: [
      { question: "What's the difference between a data analyst and a data scientist?", answer: "Analysts mostly explain what happened and why, using SQL and dashboards. Data scientists build predictive models and experiments. Job titles vary between companies, so read the responsibilities closely." },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    family: "Marketing",
    titleTerms: ["marketing", "growth", "content", "seo", "communications", "social media"],
    metaTitle: "Remote Marketing Jobs — Growth, Content & SEO",
    metaDescription:
      "Remote marketing jobs in growth, content, SEO, product marketing and communications. Live listings, salary data and advice for remote marketers.",
    intro:
      "Remote marketing teams plan campaigns in shared documents, track results in analytics tools and write a great deal. Companies hire remote marketers for growth, content, SEO, lifecycle email, product marketing and communications.",
    roles: [
      { name: "Growth / performance marketer", summary: "Runs paid and organic acquisition experiments and owns funnel metrics." },
      { name: "Content marketer / writer", summary: "Plans and writes articles, guides and newsletters that attract and convert readers." },
      { name: "SEO specialist", summary: "Improves how a site appears in search through technical fixes, content strategy and links." },
      { name: "Product marketing manager", summary: "Shapes positioning, launches and sales materials." },
      { name: "Communications / PR", summary: "Manages the company's public voice, press relationships and internal communications." },
    ],
    skills: [
      "Strong, adaptable writing",
      "Analytics tools (GA4 or similar) and reading campaign data honestly",
      "Experiment design: a hypothesis, a test and a clear readout",
      "Managing freelancers and agencies in other time zones",
    ],
    tips: [
      "Share live examples of your work with the numbers behind them, such as traffic, sign-ups or pipeline you influenced.",
      "Tailor your cover note to the product. Remote marketing managers notice when someone has actually tried what they sell.",
    ],
    faqs: [
      { question: "Are entry-level remote marketing jobs available?", answer: "Yes, especially in content, social media and marketing coordination. A small portfolio of writing or campaign work helps you stand out." },
    ],
  },
  {
    slug: "sales",
    name: "Sales",
    family: "Sales",
    titleTerms: ["sales", "account executive", "business development", "account manager", "partnerships"],
    metaTitle: "Remote Sales Jobs — Account Executive & SDR",
    metaDescription:
      "Remote sales jobs: account executives, SDRs, account managers and partnership roles. See live listings, real on-target earnings and remote selling tips.",
    intro:
      "Most B2B selling now happens over video calls, email and shared deal rooms, so many sales teams hire fully remote. Remote sales roles usually have a base salary plus commission, and many are tied to a territory or time zone.",
    roles: [
      { name: "Sales development representative (SDR/BDR)", summary: "Researches and contacts prospects and books meetings for account executives. A common way into tech sales." },
      { name: "Account executive", summary: "Runs deals from discovery to signature and is measured on closed revenue." },
      { name: "Account manager", summary: "Grows and renews existing customers." },
      { name: "Partnerships / business development", summary: "Builds referral, reseller and integration partnerships." },
    ],
    skills: [
      "Confident video presence and discovery calls",
      "CRM discipline (Salesforce, HubSpot), because managers can only see your pipeline through it",
      "Writing concise, personalised outreach",
      "Managing your own time and energy without a sales floor around you",
    ],
    tips: [
      "Put numbers on your CV: quota attainment, average deal size and sales-cycle length.",
      "Check which territory the role covers. \"Remote\" in sales often means remote within a specific region.",
      "Ask how the on-target earnings (OTE) split works and what share of the team hit quota last year.",
    ],
    faqs: [
      { question: "What does OTE mean in a sales job listing?", answer: "On-target earnings: base salary plus the commission you would earn by hitting 100% of quota. Ask what proportion is base pay." },
    ],
  },
  {
    slug: "customer-support",
    name: "Customer support",
    family: "Customer Support",
    titleTerms: ["support", "customer success", "customer experience", "customer care", "service desk"],
    metaTitle: "Remote Customer Support & Success Jobs",
    metaDescription:
      "Remote customer support, customer success and technical support jobs. Browse live roles, compare pay and learn how to stand out as a remote support agent.",
    intro:
      "Customer support was one of the first functions to go fully remote. Today companies hire remote support agents, technical support specialists and customer success managers worldwide, often to cover customers around the clock across time zones.",
    roles: [
      { name: "Customer support agent", summary: "Answers customer questions by email, chat or phone and resolves issues quickly and kindly." },
      { name: "Technical support specialist", summary: "Troubleshoots product and integration problems and works closely with engineering." },
      { name: "Customer success manager", summary: "Helps business customers adopt the product, renew and grow." },
      { name: "Support operations", summary: "Manages tools, workflows, help-centre content and support metrics." },
    ],
    skills: [
      "Clear, warm written English (or other required languages)",
      "Help-desk tools such as Zendesk, Intercom or Freshdesk",
      "Calm troubleshooting and knowing when to escalate",
      "A reliable home setup: a quiet space and a stable connection",
    ],
    tips: [
      "Your application is itself a writing test. Keep it friendly, clear and free of mistakes.",
      "Mention the hours and shifts you can work. Coverage is a key hiring factor for support teams.",
      "Many support roles are a good route into product, operations or customer success later.",
    ],
    faqs: [
      { question: "Do remote support jobs require experience?", answer: "Many entry-level roles do not. Employers look for good writing, patience and reliability. Previous customer-facing work, even outside tech, counts." },
    ],
  },
  {
    slug: "operations",
    name: "Operations",
    family: "Operations",
    titleTerms: ["operations", "project manager", "coordinator", "administrator", "chief of staff"],
    metaTitle: "Remote Operations & Project Management Jobs",
    metaDescription:
      "Remote operations, project management, coordinator and chief-of-staff jobs. Live listings, real salary ranges and tips for operations roles.",
    intro:
      "Operations people keep remote companies running. They design processes, manage projects and vendors, and make sure information reaches the people who need it. Titles vary widely, from coordinator and project manager to business operations and chief of staff.",
    roles: [
      { name: "Business operations", summary: "Improves how the company runs through planning, reporting and process design." },
      { name: "Project manager / coordinator", summary: "Plans timelines, tracks progress and keeps stakeholders informed." },
      { name: "Executive assistant / chief of staff", summary: "Supports leaders with priorities, communication and follow-through." },
      { name: "Revenue / sales operations", summary: "Runs CRM systems, reporting and processes for customer-facing teams." },
    ],
    skills: [
      "Writing processes down so that they actually get followed",
      "Project tools such as Asana, Jira, Linear or Notion",
      "Spreadsheet and reporting skills",
      "Coordinating across time zones without getting in the way",
    ],
    tips: [
      "Describe a process you improved and how you measured the result.",
      "Show that you can write a crisp weekly update. It is often the main way an operations role is visible in a remote company.",
    ],
    faqs: [
      { question: "What does \"operations\" mean in a job title?", answer: "It depends on the company. It can mean business planning, project management, vendor management or running internal systems. Read the responsibilities rather than relying on the title." },
    ],
  },
  {
    slug: "finance",
    name: "Finance & legal",
    family: "Finance & Legal",
    titleTerms: ["finance", "accountant", "accounting", "controller", "legal", "counsel", "tax", "payroll"],
    metaTitle: "Remote Finance, Accounting & Legal Jobs",
    metaDescription:
      "Remote finance, accounting, payroll, tax and legal jobs. Browse live listings, see real pay ranges and learn what remote finance teams expect.",
    intro:
      "Finance and legal work has moved online along with cloud accounting, e-signatures and digital contract tools. Remote roles range from accountants and payroll specialists to financial analysts, controllers and in-house counsel.",
    roles: [
      { name: "Accountant / bookkeeper", summary: "Handles month-end close, reconciliations and reporting." },
      { name: "Financial analyst (FP&A)", summary: "Builds budgets, forecasts and the models behind business decisions." },
      { name: "Payroll / tax specialist", summary: "Manages payroll and tax compliance, often across several countries for distributed teams." },
      { name: "Legal counsel", summary: "Drafts and negotiates contracts and advises on compliance and privacy." },
    ],
    skills: [
      "Cloud finance tools (NetSuite, Xero, QuickBooks) and strong spreadsheet skills",
      "Accuracy and documentation suited to asynchronous review",
      "Knowledge of the specific country rules a role covers",
      "Explaining numbers clearly to people outside finance",
    ],
    tips: [
      "Check licensing and jurisdiction requirements. Many legal and accounting roles must be based in a particular country.",
      "Highlight any experience with multi-currency, multi-entity or international payroll, which distributed companies value highly.",
    ],
    faqs: [
      { question: "Can accountants work fully remotely?", answer: "Yes. Cloud accounting has made remote finance work common. Some roles still require you to be licensed in, or live in, a specific country." },
    ],
  },
  {
    slug: "hr-recruiting",
    name: "HR & recruiting",
    family: "People & Recruiting",
    titleTerms: ["recruit", "talent", "people", "human resources", "hr "],
    metaTitle: "Remote HR, People & Recruiting Jobs",
    metaDescription:
      "Remote recruiter, talent acquisition, HR and people operations jobs. Live listings, real salary ranges and advice for remote people teams.",
    intro:
      "Distributed companies need people teams who understand remote work from the inside. Remote HR and recruiting roles cover hiring, onboarding, benefits, policy and employee experience across countries.",
    roles: [
      { name: "Recruiter / talent acquisition", summary: "Sources and screens candidates and manages hiring pipelines." },
      { name: "People operations / HR generalist", summary: "Handles onboarding, HR systems, policies and employee questions." },
      { name: "People partner", summary: "Advises managers on performance, team structure and development." },
      { name: "Compensation & benefits", summary: "Designs pay bands and benefits that work across many countries." },
    ],
    skills: [
      "Applicant tracking systems (Greenhouse, Lever, Ashby) and HR systems",
      "Knowledge of international hiring, employer-of-record services and contractor rules",
      "Building inclusive, structured interview processes",
      "Discretion and clear written communication",
    ],
    tips: [
      "Share the hiring results you achieved: time to hire, offer-acceptance rate or roles filled.",
      "Show that you understand remote-specific challenges such as time zones, onboarding without an office and fair pay across countries.",
    ],
    faqs: [
      { question: "Do remote recruiters need to be in the same country as candidates?", answer: "Not usually. They often need to work hours that overlap with the regions they hire in." },
    ],
  },
];

export function getRemoteCategory(slug: string): RemoteCategory | undefined {
  return REMOTE_CATEGORIES.find((c) => c.slug === slug);
}
