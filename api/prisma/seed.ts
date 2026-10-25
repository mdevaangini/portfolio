// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: seed.ts
// Fills the projects, experience and skills tables with my CV data. Run: `npm run seed`.
// WRITE flow, run once by me: seed.ts → Prisma → Postgres. Safe to re-run (clears first).
// ──────────────────────────────────────────────────────────────────────

/**
 * Seed script: fills the Projects, Experience and Skills tables with my CV data.
 *
 * Run it with:  npm run seed
 *
 * Safe to run again: it first clears these tables, then adds everything fresh,
 * so I never get duplicates. It does NOT touch the messages table
 * (those are real messages from visitors).
 */
import { prisma } from "../src/db/prisma.js";

// ── Projects (copied from my local database, 2026-10-25) ─────────────────
const projects = [
  {
    title: "Flexipay — Digital Payments & Mobile Money Platform",
    summary:
      "A scalable digital payments platform supporting peer-to-peer transfers, merchant payments, bill payments, and wallet top-ups with multi-currency support.",
    description:
      "Led frontend development of core payment flows, including fund transfers, bill payments, wallet management, and transaction history dashboards. Built reusable Angular components and reactive data flows for high-scale transaction workflows, supporting 69M+ annual transactions and 124K+ merchants.",
    category: "Payments",
    displayOrder: 1,
  },
  {
    title: "Arttha Product — Cloud-Native Digital Banking Platform",
    summary:
      "A cloud-native Banking-as-a-Service platform powering digital banking, payments, lending, and core banking capabilities across global markets.",
    description:
      "Delivered Angular features across Digital Wallet, Payments, Core Banking, BNPL, and Merchant Payments modules. Integrated 30+ REST APIs, implemented micro-frontend features, built reusable Angular Material and PrimeNG components, and improved page load performance by 60% through rendering and OnPush Change Detection optimization.",
    category: "Banking",
    displayOrder: 2,
  },
  {
    title: "Loan Origination System — Digital Lending Platform",
    summary:
      "An end-to-end digital lending platform covering loan applications, KYC, credit assessment, approval workflows, and disbursement.",
    description:
      "Developed dynamic multi-step Angular forms with complex validation, conditional rendering, and real-time error handling. Built loan approval and credit assessment interfaces integrated with backend decision-engine APIs, supporting lending decisions for 5M+ customers and contributing to journeys enabling $120M+ in loan disbursements.",
    category: "Lending",
    displayOrder: 3,
  },
];

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
  await prisma.project.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.skillGroup.deleteMany();

  // 2. Add the projects and the jobs, each list in one go.
  await prisma.project.createMany({ data: projects });
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

  const [projectCount, jobs, groups, skills] = await Promise.all([
    prisma.project.count(),
    prisma.experience.count(),
    prisma.skillGroup.count(),
    prisma.skill.count(),
  ]);
  console.log(`Seeded: ${projectCount} projects, ${jobs} jobs, ${groups} skill groups, ${skills} skills`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
