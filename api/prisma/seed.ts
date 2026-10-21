/**
 * Seed script: fills the Experience and Skills tables with my CV data.
 *
 * Run it with:  npm run seed
 *
 * Safe to run again: it first clears these tables, then adds everything fresh,
 * so I never get duplicates. It does NOT touch the projects table.
 */
import { prisma } from "../src/db/prisma.js";

// ── Experience (from the CV). endDate: null = current job ─────────────────
const experiences = [
  {
    title: "Software Engineer",
    company: "Happiest Minds",
    companyNote: "formerly PureSoftware",
    location: "Noida",
    summary:
      "Own end-to-end feature delivery on Arttha, from requirement scoping to production. Architect reusable component libraries, engineer RxJS data flows, and mentor 3–5 junior developers through code reviews and best practices.",
    startDate: new Date("2024-05-01"),
    endDate: null,
  },
  {
    title: "Frontend Engineer",
    company: "PureSoftware",
    companyNote: null,
    location: "Noida",
    summary:
      "Owned feature delivery across Angular modules on the Arttha platform. Built foundational component libraries, RESTful API integrations and reactive data flows that carried forward after the acquisition by Happiest Minds.",
    startDate: new Date("2022-07-01"),
    endDate: new Date("2024-05-01"),
  },
  {
    title: "Engineer Trainee",
    company: "PureSoftware",
    companyNote: null,
    location: "Noida",
    summary:
      "Developed scalable, accessible UI components with Angular and Angular Material across 15+ modules, using semantic HTML, keyboard navigation and ARIA attributes.",
    startDate: new Date("2022-01-01"),
    endDate: new Date("2022-06-01"),
  },
];

// ── Skills: each group with its list of skills, in display order ─────────
const skillGroups = [
  { name: "Frontend", isCore: true, skills: ["Angular (15+)", "TypeScript", "JavaScript (ES6+)", "HTML5", "CSS3"] },
  { name: "State & reactivity", isCore: true, skills: ["RxJS", "NgRx", "Reactive programming"] },
  { name: "Architecture", isCore: false, skills: ["Micro-frontends", "Component-based design", "OnPush change detection"] },
  { name: "UI libraries", isCore: false, skills: ["Angular Material", "PrimeNG", "Bootstrap", "Tailwind CSS"] },
  {
    name: "Integration & accessibility",
    isCore: false,
    skills: ["REST APIs", "Async programming", "Semantic HTML", "ARIA", "Keyboard navigation"],
  },
  {
    name: "Tools, testing & process",
    isCore: false,
    skills: ["Git", "GitHub / Bitbucket", "Unit & component testing", "Agile / Scrum", "GitHub Copilot", "Claude Code"],
  },
];

async function main() {
  // 1. Clear old data. Deleting the groups also deletes their skills (onDelete: Cascade).
  await prisma.experience.deleteMany();
  await prisma.skillGroup.deleteMany();

  // 2. Add the jobs, all in one go.
  await prisma.experience.createMany({ data: experiences });

  // 3. Add each group TOGETHER with its skills ("nested create").
  //    Prisma saves the group, then saves the skills with group_id filled in for us.
  for (const [groupIndex, group] of skillGroups.entries()) {
    await prisma.skillGroup.create({
      data: {
        name: group.name,
        isCore: group.isCore,
        displayOrder: groupIndex + 1,
        skills: {
          create: group.skills.map((name, skillIndex) => ({ name, displayOrder: skillIndex + 1 })),
        },
      },
    });
  }

  const [jobs, groups, skills] = await Promise.all([
    prisma.experience.count(),
    prisma.skillGroup.count(),
    prisma.skill.count(),
  ]);
  console.log(`Seeded: ${jobs} jobs, ${groups} skill groups, ${skills} skills`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
