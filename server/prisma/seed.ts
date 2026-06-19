import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const modules = [
  {
    code: "IS610",
    name: "Digital Transformation Strategy",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Frameworks for shaping digital transformation portfolios, operating models, and technology-enabled business change.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Mon 7:00 PM - 10:15 PM",
    gradingBasis: "Strategy memo, case analysis, group project, and presentation.",
    examDates: "No final exam",
  },
  {
    code: "IS611",
    name: "Digital Business Models",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Analysis of platform, ecosystem, and data-enabled business models for digital enterprises.",
    prerequisites: "None",
    termAvailability: ["Term 1"],
    schedule: "Tue 7:00 PM - 10:15 PM",
    gradingBasis: "Case discussions, business model canvas, and team pitch.",
    examDates: null,
  },
  {
    code: "IS612",
    name: "Business Process Re-engineering",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Methods for redesigning business processes with automation, analytics, and enterprise systems.",
    prerequisites: "None",
    termAvailability: ["Term 2"],
    schedule: "Wed 7:00 PM - 10:15 PM",
    gradingBasis: "Process mapping assignment, simulation exercise, and final report.",
    examDates: "Take-home assessment in Week 13",
  },
  {
    code: "IS613",
    name: "Business Requirements Mapping",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Elicitation, modelling, and prioritisation techniques for translating business needs into digital solution requirements.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Special Term"],
    schedule: "Thu 7:00 PM - 10:15 PM",
    gradingBasis: "Requirements portfolio, stakeholder workshop, and participation.",
    examDates: null,
  },
  {
    code: "IS614",
    name: "Enterprise Architecture for Digital Transformation",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Enterprise architecture principles for aligning applications, data, infrastructure, and transformation roadmaps.",
    prerequisites: "Basic information systems knowledge recommended.",
    termAvailability: ["Term 1"],
    schedule: "Fri 7:00 PM - 10:15 PM",
    gradingBasis: "Architecture review, group blueprint, and presentation.",
    examDates: "No final exam",
  },
  {
    code: "IS615",
    name: "Technology Assessment",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Evaluation of emerging technologies for feasibility, business value, adoption risk, and implementation readiness.",
    prerequisites: "None",
    termAvailability: ["Term 2"],
    schedule: "Sat 9:00 AM - 12:15 PM",
    gradingBasis: "Technology brief, assessment rubric, and final recommendation.",
    examDates: null,
  },
  {
    code: "IS616",
    name: "Emerging Technology Synthesis",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Synthesis of emerging technology trends into practical digital transformation opportunities.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Mon 3:30 PM - 6:45 PM",
    gradingBasis: "Trend analysis, prototype concept, and reflective essay.",
    examDates: "No final exam",
  },
  {
    code: "IS617",
    name: "Digital Strategies",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Strategic planning tools for digital channels, data products, transformation governance, and value capture.",
    prerequisites: "None",
    termAvailability: ["Term 2"],
    schedule: "Tue 7:00 PM - 10:15 PM",
    gradingBasis: "Case analysis, strategy deck, and class participation.",
    examDates: "Final assessment during exam week",
  },
  {
    code: "IS618",
    name: "Business Intelligence and Data Analytics",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Use of business intelligence, dashboards, and analytics workflows to support transformation decision-making.",
    prerequisites: "Introductory statistics or analytics experience recommended.",
    termAvailability: ["Term 1"],
    schedule: "Wed 7:00 PM - 10:15 PM",
    gradingBasis: "Analytics labs, dashboard project, and final presentation.",
    examDates: null,
  },
  {
    code: "IS619",
    name: "Business Application of Digital Technology",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Applied digital technology use cases across business functions, customer journeys, and operating models.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Special Term"],
    schedule: "Thu 7:00 PM - 10:15 PM",
    gradingBasis: "Individual assignment, group project, and reflection.",
    examDates: "Take-home assessment in Week 13",
  },
  {
    code: "IS620",
    name: "Digital Transformation",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Core concepts and implementation approaches for technology-led business transformation.",
    prerequisites: "None",
    termAvailability: ["Term 1"],
    schedule: "Fri 7:00 PM - 10:15 PM",
    gradingBasis: "Case analysis, group project, and class participation.",
    examDates: "Final assessment during exam week",
  },
  {
    code: "IS621",
    name: "Agile and DevSecOps",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Practices for iterative delivery, secure software operations, and modern development workflows.",
    prerequisites: "Prior software project or programming experience recommended.",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Sat 1:00 PM - 4:15 PM",
    gradingBasis: "Project, quizzes, participation, and final presentation.",
    examDates: "No final exam",
  },
  {
    code: "IS622",
    name: "Text Analytics and Processing",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Natural language processing and text analytics techniques for extracting business insight from unstructured data.",
    prerequisites: "Basic programming or analytics experience recommended.",
    termAvailability: ["Term 2"],
    schedule: "Mon/Wed 3:30 PM - 5:00 PM",
    gradingBasis: "Labs, applied analytics project, and quiz.",
    examDates: null,
  },
  {
    code: "IS623",
    name: "Financial Technology and Innovation",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Digital finance innovation, fintech platforms, payment systems, and technology-enabled financial services.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Tue/Thu 12:00 PM - 1:30 PM",
    gradingBasis: "Case brief, fintech concept pitch, and final report.",
    examDates: "No final exam",
  },
  {
    code: "IS624",
    name: "Digital Marketing",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Digital marketing capabilities, customer analytics, campaign design, and channel transformation.",
    prerequisites: "None",
    termAvailability: ["Special Term"],
    schedule: "Fri 8:30 AM - 11:45 AM",
    gradingBasis: "Campaign plan, analytics reflection, and group presentation.",
    examDates: null,
  },
];

async function main() {
  for (const moduleData of modules) {
    await prisma.module.upsert({
      where: { code: moduleData.code },
      update: moduleData,
      create: moduleData,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
