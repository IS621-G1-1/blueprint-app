import { Router } from "express";
import type { Request } from "express";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

const createSemesterPlanSchema = z.object({
  year: z.coerce.number().int().min(2000, "Year must be valid").max(2100, "Year must be valid"),
  term: z.string().trim().min(1, "Term is required").max(50, "Term is too long"),
});

const addModuleSchema = z.object({
  moduleId: z.string().uuid("Module is required"),
});

const includePlanDetails = {
  plannedModules: {
    orderBy: { createdAt: "asc" as const },
    include: {
      module: true,
    },
  },
};

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function getAuth(req: Request) {
  if (!req.auth) {
    throw new Error("Authenticated route missing auth context");
  }

  return req.auth;
}

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const auth = getAuth(req);
  const semesterPlans = await prisma.semesterPlan.findMany({
    where: { userId: auth.userId },
    include: includePlanDetails,
    orderBy: [{ year: "desc" }, { term: "asc" }],
  });

  return res.json({ semesterPlans });
}));

router.post("/", asyncHandler(async (req, res) => {
  try {
    const auth = getAuth(req);
    const data = createSemesterPlanSchema.parse(req.body);

    const semesterPlan = await prisma.semesterPlan.upsert({
      where: {
        userId_year_term: {
          userId: auth.userId,
          year: data.year,
          term: data.term,
        },
      },
      update: {},
      create: {
        userId: auth.userId,
        year: data.year,
        term: data.term,
      },
      include: includePlanDetails,
    });

    return res.status(200).json({
      message: "Semester plan loaded",
      semesterPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    throw error;
  }
}));

router.post("/:semesterPlanId/modules", asyncHandler(async (req, res) => {
  try {
    const auth = getAuth(req);
    const { semesterPlanId } = req.params;
    const data = addModuleSchema.parse(req.body);

    const semesterPlan = await prisma.semesterPlan.findFirst({
      where: {
        id: semesterPlanId,
        userId: auth.userId,
      },
    });

    if (!semesterPlan) {
      return res.status(404).json({ error: "Semester plan not found" });
    }

    const module = await prisma.module.findUnique({
      where: { id: data.moduleId },
    });

    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const existingPlannedModule = await prisma.plannedModule.findUnique({
      where: {
        semesterPlanId_moduleId: {
          semesterPlanId,
          moduleId: data.moduleId,
        },
      },
    });

    if (existingPlannedModule) {
      return res.status(409).json({ error: "This module is already in the selected semester plan" });
    }

    await prisma.plannedModule.create({
      data: {
        semesterPlanId,
        moduleId: data.moduleId,
      },
    });

    const updatedSemesterPlan = await prisma.semesterPlan.findUniqueOrThrow({
      where: { id: semesterPlanId },
      include: includePlanDetails,
    });

    return res.status(201).json({
      message: "Module added to semester plan",
      semesterPlan: updatedSemesterPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    throw error;
  }
}));

router.delete("/:semesterPlanId/modules/:plannedModuleId", asyncHandler(async (req, res) => {
  const auth = getAuth(req);
  const { semesterPlanId, plannedModuleId } = req.params;

  const semesterPlan = await prisma.semesterPlan.findFirst({
    where: {
      id: semesterPlanId,
      userId: auth.userId,
    },
  });

  if (!semesterPlan) {
    return res.status(404).json({ error: "Semester plan not found" });
  }

  const plannedModule = await prisma.plannedModule.findFirst({
    where: {
      id: plannedModuleId,
      semesterPlanId,
    },
  });

  if (!plannedModule) {
    return res.status(404).json({ error: "Planned module not found" });
  }

  await prisma.plannedModule.delete({
    where: { id: plannedModuleId },
  });

  return res.json({ message: "Module removed from semester plan" });
}));

export default router;
