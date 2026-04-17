import {
  PrismaClient,
  CompanyType,
  DepartmentKind,
  UserRole,
  EmployeeStatus,
  TaskStatus,
  TaskPriority,
  ProjectStatus,
  Prisma,
} from "@prisma/client";

const db = new PrismaClient();

type CompanySeed = {
  type: CompanyType;
  name: string;
  legalName: string;
  domain: string;
  brandColor: string;
  description: string;
};

type DepartmentSeed = {
  companyType: CompanyType;
  kind: DepartmentKind;
  name: string;
  code: string;
  color: string;
  description: string;
};

type RoleSeed = {
  name: string;
  description: string;
  seniority: string;
  departmentCode: string;
  permissions: string[];
};

type EmployeeSeed = {
  email: string;
  firstName: string;
  lastName: string;
  companyType: CompanyType;
  departmentCode: string;
  roleName: string;
  position: string;
  userRole: UserRole;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  workLocation: "REMOTE" | "HYBRID" | "ONSITE";
  hireDate: string;
  salary: number;
  managerEmail?: string;
  skills: string[];
  bio?: string;
  phone?: string;
  city: string;
  country: string;
  timezone: string;
};

const COMPANIES: CompanySeed[] = [
  {
    type: "DPL",
    name: "Digital Point LLC",
    legalName: "Digital Point LLC",
    domain: "digitalpointllc.com",
    brandColor: "#F59E0B",
    description: "Digital agency delivering web, AI, and growth engineering.",
  },
  {
    type: "VCS",
    name: "Virtual Customer Solutions",
    legalName: "Virtual Customer Solutions LLC",
    domain: "virtualcustomersolution.com",
    brandColor: "#D4AF37",
    description: "Outsourced customer support, CSM, and ops teams.",
  },
  {
    type: "BSL",
    name: "Backup Solutions",
    legalName: "Backup Solutions LLC",
    domain: "backupsolutions.com",
    brandColor: "#E5C158",
    description: "Data protection, disaster recovery, and cloud backup SaaS.",
  },
];

const DEPARTMENTS: DepartmentSeed[] = [
  // DPL
  { companyType: "DPL", kind: "EXECUTIVE", name: "Executive", code: "DPL-EXEC", color: "#F59E0B", description: "Leadership and strategy" },
  { companyType: "DPL", kind: "ENGINEERING", name: "Engineering", code: "DPL-ENG", color: "#3B82F6", description: "Product and platform engineering" },
  { companyType: "DPL", kind: "DESIGN", name: "Design", code: "DPL-DSN", color: "#A855F7", description: "Product design and brand" },
  { companyType: "DPL", kind: "SALES", name: "Sales", code: "DPL-SAL", color: "#22C55E", description: "New business and growth" },
  { companyType: "DPL", kind: "MARKETING", name: "Marketing", code: "DPL-MKT", color: "#EC4899", description: "Demand gen and content" },
  // VCS
  { companyType: "VCS", kind: "SUPPORT", name: "Support", code: "VCS-SUP", color: "#06B6D4", description: "Customer support and success" },
  { companyType: "VCS", kind: "OPERATIONS", name: "Operations", code: "VCS-OPS", color: "#F59E0B", description: "Workforce scheduling and QA" },
  { companyType: "VCS", kind: "EXECUTIVE", name: "Executive", code: "VCS-EXEC", color: "#D4AF37", description: "Leadership" },
  // BSL
  { companyType: "BSL", kind: "ENGINEERING", name: "Engineering", code: "BSL-ENG", color: "#3B82F6", description: "Backup and storage platform" },
  { companyType: "BSL", kind: "SUPPORT", name: "Support", code: "BSL-SUP", color: "#06B6D4", description: "Customer support" },
  { companyType: "BSL", kind: "EXECUTIVE", name: "Executive", code: "BSL-EXEC", color: "#E5C158", description: "Leadership" },
];

const ROLES: RoleSeed[] = [
  { name: "CEO", description: "Chief Executive Officer", seniority: "EXECUTIVE", departmentCode: "DPL-EXEC", permissions: ["*"] },
  { name: "CTO", description: "Chief Technology Officer", seniority: "EXECUTIVE", departmentCode: "DPL-EXEC", permissions: ["*"] },
  { name: "VP Operations", description: "Vice President of Operations", seniority: "EXECUTIVE", departmentCode: "VCS-EXEC", permissions: ["*"] },
  { name: "Engineering Manager", description: "Team lead for engineering", seniority: "LEAD", departmentCode: "DPL-ENG", permissions: ["employees.read", "employees.update"] },
  { name: "Senior Engineer", description: "Experienced engineer", seniority: "SENIOR", departmentCode: "DPL-ENG", permissions: ["employees.read"] },
  { name: "Software Engineer", description: "Mid-level engineer", seniority: "MID", departmentCode: "DPL-ENG", permissions: [] },
  { name: "Product Designer", description: "UX/UI designer", seniority: "MID", departmentCode: "DPL-DSN", permissions: [] },
  { name: "Account Executive", description: "Sales executive", seniority: "MID", departmentCode: "DPL-SAL", permissions: ["clients.read"] },
  { name: "Growth Marketer", description: "Growth and demand gen", seniority: "MID", departmentCode: "DPL-MKT", permissions: [] },
  { name: "Support Agent", description: "Tier 1 customer support", seniority: "JUNIOR", departmentCode: "VCS-SUP", permissions: ["tickets.read", "tickets.update"] },
  { name: "Support Lead", description: "Shift lead", seniority: "LEAD", departmentCode: "VCS-SUP", permissions: ["tickets.read", "tickets.update", "employees.read"] },
  { name: "QA Specialist", description: "Quality assurance", seniority: "MID", departmentCode: "VCS-OPS", permissions: [] },
  { name: "Backend Engineer", description: "Storage platform eng", seniority: "MID", departmentCode: "BSL-ENG", permissions: [] },
  { name: "Support Engineer", description: "Technical support", seniority: "MID", departmentCode: "BSL-SUP", permissions: ["tickets.read", "tickets.update"] },
];

