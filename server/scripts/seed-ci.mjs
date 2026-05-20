// Seeder run inside the server container during CI.
// Creates the E2E test user; safe to re-run (upsert).
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const hash = await bcrypt.hash("password96", 10);

await prisma.user.upsert({
  where: { email: "ara@mitb.smu.edu.sg" },
  update: {},
  create: {
    email: "ara@mitb.smu.edu.sg",
    name: "aravinth",
    passwordHash: hash,
    role: "STUDENT",
    emailVerifiedAt: new Date(),
  },
});

await prisma.$disconnect();
console.log("CI test user seeded.");
