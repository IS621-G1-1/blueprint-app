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
  },
  {
    code: "IS620",
    name: "Digital Transformation",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Core concepts and implementation approaches for technology-led business transformation.",
  },
  {
    code: "IS615",
    name: "Digital Transformation Strategy",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Strategic planning methods for evaluating, shaping, and leading digital change.",
  },
  {
    code: "IS619",
    name: "Business Application of Digital Technology",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Applied digital technology use cases across business functions and operating models.",
  },
  {
    code: "CS101",
    name: "Programming Fundamentals",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Foundational programming constructs, problem solving, and software development basics.",
  },
  {
    code: "IS212",
    name: "Software Project Management",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Project planning, estimation, risk management, and delivery practices for software teams.",
  },
  {
    code: "IS213",
    name: "Enterprise Solution Development",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Design and development of enterprise applications using layered architectures.",
  },
  {
    code: "IS214",
    name: "Software Engineering",
    credits: 1,
    school: "School of Computing and Information Systems",
    description:
      "Requirements, design, testing, and maintenance practices for reliable software systems.",
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