const EMPLOYEES: EmployeeSeed[] = [
  // DPL executive + engineering
  {
    email: "umer@digitalpointllc.com",
    firstName: "Umer",
    lastName: "Farooq",
    companyType: "DPL", departmentCode: "DPL-EXEC", roleName: "CEO", position: "Chief Executive Officer",
    userRole: "OWNER", employmentType: "FULL_TIME", workLocation: "HYBRID",
    hireDate: "2023-01-02", salary: 180000, skills: ["strategy", "leadership", "sales"],
    bio: "Founder and CEO, ex-tech lead.", phone: "+1-415-555-0100",
    city: "San Francisco", country: "USA", timezone: "America/Los_Angeles",
  },
  {
    email: "faizan@digitalpointllc.com",
    firstName: "Faizan",
    lastName: "Rafiq",
    companyType: "DPL", departmentCode: "DPL-ENG", roleName: "CTO", position: "Chief Technology Officer",
    userRole: "OWNER", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2023-01-15", salary: 170000, skills: ["typescript", "next.js", "ai", "architecture"],
    bio: "CTO. Full-stack + AI engineer.", phone: "+92-300-555-0101",
    city: "Lahore", country: "Pakistan", timezone: "Asia/Karachi",
  },
  {
    email: "sarah.khan@digitalpointllc.com",
    firstName: "Sarah",
    lastName: "Khan",
    companyType: "DPL", departmentCode: "DPL-ENG", roleName: "Engineering Manager", position: "Engineering Manager",
    userRole: "MANAGER", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2023-06-01", salary: 140000, managerEmail: "faizan@digitalpointllc.com",
    skills: ["node.js", "react", "team-lead"], bio: "Leads the platform team.",
    phone: "+92-300-555-0102", city: "Karachi", country: "Pakistan", timezone: "Asia/Karachi",
  },
  {
    email: "ali.raza@digitalpointllc.com",
    firstName: "Ali",
    lastName: "Raza",
    companyType: "DPL", departmentCode: "DPL-ENG", roleName: "Senior Engineer", position: "Senior Software Engineer",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2023-09-15", salary: 110000, managerEmail: "sarah.khan@digitalpointllc.com",
    skills: ["typescript", "postgres", "aws"], bio: "Backend specialist.",
    phone: "+92-300-555-0103", city: "Islamabad", country: "Pakistan", timezone: "Asia/Karachi",
  },
  {
    email: "priya.sharma@digitalpointllc.com",
    firstName: "Priya",
    lastName: "Sharma",
    companyType: "DPL", departmentCode: "DPL-ENG", roleName: "Software Engineer", position: "Software Engineer",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "HYBRID",
    hireDate: "2024-02-01", salary: 85000, managerEmail: "sarah.khan@digitalpointllc.com",
    skills: ["react", "tailwind", "next.js"], bio: "Frontend engineer.",
    phone: "+91-98-555-0104", city: "Bangalore", country: "India", timezone: "Asia/Kolkata",
  },
  {
    email: "marcus.silva@digitalpointllc.com",
    firstName: "Marcus",
    lastName: "Silva",
    companyType: "DPL", departmentCode: "DPL-ENG", roleName: "Software Engineer", position: "Software Engineer",
    userRole: "EMPLOYEE", employmentType: "CONTRACT", workLocation: "REMOTE",
    hireDate: "2024-04-10", salary: 90000, managerEmail: "sarah.khan@digitalpointllc.com",
    skills: ["python", "ml", "fastapi"], bio: "ML + backend contractor.",
    phone: "+55-11-555-0105", city: "São Paulo", country: "Brazil", timezone: "America/Sao_Paulo",
  },
  {
    email: "liam.oconnor@digitalpointllc.com",
    firstName: "Liam",
    lastName: "O'Connor",
    companyType: "DPL", departmentCode: "DPL-DSN", roleName: "Product Designer", position: "Senior Product Designer",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "HYBRID",
    hireDate: "2023-11-01", salary: 95000, managerEmail: "umer@digitalpointllc.com",
    skills: ["figma", "prototyping", "design-systems"], bio: "Design systems + brand.",
    phone: "+353-1-555-0106", city: "Dublin", country: "Ireland", timezone: "Europe/Dublin",
  },
  {
    email: "nora.ahmed@digitalpointllc.com",
    firstName: "Nora",
    lastName: "Ahmed",
    companyType: "DPL", departmentCode: "DPL-SAL", roleName: "Account Executive", position: "Senior Account Executive",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2024-01-08", salary: 80000, managerEmail: "umer@digitalpointllc.com",
    skills: ["sales", "outbound", "closing"], bio: "Senior AE for North America.",
    phone: "+1-512-555-0107", city: "Austin", country: "USA", timezone: "America/Chicago",
  },
  {
    email: "jonah.kim@digitalpointllc.com",
    firstName: "Jonah",
    lastName: "Kim",
    companyType: "DPL", departmentCode: "DPL-MKT", roleName: "Growth Marketer", position: "Growth Marketing Lead",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2024-03-01", salary: 82000, managerEmail: "umer@digitalpointllc.com",
    skills: ["seo", "paid-ads", "analytics"], bio: "B2B growth specialist.",
    phone: "+1-646-555-0108", city: "New York", country: "USA", timezone: "America/New_York",
  },
  // VCS
  {
    email: "anita.patel@virtualcustomersolution.com",
    firstName: "Anita",
    lastName: "Patel",
    companyType: "VCS", departmentCode: "VCS-EXEC", roleName: "VP Operations", position: "VP of Operations",
    userRole: "ADMIN", employmentType: "FULL_TIME", workLocation: "HYBRID",
    hireDate: "2023-03-01", salary: 160000, skills: ["operations", "leadership"],
    bio: "Runs VCS operations.", phone: "+1-302-555-0110",
    city: "Wilmington", country: "USA", timezone: "America/New_York",
  },
  {
    email: "ravi.mehta@virtualcustomersolution.com",
    firstName: "Ravi",
    lastName: "Mehta",
    companyType: "VCS", departmentCode: "VCS-SUP", roleName: "Support Lead", position: "Support Team Lead",
    userRole: "MANAGER", employmentType: "FULL_TIME", workLocation: "ONSITE",
    hireDate: "2023-05-15", salary: 72000, managerEmail: "anita.patel@virtualcustomersolution.com",
    skills: ["zendesk", "team-lead", "escalations"], bio: "APAC shift lead.",
    phone: "+91-98-555-0111", city: "Mumbai", country: "India", timezone: "Asia/Kolkata",
  },
  {
    email: "zara.hussain@virtualcustomersolution.com",
    firstName: "Zara",
    lastName: "Hussain",
    companyType: "VCS", departmentCode: "VCS-SUP", roleName: "Support Agent", position: "Support Agent",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "ONSITE",
    hireDate: "2024-05-20", salary: 48000, managerEmail: "ravi.mehta@virtualcustomersolution.com",
    skills: ["zendesk", "english", "urdu"], bio: "Tier 1 support.",
    phone: "+92-321-555-0112", city: "Lahore", country: "Pakistan", timezone: "Asia/Karachi",
  },
  {
    email: "diego.fernandez@virtualcustomersolution.com",
    firstName: "Diego",
    lastName: "Fernández",
    companyType: "VCS", departmentCode: "VCS-SUP", roleName: "Support Agent", position: "Support Agent",
    userRole: "EMPLOYEE", employmentType: "PART_TIME", workLocation: "REMOTE",
    hireDate: "2024-06-05", salary: 32000, managerEmail: "ravi.mehta@virtualcustomersolution.com",
    skills: ["spanish", "english", "crm"], bio: "LATAM support.",
    phone: "+52-55-555-0113", city: "Mexico City", country: "Mexico", timezone: "America/Mexico_City",
  },
  {
    email: "fatima.yusuf@virtualcustomersolution.com",
    firstName: "Fatima",
    lastName: "Yusuf",
    companyType: "VCS", departmentCode: "VCS-OPS", roleName: "QA Specialist", position: "QA Specialist",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2024-08-15", salary: 58000, managerEmail: "anita.patel@virtualcustomersolution.com",
    skills: ["qa", "auditing", "process"], bio: "Call + ticket QA.",
    phone: "+92-321-555-0114", city: "Islamabad", country: "Pakistan", timezone: "Asia/Karachi",
  },
  // BSL
  {
    email: "daniel.park@backupsolutions.com",
    firstName: "Daniel",
    lastName: "Park",
    companyType: "BSL", departmentCode: "BSL-EXEC", roleName: "CTO", position: "Chief Technology Officer",
    userRole: "ADMIN", employmentType: "FULL_TIME", workLocation: "HYBRID",
    hireDate: "2023-02-15", salary: 165000, skills: ["storage", "aws", "leadership"],
    bio: "Heads BSL engineering.", phone: "+1-206-555-0120",
    city: "Seattle", country: "USA", timezone: "America/Los_Angeles",
  },
  {
    email: "mahnoor.ali@backupsolutions.com",
    firstName: "Mahnoor",
    lastName: "Ali",
    companyType: "BSL", departmentCode: "BSL-ENG", roleName: "Backend Engineer", position: "Senior Backend Engineer",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2023-08-10", salary: 115000, managerEmail: "daniel.park@backupsolutions.com",
    skills: ["go", "postgres", "distributed-systems"], bio: "Backend storage engineer.",
    phone: "+92-300-555-0121", city: "Karachi", country: "Pakistan", timezone: "Asia/Karachi",
  },
  {
    email: "samuel.okonkwo@backupsolutions.com",
    firstName: "Samuel",
    lastName: "Okonkwo",
    companyType: "BSL", departmentCode: "BSL-ENG", roleName: "Backend Engineer", position: "Backend Engineer",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "REMOTE",
    hireDate: "2024-07-01", salary: 88000, managerEmail: "mahnoor.ali@backupsolutions.com",
    skills: ["node.js", "postgres", "redis"], bio: "Junior backend engineer.",
    phone: "+234-80-555-0122", city: "Lagos", country: "Nigeria", timezone: "Africa/Lagos",
  },
  {
    email: "elena.martinez@backupsolutions.com",
    firstName: "Elena",
    lastName: "Martínez",
    companyType: "BSL", departmentCode: "BSL-SUP", roleName: "Support Engineer", position: "Support Engineer",
    userRole: "EMPLOYEE", employmentType: "FULL_TIME", workLocation: "HYBRID",
    hireDate: "2024-09-15", salary: 68000, managerEmail: "daniel.park@backupsolutions.com",
    skills: ["linux", "networking", "support"], bio: "Technical support engineer.",
    phone: "+34-91-555-0123", city: "Madrid", country: "Spain", timezone: "Europe/Madrid",
  },
];

