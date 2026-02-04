export type ServicePage = {
  slug: string;
  label: string;
  heroTag: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  exampleCalls: string[];
  faq: Array<{ q: string; a: string }>;
};

export const servicePages: ServicePage[] = [
  {
    slug: "plumbers",
    label: "Plumbers",
    heroTag: "Plumbing Answering Service",
    heroTitle: "Never miss another",
    heroHighlight: "plumbing call",
    heroSubtitle:
      "Ring Receptionist answers every call, qualifies the job, and books estimates so your crew can stay on the tools.",
    exampleCalls: ["Burst pipes", "Water heater failures", "Drain clogs"],
    faq: [
      {
        q: "Can it handle emergency plumbing calls?",
        a: "Yes. It flags urgent issues like flooding or no water and alerts your team immediately.",
      },
      {
        q: "Will it collect job details?",
        a: "It gathers the address, service needed, urgency, and any access notes so you can quote faster.",
      },
      {
        q: "Does it book appointments?",
        a: "Yes. It can book estimates based on your availability or just capture details for callbacks.",
      },
    ],
  },
  {
    slug: "hvac",
    label: "HVAC",
    heroTag: "HVAC Answering Service",
    heroTitle: "Never miss another",
    heroHighlight: "HVAC call",
    heroSubtitle:
      "Ring Receptionist answers after-hours and weekend calls, qualifies the issue, and keeps your schedule full.",
    exampleCalls: ["No heat", "AC not cooling", "Furnace repair"],
    faq: [
      {
        q: "Can it detect urgent HVAC issues?",
        a: "Yes. It prioritizes emergencies like no heat, no AC, or safety concerns.",
      },
      {
        q: "Will customers think it's a real receptionist?",
        a: "Yes. The voice is natural, professional, and conversational.",
      },
      {
        q: "What details does it capture?",
        a: "Contact info, service address, issue description, urgency, and availability.",
      },
    ],
  },
  {
    slug: "electricians",
    label: "Electricians",
    heroTag: "Electrical Answering Service",
    heroTitle: "Never miss another",
    heroHighlight: "electrical call",
    heroSubtitle:
      "Ring Receptionist qualifies electrical jobs, flags hazards, and gets your team the details fast.",
    exampleCalls: ["Power outages", "Panel issues", "Outlet repairs"],
    faq: [
      {
        q: "Does it handle safety-related calls?",
        a: "Yes. It flags potential hazards and marks them urgent for quick follow-up.",
      },
      {
        q: "Can it collect job scope?",
        a: "It gathers service type, urgency, and any access constraints.",
      },
      {
        q: "Is it available 24/7?",
        a: "Yes. Every call is answered, even nights and weekends.",
      },
    ],
  },
  {
    slug: "movers",
    label: "Movers",
    heroTag: "Moving Answering Service",
    heroTitle: "Never miss another",
    heroHighlight: "moving lead",
    heroSubtitle:
      "Ring Receptionist captures move details, dates, and locations so your team can quote quickly.",
    exampleCalls: ["Local moves", "Long-distance moves", "Packing help"],
    faq: [
      {
        q: "Will it collect move details?",
        a: "Yes. It captures addresses, move size, dates, and special requirements.",
      },
      {
        q: "Can it filter spam calls?",
        a: "Absolutely. It screens out robocalls and non-serious inquiries.",
      },
      {
        q: "Does it support multiple crews?",
        a: "Yes. It scales for higher call volume and concurrent calls.",
      },
    ],
  },
  {
    slug: "tree",
    label: "Tree Services",
    heroTag: "Tree Service Answering",
    heroTitle: "Never miss another",
    heroHighlight: "tree service call",
    heroSubtitle:
      "Ring Receptionist answers every call, qualifies hazards, and schedules estimates for your tree crew.",
    exampleCalls: ["Storm damage", "Tree removal", "Stump grinding"],
    faq: [
      {
        q: "Can it recognize hazardous tree calls?",
        a: "Yes. It flags urgent hazards and marks them for priority follow-up.",
      },
      {
        q: "Will it gather job details?",
        a: "It collects service type, urgency, and any access considerations.",
      },
      {
        q: "Can I review transcripts?",
        a: "Yes. Every call is transcribed and summarized in your dashboard.",
      },
    ],
  },
];

export const getServicePage = (slug: string) =>
  servicePages.find((page) => page.slug === slug);
