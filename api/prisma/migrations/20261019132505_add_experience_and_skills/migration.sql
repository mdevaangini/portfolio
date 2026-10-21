-- CreateTable
CREATE TABLE "experiences" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "company_note" TEXT,
    "location" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "skill_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "skill_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