async function seedCompanies() {
  for (const c of COMPANIES) {
    await db.company.upsert({
      where: { type: c.type },
      update: {
        name: c.name,
        legalName: c.legalName,
        domain: c.domain,
        brandColor: c.brandColor,
        description: c.description,
      },
      create: {
        type: c.type,
        name: c.name,
        legalName: c.legalName,
        domain: c.domain,
        brandColor: c.brandColor,
        description: c.description,
      },
    });
  }
  console.log(`  seeded ${COMPANIES.length} companies`);
}

async function seedDepartments() {
  for (const d of DEPARTMENTS) {
    const company = await db.company.findUniqueOrThrow({ where: { type: d.companyType } });
    await db.department.upsert({
      where: { companyId_name: { companyId: company.id, name: d.name } },
      update: { kind: d.kind, code: d.code, color: d.color, description: d.description },
      create: {
        companyId: company.id,
        kind: d.kind,
        name: d.name,
        code: d.code,
        color: d.color,
        description: d.description,
      },
    });
  }
  console.log(`  seeded ${DEPARTMENTS.length} departments`);
}

async function seedRoles() {
  for (const r of ROLES) {
    const dept = await db.department.findFirst({ where: { code: r.departmentCode } });
    if (!dept) continue;
    await db.role.upsert({
      where: { name_departmentId: { name: r.name, departmentId: dept.id } },
      update: {
        description: r.description,
        seniority: r.seniority,
        permissions: r.permissions,
      },
      create: {
        name: r.name,
        description: r.description,
        seniority: r.seniority,
        departmentId: dept.id,
        permissions: r.permissions,
      },
    });
  }
  console.log(`  seeded ${ROLES.length} roles`);
}

function employeeCodeFor(companyType: CompanyType, index: number): string {
  return `${companyType}-${String(index).padStart(4, "0")}`;
}

