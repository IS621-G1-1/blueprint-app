ALTER TABLE "modules"
ADD COLUMN "prerequisites" TEXT,
ADD COLUMN "termAvailability" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "schedule" TEXT,
ADD COLUMN "gradingBasis" TEXT,
ADD COLUMN "examDates" TEXT;
