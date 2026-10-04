export interface GuideSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: GuideSection[];
  related: { label: string; to: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "find-legitimate-remote-jobs",
    title: "How to find a legitimate remote job (and spot scams)",
    metaTitle: "How to Find a Legitimate Remote Job and Spot Scams",
    metaDescription:
      "A practical guide to finding real remote jobs: where to look, how to check an employer, and the warning signs of remote job scams.",
    intro:
      "Remote work is popular, and that makes it a target. For every real remote role there are fake listings built to collect personal data or money. This guide explains where genuine remote jobs come from, how to check an employer in a few minutes, and the signs that a listing is not what it claims to be.",
    sections: [
      {
        heading: "Start where real employers post",
        paragraphs: [
          "Most established companies publish jobs on their own careers page, and that page is usually powered by an applicant tracking system such as Greenhouse, Lever, Ashby or Breezy. A listing that leads to one of these systems, on a page linked from the company's own website, is a strong sign the role is real.",
          "Eplicant lists jobs taken directly from employers' own job boards, so each listing points to the place the company actually reviews applications. Whatever site you use, the safest habit is the same: before you apply, find the job on the company's own website.",
        ],
      },
      {
        heading: "Check the employer in five minutes",
        paragraphs: ["A short check removes most of the risk. Before sending anything:"],
        list: [
          "Open the company's website directly (type the address yourself) and look for a careers page that lists the same role.",
          "Look for the company on LinkedIn. Real employers have staff profiles with a work history, not just a logo and a few followers.",
          "Check that the email address you are contacted from matches the company's domain. Recruiters at real companies rarely use free email accounts.",
          "Search the company name with words like \"scam\" or \"reviews\" to see whether others have reported problems.",
        ],
      },
      {
        heading: "Warning signs of a remote job scam",
        paragraphs: [
          "Scams tend to follow the same patterns. One sign alone is not proof, but two or three together should stop you:",
        ],
        list: [
          "You are offered the job without an interview, or after a chat-only interview on a messaging app.",
          "You are asked to pay for training, equipment, a background check or software before you start.",
          "You are sent a cheque to buy equipment and asked to return part of the money.",
          "The pay is far above the going rate for very simple work, such as \"data entry\" or \"package reshipping\".",
          "They ask for your bank details, ID documents or tax number before a written offer exists.",
          "The listing is vague: no team, no manager, no clear duties, and a lot of urgency.",
        ],
      },
      {
        heading: "Read the location line carefully",
        paragraphs: [
          "A real remote listing is often limited by where you live. Companies have to run payroll and follow employment law, so many \"remote\" roles are open only to people in certain countries or time zones. That restriction is a good sign: scammers rarely bother with it. If a listing says \"Remote – United States\" and you live elsewhere, it is usually not worth applying unless the listing says it hires through an employer of record.",
        ],
      },
      {
        heading: "Protect yourself while you apply",
        paragraphs: [
          "Share only what an application needs: your CV, a cover letter and contact details. Keep your national ID, bank details and copies of documents until you have a signed offer from a company you have checked. Use a separate email address for job hunting so you can spot unexpected messages easily.",
          "If you think you have found a scam, stop replying, do not send money, and report the listing to the site where you found it. If you have already shared bank details, contact your bank straight away.",
        ],
      },
      {
        heading: "A simple routine that works",
        paragraphs: [
          "Pick a few fields you are qualified for, check for new listings each morning, and apply to roles you can verify on the employer's own site. A small number of well-researched applications to real companies will get you further than dozens of quick ones sent to listings you can't trace.",
        ],
      },
    ],
    related: [
      { label: "Remote job interview tips", to: "/guides/remote-job-interview-tips" },
      { label: "Writing a CV for remote roles", to: "/guides/remote-cv-guide" },
      { label: "Browse remote jobs", to: "/" },
    ],
  },
  {
    slug: "remote-job-interview-tips",
    title: "Remote job interview tips",
    metaTitle: "Remote Job Interview Tips: How to Prepare and Stand Out",
    metaDescription:
      "How to prepare for a remote job interview: video setup, the questions remote employers ask, take-home tasks and following up.",
    intro:
      "A remote interview tests two things at once: whether you can do the job, and whether you can do it without someone looking over your shoulder. Remote employers watch how you communicate, how you plan your time and how you handle the tools you will use every day. This guide covers how to prepare for each stage.",
    sections: [
      {
        heading: "Get the setup right before the call",
        paragraphs: [
          "Technical problems take time away from your answers, so test everything the day before. Join the meeting link early to check the software works on your device.",
        ],
        list: [
          "A stable internet connection. Use a cable if your Wi-Fi is unreliable, and keep a phone hotspot as a backup.",
          "A camera at eye level and light facing you, not behind you.",
          "Headphones with a microphone to cut echo and background noise.",
          "A quiet room and notifications switched off on every device.",
        ],
      },
      {
        heading: "Questions remote employers ask",
        paragraphs: [
          "Besides the usual questions about your experience, expect questions about how you work on your own. Prepare a short, specific example for each:",
        ],
        list: [
          "How do you organise your day when nobody sets your schedule?",
          "Tell us about a time you were blocked and the right person was offline. What did you do?",
          "How do you keep teammates updated on your progress?",
          "Have you worked across time zones? How did you handle handovers?",
          "What does your work setup look like?",
        ],
      },
      {
        heading: "Answer with examples, in a clear structure",
        paragraphs: [
          "Use the situation, task, action, result structure: briefly describe the situation, what you had to do, what you did, and what happened. Give numbers where you can. Remote teams rely on written updates, so concise, well-organised answers show you will be easy to work with.",
          "Keep answers to about two minutes. Video calls make long answers harder to follow, and pausing to let the interviewer ask a follow-up keeps it a conversation.",
        ],
      },
      {
        heading: "Take-home tasks and written exercises",
        paragraphs: [
          "Many remote employers set a take-home task or written exercise because it is close to the real work. Read the brief twice, ask questions early if anything is unclear, and keep to the suggested time. Include a short note explaining your choices, what you would do with more time, and any assumptions you made. That note is often weighed as heavily as the work itself.",
        ],
      },
      {
        heading: "Questions to ask them",
        paragraphs: ["Good questions also help you decide whether the job suits you:"],
        list: [
          "Which hours, if any, does the team overlap each day?",
          "How are decisions written down and shared?",
          "How do new hires get onboarded remotely?",
          "Is equipment or a home-office budget provided?",
          "How is performance measured?",
        ],
      },
      {
        heading: "Follow up in writing",
        paragraphs: [
          "Send a short thank-you email within a day. Mention one thing you discussed and restate why you are interested. It is a small piece of written communication, which is exactly the skill remote employers are looking for.",
        ],
      },
    ],
    related: [
      { label: "Working across time zones", to: "/guides/working-across-time-zones" },
      { label: "Writing a CV for remote roles", to: "/guides/remote-cv-guide" },
      { label: "Career advice articles", to: "/blog" },
    ],
  },
  {
    slug: "remote-cv-guide",
    title: "Writing a CV for remote roles",
    metaTitle: "How to Write a CV for Remote Jobs",
    metaDescription:
      "How to write a CV that works for remote jobs: what to highlight, how to show you work well on your own, and formatting that passes applicant tracking systems.",
    intro:
      "Remote roles attract applicants from many countries, so a CV has to stand out quickly and show that you can work well without an office around you. The basics of a good CV still apply. This guide covers what to change for remote applications.",
    sections: [
      {
        heading: "Put the essentials at the top",
        paragraphs: [
          "Start with your name, the job title you are aiming for, your email, a LinkedIn or portfolio link, and your country and time zone. The time zone matters: many remote employers hire only within certain hours, and stating yours saves them guessing.",
          "Add a two- or three-line summary that matches the role: who you are, your main strength, and the kind of remote work you have done.",
        ],
      },
      {
        heading: "Show you can work remotely",
        paragraphs: [
          "Hiring managers want evidence that you can manage your own time, communicate in writing and deliver without close supervision. Show it in your experience bullets rather than claiming it in a skills list:",
        ],
        list: [
          "\"Led a four-person team across three time zones, with weekly written plans and asynchronous reviews.\"",
          "\"Wrote the onboarding guide used by every new hire in the support team.\"",
          "\"Shipped a payments integration on my own, working with a client team in another country.\"",
        ],
      },
      {
        heading: "Focus on results",
        paragraphs: [
          "Each bullet should say what you did and what changed because of it. Numbers help: revenue, time saved, tickets resolved, satisfaction scores, users reached. If you can't share exact figures, use rough ones or percentages.",
        ],
      },
      {
        heading: "Mention the tools",
        paragraphs: [
          "Remote teams depend on shared tools. Listing the ones you know well, such as Slack, Notion, Jira, Asana, GitHub, Figma or Google Workspace, tells employers you will settle in quickly. Group them in a short tools line instead of scattering them through the CV.",
        ],
      },
      {
        heading: "Format for applicant tracking systems",
        paragraphs: [
          "Most companies on Eplicant use an applicant tracking system that reads your CV before a person does. Keep the layout simple so it reads correctly:",
        ],
        list: [
          "A single column, with standard headings like Experience, Education and Skills.",
          "No text inside images, tables or text boxes.",
          "A PDF or Word file unless the listing asks for something else.",
          "Words from the job description where they honestly describe your experience.",
        ],
      },
      {
        heading: "Tailor every application",
        paragraphs: [
          "Remote listings get many applicants, so a generic CV is easy to pass over. Spend ten minutes per application adjusting your summary and reordering bullets so the most relevant experience comes first. Keep it to one or two pages.",
        ],
      },
    ],
    related: [
      { label: "Remote job interview tips", to: "/guides/remote-job-interview-tips" },
      { label: "How to find a legitimate remote job", to: "/guides/find-legitimate-remote-jobs" },
      { label: "Browse remote jobs", to: "/" },
    ],
  },
  {
    slug: "remote-salary-guide",
    title: "Remote salary guide",
    metaTitle: "Remote Salary Guide: What Remote Jobs Pay",
    metaDescription:
      "How remote salaries are set, why pay differs by location, and how to use real salary ranges from live remote listings to negotiate.",
    intro:
      "Remote salaries vary more than office salaries because employers handle location differently. Two people doing the same job for the same company can be paid very differently depending on where they live. This guide explains how remote pay is set and how to use real data when you negotiate.",
    sections: [
      {
        heading: "The three ways companies set remote pay",
        paragraphs: ["Most employers follow one of three models:"],
        list: [
          "Location-based pay: salary is adjusted to the cost of labour where you live. This is the most common model at large companies.",
          "Single global rate: everyone in the same role and level is paid the same, wherever they live. This is less common and popular with remote-first startups.",
          "Regional bands: a small number of pay zones, such as US, Europe and the rest of the world.",
        ],
      },
      {
        heading: "Use published ranges, not guesses",
        paragraphs: [
          "Pay transparency laws in places like California, New York, Colorado and parts of Europe require many employers to publish a salary range. These ranges are the best evidence you can get, because they show what companies actually plan to pay.",
          "Eplicant's salary insights page collects the published ranges from live remote listings and groups them by job family and level, so you can see what employers are offering right now.",
        ],
      },
      {
        heading: "How level affects pay",
        paragraphs: [
          "Level often matters more than job family. The gap between a mid-level and senior role is usually larger than the gap between two similar fields at the same level. Read the job description to work out the level: years of experience, scope of responsibility, and whether you would lead others.",
        ],
      },
      {
        heading: "Look at the whole offer",
        paragraphs: ["Base salary is only part of the package. Compare:"],
        list: [
          "Equity or bonuses, and how they are paid out.",
          "Paid leave and public holiday rules.",
          "Health cover and pension contributions, which vary a lot for contractors.",
          "Home-office and equipment budgets.",
          "Whether you are an employee, a contractor or hired through an employer of record. Contractors usually pay their own taxes and benefits.",
        ],
      },
      {
        heading: "Negotiating a remote offer",
        paragraphs: [
          "Give a range based on published data for similar roles, and set its lower end at a figure you would happily accept. If the employer uses location-based pay, ask which band you fall into and how it is calculated. Ask politely and back it with evidence; most remote employers expect it.",
        ],
      },
      {
        heading: "Watch the currency",
        paragraphs: [
          "Many remote roles pay in US dollars, euros or pounds. Ask which currency you will be paid in, how often, and who pays transfer fees. Exchange rate swings can change your real income over a year.",
        ],
      },
    ],
    related: [
      { label: "Remote salary insights", to: "/tools" },
      { label: "Remote job interview tips", to: "/guides/remote-job-interview-tips" },
      { label: "Browse remote jobs", to: "/" },
    ],
  },
  {
    slug: "working-across-time-zones",
    title: "Working across time zones",
    metaTitle: "Working Across Time Zones: A Guide for Remote Workers",
    metaDescription:
      "Practical habits for working across time zones on a remote team: overlap hours, asynchronous communication, handovers and protecting your own time.",
    intro:
      "Many remote teams are spread across several time zones. That can mean fewer meetings and long stretches of focused work, but only if the team handles it well. This guide covers habits that help you work well with colleagues who may be asleep while you work.",
    sections: [
      {
        heading: "Know your overlap",
        paragraphs: [
          "Find out which hours you share with your manager and closest teammates. Even two hours of overlap is enough for quick questions and occasional calls if the rest of the work is written down. Put your working hours in your calendar and chat profile so people know when to expect a reply.",
        ],
      },
      {
        heading: "Default to asynchronous communication",
        paragraphs: [
          "When people can't reply straight away, each message has to stand on its own. Write messages someone can act on without a follow-up question:",
        ],
        list: [
          "State the context, the question and the deadline in one message.",
          "Link to the relevant document, ticket or file.",
          "Suggest an answer: \"I plan to do X unless you object by Thursday.\"",
          "Use threads so discussions stay together and are easy to find later.",
        ],
      },
      {
        heading: "Write good handovers",
        paragraphs: [
          "At the end of your day, leave a short note for colleagues starting theirs: what you finished, what's in progress, what's blocked and what you need from them. This simple habit can save a team a whole day of waiting.",
        ],
      },
      {
        heading: "Make meetings count",
        paragraphs: [
          "Keep meetings for discussions that really need live conversation. Share an agenda in advance, record the call or take notes for people who couldn't attend, and rotate meeting times so the same people aren't always on early or late calls.",
        ],
      },
      {
        heading: "Protect your own time",
        paragraphs: [
          "Working with other time zones can stretch your day. Set clear start and finish times, turn off notifications outside them, and agree with your team how real emergencies reach you. Being reliable within your hours is worth more than being always available.",
        ],
      },
      {
        heading: "Tools that help",
        paragraphs: [
          "A world clock in your calendar, scheduled messages so you don't wake colleagues, and a shared document for decisions make cross-time-zone work much easier. Most teams already have these tools; using them consistently is what makes the difference.",
        ],
      },
    ],
    related: [
      { label: "Remote job interview tips", to: "/guides/remote-job-interview-tips" },
      { label: "Remote salary guide", to: "/guides/remote-salary-guide" },
      { label: "Browse remote jobs", to: "/" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
