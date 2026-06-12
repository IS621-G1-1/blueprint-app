CREATE TABLE "watchlist_items" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "moduleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "watchlist_items_userId_moduleId_key"
ON "watchlist_items" ("userId", "moduleId");

ALTER TABLE "watchlist_items"
ADD CONSTRAINT "watchlist_items_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "watchlist_items"
ADD CONSTRAINT "watchlist_items_moduleId_fkey"
FOREIGN KEY ("moduleId") REFERENCES "modules"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