async function seedEmployees() {
  const counters: Record<CompanyType, number> = { DPL: 0, VCS: 0, BSL: 0 };

  for (const e of EMPLOYEES) {
    counters[e.companyType] += 1;
    const code = employeeCodeFor(e.companyType, counters[e.companyType]);
    const company = await db.company.findUniqueOrThrow({ where: { type: e.companyType } });
    const dept = await db.department.findFirstOrThrow({
      where: { companyId: company.id, code: e.departmentCode },
    });
    const role = await db.role.findFirst({
      where: { name: e.roleName, departmentId: dept.id },
    });

    const fullName = `${e.firstName} ${e.lastName}`;
    const clerkId = `seed_${e.email.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;

    const user = await db.user.upsert({
      where: { email: e.email },
      update: {
        firstName: e.firstName,
        lastName: e.lastName,
        fullName,
        phone: e.phone ?? null,
        role: e.userRole,
        isActive: true,
      },
      create: {
        clerkId,
        email: e.email,
        firstName: e.firstName,
        lastName: e.lastName,
        fullName,
        phone: e.phone ?? null,
        role: e.userRole,
        isActive: true,
      },
    });

    const managerId = await resolveManagerId(e.managerEmail);

    await db.employee.upsert({
      where: { userId: user.id },
      update: {
        companyId: company.id,
        departmentId: dept.id,
        roleId: role?.id ?? null,
        managerId,
        employeeCode: code,
        position: e.position,
        employmentType: e.employmentType,
        workLocation: e.workLocation,
        hireDate: new Date(e.hireDate),
        salary: e.salary,
        salaryCurrency: "USD",
        timezone: e.timezone,
        bio: e.bio ?? null,
        skills: e.skills,
        address: { city: e.city, country: e.country },
        status: "ACTIVE" as EmployeeStatus,
      },
      create: {
        userId: user.id,
        companyId: company.id,
        departmentId: dept.id,
        roleId: role?.id ?? null,
        managerId,
        employeeCode: code,
        position: e.position,
        employmentType: e.employmentType,
        workLocation: e.workLocation,
        hireDate: new Date(e.hireDate),
        salary: e.salary,
        salaryCurrency: "USD",
        timezone: e.timezone,
        bio: e.bio ?? null,
        skills: e.skills,
        address: { city: e.city, country: e.country },
        status: "ACTIVE",
      },
    });
  }
  console.log(`  seeded ${EMPLOYEES.length} employees across DPL/VCS/BSL`);
}

async function resolveManagerId(managerEmail?: string): Promise<string | null> {
  if (!managerEmail) return null;
  const mgrUser = await db.user.findUnique({ where: { email: managerEmail } });
  if (!mgrUser) return null;
  const mgrEmp = await db.employee.findUnique({ where: { userId: mgrUser.id } });
  return mgrEmp?.id ?? null;
}

async function seedDepartmentHeads() {
  const heads: Array<{ deptCode: string; email: string }> = [
    { deptCode: "DPL-EXEC", email: "umer@digitalpointllc.com" },
    { deptCode: "DPL-ENG", email: "faizan@digitalpointllc.com" },
    { deptCode: "VCS-EXEC", email: "anita.patel@virtualcustomersolution.com" },
    { deptCode: "VCS-SUP", email: "ravi.mehta@virtualcustomersolution.com" },
    { deptCode: "BSL-EXEC", email: "daniel.park@backupsolutions.com" },
    { deptCode: "BSL-ENG", email: "mahnoor.ali@backupsolutions.com" },
  ];
  for (const h of heads) {
    const user = await db.user.findUnique({ where: { email: h.email } });
    if (!user) continue;
    const emp = await db.employee.findUnique({ where: { userId: user.id } });
    if (!emp) continue;
    const dept = await db.department.findFirst({ where: { code: h.deptCode } });
    if (!dept) continue;
    await db.department.update({ where: { id: dept.id }, data: { headId: emp.id } });
  }
  console.log(`  assigned ${heads.length} department heads`);
}

async function main() {
  console.log("→ seeding Slice 1 (companies, departments, roles, employees)");
  await seedCompanies();
  await seedDepartments();
  await seedRoles();
  await seedEmployees();
  await seedDepartmentHeads();
  console.log("→ seeding Slice 2 (projects, labels, tasks, subtasks, comments, deps)");
  await seedSlice2();
  console.log("✔ seed complete (Slice 3 uses standalone prisma/seed.slice3.ts)");
}

type ProjectSeed = {
  code: string;
  name: string;
  companyType: CompanyType;
  status: ProjectStatus;
  color: string;
  leadEmail: string;
  description: string;
};

type LabelSeed = {
  companyType: CompanyType;
  projectCode?: string;
  name: string;
  color: string;
};

type TaskSeed = {
  title: string;
  description?: string;
  projectCode: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeEmail?: string;
  reporterEmail?: string;
  dueInDays?: number;
  estimatedHours?: number;
  labelNames?: string[];
  subtasks?: { title: string; done?: boolean }[];
  comments?: { authorEmail: string; content: string; daysAgo?: number }[];
  dependsOnTitles?: string[];
};

const PROJECTS: ProjectSeed[] = [
  {
    code: "DPL-CRM",
    name: "Alpha Command Center CRM",
    companyType: "DPL",
    status: "ACTIVE",
    color: "#F59E0B",
    leadEmail: "faizan@digitalpointllc.com",
    description: "Internal CRM powering all three brands.",
  },
  {
    code: "DPL-WEB",
    name: "Digital Point Web Refresh",
    companyType: "DPL",
    status: "ACTIVE",
    color: "#3B82F6",
    leadEmail: "liam.oconnor@digitalpointllc.com",
    description: "Marketing site redesign and CMS migration.",
  },
  {
    code: "DPL-SALES-Q2",
    name: "Q2 Pipeline Push",
    companyType: "DPL",
    status: "ACTIVE",
    color: "#22C55E",
    leadEmail: "nora.ahmed@digitalpointllc.com",
    description: "Outbound + inbound growth for Q2 2026.",
  },
  {
    code: "VCS-OPS-Q2",
    name: "Support Ops Q2",
    companyType: "VCS",
    status: "ACTIVE",
    color: "#06B6D4",
    leadEmail: "anita.patel@virtualcustomersolution.com",
    description: "Quality + SLA program upgrades for Q2.",
  },
  {
    code: "BSL-PLAT",
    name: "Backup Platform 2.0",
    companyType: "BSL",
    status: "ACTIVE",
    color: "#D4AF37",
    leadEmail: "daniel.park@backupsolutions.com",
    description: "Incremental backup engine + customer-portal uplift.",
  },
];

const LABELS: LabelSeed[] = [
  { companyType: "DPL", projectCode: "DPL-CRM", name: "frontend", color: "#3B82F6" },
  { companyType: "DPL", projectCode: "DPL-CRM", name: "backend", color: "#22C55E" },
  { companyType: "DPL", projectCode: "DPL-CRM", name: "bug", color: "#EF4444" },
  { companyType: "DPL", projectCode: "DPL-CRM", name: "infra", color: "#F59E0B" },
  { companyType: "DPL", projectCode: "DPL-WEB", name: "design", color: "#A855F7" },
  { companyType: "DPL", projectCode: "DPL-WEB", name: "seo", color: "#22C55E" },
  { companyType: "DPL", projectCode: "DPL-SALES-Q2", name: "outbound", color: "#F59E0B" },
  { companyType: "DPL", projectCode: "DPL-SALES-Q2", name: "inbound", color: "#3B82F6" },
  { companyType: "VCS", projectCode: "VCS-OPS-Q2", name: "sla", color: "#EF4444" },
  { companyType: "VCS", projectCode: "VCS-OPS-Q2", name: "qa", color: "#A855F7" },
  { companyType: "VCS", projectCode: "VCS-OPS-Q2", name: "training", color: "#22C55E" },
  { companyType: "BSL", projectCode: "BSL-PLAT", name: "platform", color: "#D4AF37" },
  { companyType: "BSL", projectCode: "BSL-PLAT", name: "reliability", color: "#EF4444" },
  { companyType: "BSL", projectCode: "BSL-PLAT", name: "customer", color: "#3B82F6" },
];

const TASKS: TaskSeed[] = [
  // DPL-CRM
  {
    title: "Ship Slice 1 employees module",
    description: "End-to-end employee directory with RBAC and audit.",
    projectCode: "DPL-CRM",
    status: "DONE",
    priority: "HIGH",
    assigneeEmail: "faizan@digitalpointllc.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: -1,
    estimatedHours: 18,
    labelNames: ["backend", "frontend"],
    subtasks: [
      { title: "Schema + migration", done: true },
      { title: "Service layer + RBAC", done: true },
      { title: "Kanban-equivalent list UI", done: true },
    ],
    comments: [
      {
        authorEmail: "umer@digitalpointllc.com",
        content: "Love the salary redaction flow. Ship it.",
        daysAgo: 1,
      },
    ],
  },
  {
    title: "Build task management kanban (Slice 2)",
    description: "Kanban board with drag-drop, filters, detail sheet.",
    projectCode: "DPL-CRM",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeEmail: "faizan@digitalpointllc.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: 0,
    estimatedHours: 24,
    labelNames: ["backend", "frontend"],
    subtasks: [
      { title: "Prisma schema + migration", done: true },
      { title: "Service layer + DAG validator", done: true },
      { title: "Kanban UI with dnd-kit", done: false },
      { title: "Detail sheet with tabs", done: false },
    ],
    comments: [
      {
        authorEmail: "sarah.khan@digitalpointllc.com",
        content: "Can we reuse the EmployeesBrowser filter pattern?",
        daysAgo: 0,
      },
    ],
  },
  {
    title: "Slice 3: Clients + Deal Pipeline",
    projectCode: "DPL-CRM",
    status: "BACKLOG",
    priority: "HIGH",
    assigneeEmail: "sarah.khan@digitalpointllc.com",
    reporterEmail: "faizan@digitalpointllc.com",
    dueInDays: 7,
    estimatedHours: 20,
    labelNames: ["backend"],
  },
  {
    title: "Wire Sentry for server + client",
    projectCode: "DPL-CRM",
    status: "TODO",
    priority: "MEDIUM",
    assigneeEmail: "ali.raza@digitalpointllc.com",
    reporterEmail: "faizan@digitalpointllc.com",
    dueInDays: 4,
    estimatedHours: 4,
    labelNames: ["infra"],
  },
  {
    title: "Migrate Clerk webhook to structured handlers",
    projectCode: "DPL-CRM",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    assigneeEmail: "ali.raza@digitalpointllc.com",
    reporterEmail: "faizan@digitalpointllc.com",
    dueInDays: 2,
    estimatedHours: 3,
    labelNames: ["backend"],
  },
  {
    title: "Fix dashboard KPI 0/0/0 when DB is cold",
    projectCode: "DPL-CRM",
    status: "BLOCKED",
    priority: "LOW",
    assigneeEmail: "priya.sharma@digitalpointllc.com",
    reporterEmail: "sarah.khan@digitalpointllc.com",
    dueInDays: 10,
    estimatedHours: 2,
    labelNames: ["bug", "frontend"],
  },
  {
    title: "Add CSV pagination to employees export",
    projectCode: "DPL-CRM",
    status: "TODO",
    priority: "LOW",
    assigneeEmail: "priya.sharma@digitalpointllc.com",
    reporterEmail: "faizan@digitalpointllc.com",
    dueInDays: 14,
    estimatedHours: 3,
    labelNames: ["backend"],
  },
  {
    title: "Clean up dead radix deps",
    projectCode: "DPL-CRM",
    status: "BACKLOG",
    priority: "LOW",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: 30,
    estimatedHours: 1,
    labelNames: ["infra"],
  },
  {
    title: "Build AIChat floating panel v2",
    projectCode: "DPL-CRM",
    status: "BACKLOG",
    priority: "MEDIUM",
    reporterEmail: "faizan@digitalpointllc.com",
    dueInDays: 21,
    estimatedHours: 8,
    labelNames: ["frontend"],
  },
  {
    title: "Ticket Inbox slice design",
    projectCode: "DPL-CRM",
    status: "BACKLOG",
    priority: "MEDIUM",
    assigneeEmail: "liam.oconnor@digitalpointllc.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: 12,
    estimatedHours: 6,
    labelNames: ["design"],
  },

  // DPL-WEB
  {
    title: "Hero section redesign with motion",
    projectCode: "DPL-WEB",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assigneeEmail: "liam.oconnor@digitalpointllc.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: 3,
    estimatedHours: 6,
    labelNames: ["design"],
  },
  {
    title: "Migrate blog from WP to MDX",
    projectCode: "DPL-WEB",
    status: "TODO",
    priority: "MEDIUM",
    assigneeEmail: "priya.sharma@digitalpointllc.com",
    reporterEmail: "liam.oconnor@digitalpointllc.com",
    dueInDays: 9,
    estimatedHours: 10,
    labelNames: ["seo"],
  },
  {
    title: "Lighthouse score > 95 on all marketing pages",
    projectCode: "DPL-WEB",
    status: "IN_REVIEW",
    priority: "HIGH",
    assigneeEmail: "marcus.silva@digitalpointllc.com",
    reporterEmail: "liam.oconnor@digitalpointllc.com",
    dueInDays: 1,
    estimatedHours: 4,
    labelNames: ["seo", "design"],
  },
  {
    title: "Write case study: VCS outsourcing win",
    projectCode: "DPL-WEB",
    status: "TODO",
    priority: "LOW",
    assigneeEmail: "jonah.kim@digitalpointllc.com",
    reporterEmail: "nora.ahmed@digitalpointllc.com",
    dueInDays: 14,
    estimatedHours: 5,
    labelNames: ["seo"],
  },
  {
    title: "Add newsletter signup in footer",
    projectCode: "DPL-WEB",
    status: "DONE",
    priority: "LOW",
    assigneeEmail: "priya.sharma@digitalpointllc.com",
    reporterEmail: "jonah.kim@digitalpointllc.com",
    dueInDays: -3,
    estimatedHours: 1.5,
    labelNames: ["design"],
  },
  {
    title: "SEO audit for target keywords",
    projectCode: "DPL-WEB",
    status: "BACKLOG",
    priority: "MEDIUM",
    assigneeEmail: "jonah.kim@digitalpointllc.com",
    reporterEmail: "nora.ahmed@digitalpointllc.com",
    dueInDays: 7,
    estimatedHours: 4,
    labelNames: ["seo"],
  },
  {
    title: "Replace homepage stock photos",
    projectCode: "DPL-WEB",
    status: "CANCELLED",
    priority: "LOW",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: -5,
    labelNames: ["design"],
  },

  // DPL-SALES-Q2
  {
    title: "Outbound cadence — 200 mid-market SaaS CTOs",
    projectCode: "DPL-SALES-Q2",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeEmail: "nora.ahmed@digitalpointllc.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: 5,
    estimatedHours: 12,
    labelNames: ["outbound"],
    comments: [
      {
        authorEmail: "umer@digitalpointllc.com",
        content: "Segment by ICP tier before sending.",
        daysAgo: 2,
      },
    ],
  },
  {
    title: "LinkedIn inbound playbook refresh",
    projectCode: "DPL-SALES-Q2",
    status: "TODO",
    priority: "HIGH",
    assigneeEmail: "jonah.kim@digitalpointllc.com",
    reporterEmail: "nora.ahmed@digitalpointllc.com",
    dueInDays: 6,
    estimatedHours: 4,
    labelNames: ["inbound"],
  },
  {
    title: "Deal review — Q1 close-lost analysis",
    projectCode: "DPL-SALES-Q2",
    status: "DONE",
    priority: "MEDIUM",
    assigneeEmail: "nora.ahmed@digitalpointllc.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: -2,
    estimatedHours: 3,
    labelNames: ["inbound"],
  },
  {
    title: "Follow up on 12 stale open deals",
    projectCode: "DPL-SALES-Q2",
    status: "IN_PROGRESS",
    priority: "HIGH",
    assigneeEmail: "nora.ahmed@digitalpointllc.com",
    dueInDays: 3,
    estimatedHours: 6,
    labelNames: ["outbound"],
  },
  {
    title: "Set up HubSpot → Alpha CRM sync",
    projectCode: "DPL-SALES-Q2",
    status: "BLOCKED",
    priority: "MEDIUM",
    assigneeEmail: "ali.raza@digitalpointllc.com",
    reporterEmail: "nora.ahmed@digitalpointllc.com",
    dueInDays: 12,
    estimatedHours: 6,
    labelNames: ["inbound"],
  },
  {
    title: "Draft Q2 partnership outreach",
    projectCode: "DPL-SALES-Q2",
    status: "BACKLOG",
    priority: "LOW",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: 20,
    estimatedHours: 4,
    labelNames: ["outbound"],
  },

  // VCS-OPS-Q2
  {
    title: "Ticket response SLA < 15 min for P1",
    projectCode: "VCS-OPS-Q2",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeEmail: "ravi.mehta@virtualcustomersolution.com",
    reporterEmail: "anita.patel@virtualcustomersolution.com",
    dueInDays: 4,
    estimatedHours: 8,
    labelNames: ["sla"],
    subtasks: [
      { title: "Audit current response distribution", done: true },
      { title: "Update shift routing config", done: false },
      { title: "Train leads on escalation matrix", done: false },
    ],
  },
  {
    title: "Monthly QA sampling audit",
    projectCode: "VCS-OPS-Q2",
    status: "TODO",
    priority: "HIGH",
    assigneeEmail: "fatima.yusuf@virtualcustomersolution.com",
    reporterEmail: "anita.patel@virtualcustomersolution.com",
    dueInDays: 10,
    estimatedHours: 6,
    labelNames: ["qa"],
  },
  {
    title: "Refresh Zendesk macro library (60 items)",
    projectCode: "VCS-OPS-Q2",
    status: "BACKLOG",
    priority: "MEDIUM",
    assigneeEmail: "ravi.mehta@virtualcustomersolution.com",
    dueInDays: 21,
    estimatedHours: 6,
    labelNames: ["training"],
  },
  {
    title: "Update new-hire onboarding deck",
    projectCode: "VCS-OPS-Q2",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    assigneeEmail: "anita.patel@virtualcustomersolution.com",
    dueInDays: 2,
    estimatedHours: 4,
    labelNames: ["training"],
  },
  {
    title: "Escalation drill with engineering on-call",
    projectCode: "VCS-OPS-Q2",
    status: "DONE",
    priority: "HIGH",
    assigneeEmail: "anita.patel@virtualcustomersolution.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: -4,
    estimatedHours: 2,
    labelNames: ["sla"],
  },
  {
    title: "Zara — cross-train for BSL queue",
    projectCode: "VCS-OPS-Q2",
    status: "TODO",
    priority: "LOW",
    assigneeEmail: "zara.hussain@virtualcustomersolution.com",
    reporterEmail: "ravi.mehta@virtualcustomersolution.com",
    dueInDays: 30,
    estimatedHours: 8,
    labelNames: ["training"],
  },
  {
    title: "Fix Zendesk view caching bug",
    projectCode: "VCS-OPS-Q2",
    status: "BLOCKED",
    priority: "MEDIUM",
    assigneeEmail: "diego.fernandez@virtualcustomersolution.com",
    reporterEmail: "ravi.mehta@virtualcustomersolution.com",
    dueInDays: 5,
    estimatedHours: 2,
    labelNames: ["qa"],
  },
  {
    title: "Reply templates for LATAM Spanish",
    projectCode: "VCS-OPS-Q2",
    status: "TODO",
    priority: "MEDIUM",
    assigneeEmail: "diego.fernandez@virtualcustomersolution.com",
    dueInDays: 8,
    estimatedHours: 4,
    labelNames: ["training"],
  },

  // BSL-PLAT
  {
    title: "Incremental snapshot engine v2",
    description: "Replace periodic full backups with block-diff engine.",
    projectCode: "BSL-PLAT",
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeEmail: "mahnoor.ali@backupsolutions.com",
    reporterEmail: "daniel.park@backupsolutions.com",
    dueInDays: 9,
    estimatedHours: 30,
    labelNames: ["platform", "reliability"],
    subtasks: [
      { title: "Design block diff format", done: true },
      { title: "Prototype on S3", done: true },
      { title: "Benchmark vs. v1 on 1TB dataset", done: false },
      { title: "Migration plan for existing customers", done: false },
    ],
    comments: [
      {
        authorEmail: "daniel.park@backupsolutions.com",
        content: "Need the benchmark numbers before we sign off.",
        daysAgo: 1,
      },
    ],
  },
  {
    title: "Customer portal billing tab",
    projectCode: "BSL-PLAT",
    status: "IN_REVIEW",
    priority: "HIGH",
    assigneeEmail: "samuel.okonkwo@backupsolutions.com",
    reporterEmail: "daniel.park@backupsolutions.com",
    dueInDays: 1,
    estimatedHours: 8,
    labelNames: ["customer"],
  },
  {
    title: "Alert routing for backup-failure events",
    projectCode: "BSL-PLAT",
    status: "TODO",
    priority: "HIGH",
    assigneeEmail: "mahnoor.ali@backupsolutions.com",
    reporterEmail: "daniel.park@backupsolutions.com",
    dueInDays: 5,
    estimatedHours: 6,
    labelNames: ["reliability"],
  },
  {
    title: "Investigate 0.4% checksum mismatch spike",
    projectCode: "BSL-PLAT",
    status: "BLOCKED",
    priority: "URGENT",
    assigneeEmail: "mahnoor.ali@backupsolutions.com",
    reporterEmail: "elena.martinez@backupsolutions.com",
    dueInDays: 0,
    estimatedHours: 4,
    labelNames: ["reliability", "platform"],
  },
  {
    title: "Support runbook for restore-failure",
    projectCode: "BSL-PLAT",
    status: "DONE",
    priority: "MEDIUM",
    assigneeEmail: "elena.martinez@backupsolutions.com",
    reporterEmail: "daniel.park@backupsolutions.com",
    dueInDays: -2,
    estimatedHours: 3,
    labelNames: ["customer"],
  },
  {
    title: "Postgres pg_basebackup connector prototype",
    projectCode: "BSL-PLAT",
    status: "BACKLOG",
    priority: "MEDIUM",
    assigneeEmail: "samuel.okonkwo@backupsolutions.com",
    dueInDays: 30,
    estimatedHours: 12,
    labelNames: ["platform"],
  },
  {
    title: "Postmortem — March retention rollover outage",
    projectCode: "BSL-PLAT",
    status: "DONE",
    priority: "HIGH",
    assigneeEmail: "daniel.park@backupsolutions.com",
    reporterEmail: "umer@digitalpointllc.com",
    dueInDays: -6,
    estimatedHours: 3,
    labelNames: ["reliability"],
  },
  {
    title: "Bill — stale DB credentials in staging",
    projectCode: "BSL-PLAT",
    status: "CANCELLED",
    priority: "LOW",
    reporterEmail: "daniel.park@backupsolutions.com",
    dueInDays: -8,
    labelNames: ["platform"],
  },
];

const DEPENDENCIES: Array<{ taskTitle: string; dependsOnTitle: string }> = [
  {
    taskTitle: "Build task management kanban (Slice 2)",
    dependsOnTitle: "Ship Slice 1 employees module",
  },
  {
    taskTitle: "Slice 3: Clients + Deal Pipeline",
    dependsOnTitle: "Build task management kanban (Slice 2)",
  },
  {
    taskTitle: "Migration plan for existing customers",
    dependsOnTitle: "Benchmark vs. v1 on 1TB dataset",
  },
  {
    taskTitle: "Alert routing for backup-failure events",
    dependsOnTitle: "Investigate 0.4% checksum mismatch spike",
  },
  {
    taskTitle: "Update shift routing config",
    dependsOnTitle: "Audit current response distribution",
  },
];

async function seedSlice2() {
  const projectMap = await seedProjects();
  const labelMap = await seedLabels(projectMap);
  const taskMap = await seedTasks(projectMap, labelMap);
  await seedDependencies(taskMap);
}

async function seedProjects(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let count = 0;
  for (const p of PROJECTS) {
    const company = await db.company.findUniqueOrThrow({ where: { type: p.companyType } });
    const leadUser = await db.user.findUnique({ where: { email: p.leadEmail } });
    const leadEmp = leadUser
      ? await db.employee.findUnique({ where: { userId: leadUser.id } })
      : null;
    const project = await db.project.upsert({
      where: { companyId_code: { companyId: company.id, code: p.code } },
      update: {
        name: p.name,
        description: p.description,
        status: p.status,
        color: p.color,
        leadEmployeeId: leadEmp?.id ?? null,
      },
      create: {
        companyId: company.id,
        name: p.name,
        code: p.code,
        description: p.description,
        status: p.status,
        color: p.color,
        leadEmployeeId: leadEmp?.id ?? null,
      },
    });
    out.set(p.code, project.id);
    count += 1;
  }
  console.log(`  seeded ${count} projects`);
  return out;
}

async function seedLabels(
  projectMap: Map<string, string>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let count = 0;
  for (const l of LABELS) {
    const company = await db.company.findUniqueOrThrow({ where: { type: l.companyType } });
    const projectId = l.projectCode ? projectMap.get(l.projectCode) ?? null : null;
    const existing = await db.taskLabel.findFirst({
      where: { companyId: company.id, projectId, name: l.name },
    });
    const label = existing
      ? await db.taskLabel.update({
          where: { id: existing.id },
          data: { color: l.color },
        })
      : await db.taskLabel.create({
          data: {
            companyId: company.id,
            projectId,
            name: l.name,
            color: l.color,
          },
        });
    out.set(`${l.projectCode ?? ""}::${l.name}`, label.id);
    count += 1;
  }
  console.log(`  seeded ${count} task labels`);
  return out;
}

async function seedTasks(
  projectMap: Map<string, string>,
  labelMap: Map<string, string>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const subtaskTitleMap = new Map<string, string>();
  const positions = new Map<string, number>();
  let taskCount = 0;
  let subtaskCount = 0;
  let commentCount = 0;

  for (const t of TASKS) {
    const projectId = projectMap.get(t.projectCode);
    if (!projectId) {
      console.warn(`  unknown project ${t.projectCode} for task "${t.title}"`);
      continue;
    }
    const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
    const key = `${projectId}::${t.status}`;
    const pos = (positions.get(key) ?? 0) + 1;
    positions.set(key, pos);

    const assigneeEmp = await empByEmail(t.assigneeEmail);
    const reporterEmp = await empByEmail(t.reporterEmail);
    const reporterUser = t.reporterEmail
      ? await db.user.findUnique({ where: { email: t.reporterEmail } })
      : null;
    const createdById = reporterUser?.id ?? (await firstOwnerId());

    const dueDate = typeof t.dueInDays === "number" ? addDays(new Date(), t.dueInDays) : null;
    const completedAt =
      t.status === "DONE" && typeof t.dueInDays === "number"
        ? addDays(new Date(), Math.min(0, t.dueInDays))
        : null;

    const existing = await db.task.findFirst({
      where: { projectId, title: t.title, parentId: null, deletedAt: null },
    });

    const task = existing
      ? await db.task.update({
          where: { id: existing.id },
          data: {
            description: t.description ?? null,
            status: t.status,
            priority: t.priority,
            assigneeEmployeeId: assigneeEmp?.id ?? null,
            reporterEmployeeId: reporterEmp?.id ?? null,
            dueDate,
            estimatedHours: t.estimatedHours ?? null,
            companyId: project.companyId,
            completedAt,
            position: new Prisma.Decimal(pos * 65536),
          },
        })
      : await db.task.create({
          data: {
            title: t.title,
            description: t.description ?? null,
            status: t.status,
            priority: t.priority,
            projectId,
            companyId: project.companyId,
            assigneeEmployeeId: assigneeEmp?.id ?? null,
            reporterEmployeeId: reporterEmp?.id ?? null,
            createdById,
            dueDate,
            estimatedHours: t.estimatedHours ?? null,
            completedAt,
            position: new Prisma.Decimal(pos * 65536),
          },
        });
    out.set(t.title, task.id);
    taskCount += 1;

    // Labels
    if (t.labelNames?.length) {
      await db.taskLabelAssignment.deleteMany({ where: { taskId: task.id } });
      for (const name of t.labelNames) {
        const labelId = labelMap.get(`${t.projectCode}::${name}`);
        if (!labelId) continue;
        await db.taskLabelAssignment.upsert({
          where: { taskId_labelId: { taskId: task.id, labelId } },
          update: {},
          create: { taskId: task.id, labelId },
        });
      }
    }

    // Subtasks
    if (t.subtasks?.length) {
      for (let i = 0; i < t.subtasks.length; i += 1) {
        const st = t.subtasks[i];
        const subExisting = await db.task.findFirst({
          where: { parentId: task.id, title: st.title, deletedAt: null },
        });
        const sub = subExisting
          ? await db.task.update({
              where: { id: subExisting.id },
              data: {
                status: st.done ? "DONE" : "TODO",
                completedAt: st.done ? addDays(new Date(), -1) : null,
              },
            })
          : await db.task.create({
              data: {
                title: st.title,
                parentId: task.id,
                projectId,
                companyId: project.companyId,
                createdById,
                priority: t.priority,
                status: st.done ? "DONE" : "TODO",
                completedAt: st.done ? addDays(new Date(), -1) : null,
                position: new Prisma.Decimal((i + 1) * 65536),
              },
            });
        subtaskTitleMap.set(st.title, sub.id);
        subtaskCount += 1;
      }
    }

    // Comments
    if (t.comments?.length) {
      for (const c of t.comments) {
        const authorUser = await db.user.findUnique({ where: { email: c.authorEmail } });
        if (!authorUser) continue;
        const created = addDays(new Date(), -(c.daysAgo ?? 0));
        const existingComment = await db.taskComment.findFirst({
          where: { taskId: task.id, authorId: authorUser.id, content: c.content },
        });
        if (!existingComment) {
          await db.taskComment.create({
            data: {
              taskId: task.id,
              authorId: authorUser.id,
              content: c.content,
              createdAt: created,
              updatedAt: created,
            },
          });
          commentCount += 1;
        }
      }
    }
  }

  // merge subtask titles into taskMap so dependencies can reference them
  for (const [title, id] of subtaskTitleMap.entries()) {
    if (!out.has(title)) out.set(title, id);
  }

  console.log(`  seeded ${taskCount} tasks, ${subtaskCount} subtasks, ${commentCount} comments`);
  return out;
}

async function seedDependencies(taskMap: Map<string, string>) {
  let count = 0;
  for (const dep of DEPENDENCIES) {
    const taskId = taskMap.get(dep.taskTitle);
    const dependsOnTaskId = taskMap.get(dep.dependsOnTitle);
    if (!taskId || !dependsOnTaskId) continue;
    await db.taskDependency.upsert({
      where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
      update: {},
      create: { taskId, dependsOnTaskId },
    });
    count += 1;
  }
  console.log(`  seeded ${count} task dependencies`);
}

async function empByEmail(email: string | undefined) {
  if (!email) return null;
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  return db.employee.findUnique({ where: { userId: user.id } });
}

async function firstOwnerId(): Promise<string> {
  const owner = await db.user.findFirstOrThrow({
    where: { role: "OWNER" },
    select: { id: true },
  });
  return owner.id;
}

function addDays(base: Date, days: number): Date {
  const out = new Date(base);
  out.setDate(out.getDate() + days);
  return out;
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
