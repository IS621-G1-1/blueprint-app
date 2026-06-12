import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const modules = [
  {
    code: "IS621",
    name: "Agile and DevSecOps",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Practices for iterative delivery, secure software operations, and modern development workflows.",
    prerequisites: "Prior software project or programming experience recommended.",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Thu 7:00 PM - 10:15 PM",
    gradingBasis: "Project, quizzes, participation, and final presentation.",
    examDates: "No final exam",
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
    schedule: "Tue 7:00 PM - 10:15 PM",
    gradingBasis: "Case analysis, group project, and class participation.",
    examDates: "Final assessment during exam week",
  },
  {
    code: "IS615",
    name: "Digital Transformation Strategy",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Strategic planning methods for evaluating, shaping, and leading digital change.",
    prerequisites: "IS620 or equivalent digital transformation foundation.",
    termAvailability: ["Term 2"],
    schedule: "Mon 7:00 PM - 10:15 PM",
    gradingBasis: "Strategy memo, team project, and presentation.",
    examDates: null,
  },
  {
    code: "IS619",
    name: "Business Application of Digital Technology",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Applied digital technology use cases across business functions and operating models.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Special Term"],
    schedule: "Wed 7:00 PM - 10:15 PM",
    gradingBasis: "Individual assignment, group project, and reflection.",
    examDates: "Take-home assessment in Week 13",
  },
  {
    code: "CS101",
    name: "Programming Fundamentals",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Foundational programming constructs, problem solving, and software development basics.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Term 2", "Special Term"],
    schedule: "Mon/Wed 3:30 PM - 5:00 PM",
    gradingBasis: "Labs, assignments, midterm, and final exam.",
    examDates: "Final exam: 2026-11-24",
  },
  {
    code: "IS212",
    name: "Software Project Management",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Project planning, estimation, risk management, and delivery practices for software teams.",
    prerequisites: "Basic software engineering knowledge recommended.",
    termAvailability: ["Term 2"],
    schedule: "Fri 7:00 PM - 10:15 PM",
    gradingBasis: null,
    examDates: null,
  },
  {
    code: "IS213",
    name: "Enterprise Solution Development",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Design and development of enterprise applications using layered architectures.",
    prerequisites: "CS101 or equivalent programming background.",
    termAvailability: ["Term 1"],
    schedule: "Sat 9:00 AM - 12:15 PM",
    gradingBasis: "Coding assignments and capstone build.",
    examDates: "No final exam",
  },
  {
    code: "IS214",
    name: "Software Engineering",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Requirements, design, testing, and maintenance practices for reliable software systems.",
    prerequisites: "CS101 or equivalent programming background.",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Thu 3:30 PM - 6:45 PM",
    gradingBasis: "Team project, tests, and individual report.",
    examDates: "Final exam: 2026-11-27",
  },
  {
    code: "LAW101",
    name: "Business Law",
    credits: 1,
    school: "Yong Pung How School of Law",
    description:
      "Introduces legal principles that shape contracts, business obligations, and commercial decision-making.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Tue/Thu 12:00 PM - 1:30 PM",
    gradingBasis: "Class participation, written assignment, and final exam.",
    examDates: "Final exam: 2026-11-25",
  },
  {
    code: "ACCT101",
    name: "Financial Accounting",
    credits: 1,
    school: "School of Accountancy",
    description:
      "Covers core accounting concepts, financial statement preparation, and interpretation for business decisions.",
    prerequisites: "None",
    termAvailability: ["Term 1", "Term 2"],
    schedule: "Mon/Wed 10:00 AM - 11:30 AM",
    gradingBasis: "Quizzes, project, midterm, and final exam.",
    examDates: "Final exam: 2026-11-22",
  },
  {
    code: "ECON101",
    name: "Introductory Economics",
    credits: 1,
    school: "School of Economics",
    description:
      "Explores microeconomic and macroeconomic foundations for markets, policy, and organisational strategy.",
    prerequisites: "None",
    termAvailability: ["Term 1"],
    schedule: "Fri 8:30 AM - 11:45 AM",
    gradingBasis: "Problem sets, class participation, and final exam.",
    examDates: "Final exam: 2026-11-29",
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
