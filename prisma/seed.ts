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
  console.log("→ seeding Slice 3 (pipelines, stages, clients, contacts, deals, notes)");
  await seedSlice3();
  console.log("✔ seed complete");
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

// ============================================================================
// SLICE 3 — Clients + Deal Pipeline
// ============================================================================

type StageSeed = {
  name: string;
  probability: number;
  isWon?: boolean;
  isLost?: boolean;
  color: string;
};

const STAGES: StageSeed[] = [
  { name: "Prospect", probability: 10, color: "#71717A" },
  { name: "Qualified", probability: 25, color: "#3B82F6" },
  { name: "Proposal", probability: 50, color: "#F59E0B" },
  { name: "Negotiation", probability: 75, color: "#A855F7" },
  { name: "Closed Won", probability: 100, isWon: true, color: "#22C55E" },
  { name: "Closed Lost", probability: 0, isLost: true, color: "#EF4444" },
];

type ClientSeed = {
  name: string;
  legalName?: string;
  email: string;
  phone?: string;
  website: string;
  industry: string;
  country: string;
  city: string;
  companyType: CompanyType;
  status: "ACTIVE" | "PROSPECT" | "CHURNED" | "PAUSED";
  health: "HEALTHY" | "AT_RISK" | "CHURNING" | "UNKNOWN";
  healthScore?: number;
  accountTier?: "ENTERPRISE" | "SCALEUP" | "STARTUP";
  mrr?: number;
  arr?: number;
  signupDate?: string;
  renewalDate?: string;
  ownerEmail?: string;
  slackChannel?: string;
  tags: string[];
  contacts: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    title: string;
    department?: string;
    kind: "PRIMARY" | "BILLING" | "TECHNICAL" | "EXECUTIVE" | "OTHER";
    isPrimary?: boolean;
    linkedinUrl?: string;
    timezone?: string;
  }>;
  notes?: Array<{ authorEmail: string; content: string; daysAgo?: number; isPinned?: boolean }>;
};

const CLIENTS: ClientSeed[] = [
  {
    name: "Northwind Labs",
    legalName: "Northwind Labs, Inc.",
    email: "hello@northwindlabs.io",
    phone: "+1-415-555-0201",
    website: "https://northwindlabs.io",
    industry: "B2B SaaS",
    country: "USA",
    city: "San Francisco",
    companyType: "DPL",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 88,
    accountTier: "ENTERPRISE",
    mrr: 18500,
    arr: 222000,
    signupDate: "2024-02-10",
    renewalDate: "2026-02-10",
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    slackChannel: "#client-northwind",
    tags: ["enterprise", "saas", "upsell"],
    contacts: [
      {
        firstName: "Alicia",
        lastName: "Chen",
        email: "alicia.chen@northwindlabs.io",
        phone: "+1-415-555-0202",
        title: "VP Engineering",
        department: "Engineering",
        kind: "TECHNICAL",
        isPrimary: true,
        linkedinUrl: "https://linkedin.com/in/aliciachen",
        timezone: "America/Los_Angeles",
      },
      {
        firstName: "Rohan",
        lastName: "Desai",
        email: "rohan@northwindlabs.io",
        title: "Head of Finance",
        kind: "BILLING",
        timezone: "America/Los_Angeles",
      },
    ],
    notes: [
      {
        authorEmail: "nora.ahmed@digitalpointllc.com",
        content: "QBR scheduled for Apr 28. Alicia confirmed Rohan will join for the billing review.",
        daysAgo: 2,
        isPinned: true,
      },
    ],
  },
  {
    name: "Meridian Retail Group",
    email: "partnerships@meridianretail.co",
    website: "https://meridianretail.co",
    industry: "Retail",
    country: "USA",
    city: "New York",
    companyType: "DPL",
    status: "ACTIVE",
    health: "AT_RISK",
    healthScore: 58,
    accountTier: "SCALEUP",
    mrr: 6200,
    arr: 74400,
    signupDate: "2024-06-01",
    renewalDate: "2026-06-01",
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    tags: ["retail", "at-risk"],
    contacts: [
      {
        firstName: "Marcus",
        lastName: "Webb",
        email: "marcus.webb@meridianretail.co",
        title: "Director of Ops",
        kind: "PRIMARY",
        isPrimary: true,
        timezone: "America/New_York",
      },
    ],
    notes: [
      {
        authorEmail: "nora.ahmed@digitalpointllc.com",
        content: "Usage dropped 30% in March. Scheduled save-call for next week.",
        daysAgo: 4,
      },
    ],
  },
  {
    name: "Helio Analytics",
    email: "team@helio.so",
    website: "https://helio.so",
    industry: "Data & AI",
    country: "Canada",
    city: "Toronto",
    companyType: "DPL",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 91,
    accountTier: "SCALEUP",
    mrr: 4800,
    arr: 57600,
    signupDate: "2024-09-12",
    renewalDate: "2026-09-12",
    ownerEmail: "jonah.kim@digitalpointllc.com",
    tags: ["analytics", "saas"],
    contacts: [
      {
        firstName: "Sofia",
        lastName: "Reyes",
        email: "sofia@helio.so",
        title: "CEO",
        kind: "EXECUTIVE",
        isPrimary: true,
        timezone: "America/Toronto",
      },
      {
        firstName: "Deepak",
        lastName: "Iyer",
        email: "deepak@helio.so",
        title: "CTO",
        kind: "TECHNICAL",
        timezone: "America/Toronto",
      },
    ],
  },
  {
    name: "Lumen Studios",
    email: "hi@lumen.studio",
    website: "https://lumen.studio",
    industry: "Creative Agency",
    country: "UK",
    city: "London",
    companyType: "DPL",
    status: "PROSPECT",
    health: "UNKNOWN",
    accountTier: "STARTUP",
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    tags: ["prospect", "creative"],
    contacts: [
      {
        firstName: "Tom",
        lastName: "Bridges",
        email: "tom@lumen.studio",
        title: "Founder",
        kind: "EXECUTIVE",
        isPrimary: true,
        timezone: "Europe/London",
      },
    ],
  },
  {
    name: "Orbital Health",
    email: "compliance@orbitalhealth.com",
    website: "https://orbitalhealth.com",
    industry: "Healthcare",
    country: "USA",
    city: "Boston",
    companyType: "DPL",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 82,
    accountTier: "ENTERPRISE",
    mrr: 22400,
    arr: 268800,
    signupDate: "2023-11-20",
    renewalDate: "2025-11-20",
    ownerEmail: "umer@digitalpointllc.com",
    tags: ["healthcare", "hipaa", "enterprise"],
    contacts: [
      {
        firstName: "Dr. Priya",
        lastName: "Mehta",
        email: "priya.mehta@orbitalhealth.com",
        title: "Chief Medical Officer",
        kind: "EXECUTIVE",
        isPrimary: true,
      },
    ],
  },
  {
    name: "BrightLadder Education",
    email: "partners@brightladder.edu",
    website: "https://brightladder.edu",
    industry: "Education",
    country: "USA",
    city: "Austin",
    companyType: "DPL",
    status: "CHURNED",
    health: "CHURNING",
    accountTier: "STARTUP",
    signupDate: "2023-08-10",
    churnDate: "2025-10-01" as unknown as string,
    tags: ["edtech", "churned"],
    contacts: [
      {
        firstName: "Emma",
        lastName: "Foster",
        email: "emma@brightladder.edu",
        title: "Operations Lead",
        kind: "PRIMARY",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Acme Logistics",
    email: "support@acmelogistics.io",
    website: "https://acmelogistics.io",
    industry: "Logistics",
    country: "USA",
    city: "Chicago",
    companyType: "VCS",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 85,
    accountTier: "ENTERPRISE",
    mrr: 14200,
    arr: 170400,
    signupDate: "2024-01-15",
    renewalDate: "2026-01-15",
    ownerEmail: "anita.patel@virtualcustomersolution.com",
    slackChannel: "#client-acme",
    tags: ["logistics", "24x7"],
    contacts: [
      {
        firstName: "Kenji",
        lastName: "Tanaka",
        email: "kenji@acmelogistics.io",
        title: "Customer Ops Director",
        kind: "PRIMARY",
        isPrimary: true,
        timezone: "America/Chicago",
      },
    ],
    notes: [
      {
        authorEmail: "anita.patel@virtualcustomersolution.com",
        content: "SLA review complete — all P1 resolution targets hit 99.7%.",
        daysAgo: 7,
      },
    ],
  },
  {
    name: "Stellar Mobile",
    email: "support@stellarmobile.app",
    website: "https://stellarmobile.app",
    industry: "Mobile Apps",
    country: "Germany",
    city: "Berlin",
    companyType: "VCS",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 78,
    accountTier: "SCALEUP",
    mrr: 5400,
    arr: 64800,
    signupDate: "2024-05-05",
    renewalDate: "2026-05-05",
    ownerEmail: "ravi.mehta@virtualcustomersolution.com",
    tags: ["mobile", "i18n"],
    contacts: [
      {
        firstName: "Lena",
        lastName: "Hoffmann",
        email: "lena@stellarmobile.app",
        title: "Head of Support",
        kind: "PRIMARY",
        isPrimary: true,
        timezone: "Europe/Berlin",
      },
    ],
  },
  {
    name: "Apex Fitness",
    email: "info@apexfitness.co",
    website: "https://apexfitness.co",
    industry: "Fitness",
    country: "Australia",
    city: "Sydney",
    companyType: "VCS",
    status: "ACTIVE",
    health: "AT_RISK",
    healthScore: 61,
    accountTier: "STARTUP",
    mrr: 2800,
    arr: 33600,
    signupDate: "2024-10-20",
    renewalDate: "2026-10-20",
    ownerEmail: "ravi.mehta@virtualcustomersolution.com",
    tags: ["fitness"],
    contacts: [
      {
        firstName: "Jamie",
        lastName: "Carter",
        email: "jamie@apexfitness.co",
        title: "COO",
        kind: "EXECUTIVE",
        isPrimary: true,
        timezone: "Australia/Sydney",
      },
    ],
  },
  {
    name: "Veridian Finance",
    email: "partners@veridianfinance.com",
    website: "https://veridianfinance.com",
    industry: "FinTech",
    country: "Singapore",
    city: "Singapore",
    companyType: "VCS",
    status: "PROSPECT",
    health: "UNKNOWN",
    accountTier: "ENTERPRISE",
    ownerEmail: "anita.patel@virtualcustomersolution.com",
    tags: ["fintech", "prospect"],
    contacts: [
      {
        firstName: "Wei",
        lastName: "Tan",
        email: "wei.tan@veridianfinance.com",
        title: "VP Customer Experience",
        kind: "EXECUTIVE",
        isPrimary: true,
        timezone: "Asia/Singapore",
      },
    ],
  },
  {
    name: "Cloudbase Systems",
    email: "admin@cloudbase.sys",
    website: "https://cloudbase.sys",
    industry: "DevOps",
    country: "USA",
    city: "Seattle",
    companyType: "BSL",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 92,
    accountTier: "ENTERPRISE",
    mrr: 11800,
    arr: 141600,
    signupDate: "2023-12-01",
    renewalDate: "2025-12-01",
    ownerEmail: "daniel.park@backupsolutions.com",
    slackChannel: "#client-cloudbase",
    tags: ["devops", "enterprise"],
    contacts: [
      {
        firstName: "Nathan",
        lastName: "Osei",
        email: "nathan@cloudbase.sys",
        title: "Head of SRE",
        kind: "TECHNICAL",
        isPrimary: true,
        timezone: "America/Los_Angeles",
      },
      {
        firstName: "Lily",
        lastName: "Zhang",
        email: "lily@cloudbase.sys",
        title: "Finance Director",
        kind: "BILLING",
      },
    ],
    notes: [
      {
        authorEmail: "daniel.park@backupsolutions.com",
        content: "Interested in our incremental engine (BSL-PLAT project). Setting up demo for next week.",
        daysAgo: 3,
        isPinned: true,
      },
    ],
  },
  {
    name: "Pinecrest Legal",
    email: "it@pinecrest.law",
    website: "https://pinecrest.law",
    industry: "Legal",
    country: "USA",
    city: "Philadelphia",
    companyType: "BSL",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 79,
    accountTier: "SCALEUP",
    mrr: 4100,
    arr: 49200,
    signupDate: "2024-03-14",
    renewalDate: "2026-03-14",
    ownerEmail: "daniel.park@backupsolutions.com",
    tags: ["legal", "compliance"],
    contacts: [
      {
        firstName: "Aaron",
        lastName: "Klein",
        email: "aaron.klein@pinecrest.law",
        title: "IT Director",
        kind: "TECHNICAL",
        isPrimary: true,
      },
    ],
  },
  {
    name: "Havenwood Media",
    email: "support@havenwood.media",
    website: "https://havenwood.media",
    industry: "Media",
    country: "USA",
    city: "Los Angeles",
    companyType: "BSL",
    status: "ACTIVE",
    health: "AT_RISK",
    healthScore: 52,
    accountTier: "SCALEUP",
    mrr: 3200,
    arr: 38400,
    signupDate: "2024-11-01",
    renewalDate: "2026-11-01",
    ownerEmail: "elena.martinez@backupsolutions.com",
    tags: ["media"],
    contacts: [
      {
        firstName: "Clara",
        lastName: "Duval",
        email: "clara@havenwood.media",
        title: "VP Engineering",
        kind: "TECHNICAL",
        isPrimary: true,
      },
    ],
    notes: [
      {
        authorEmail: "elena.martinez@backupsolutions.com",
        content: "Complained about restore latency last week. Samuel investigating.",
        daysAgo: 5,
      },
    ],
  },
  {
    name: "TerraSync Utilities",
    email: "hello@terrasync.io",
    website: "https://terrasync.io",
    industry: "Utilities",
    country: "UK",
    city: "Manchester",
    companyType: "BSL",
    status: "PROSPECT",
    health: "UNKNOWN",
    accountTier: "ENTERPRISE",
    ownerEmail: "daniel.park@backupsolutions.com",
    tags: ["utilities", "enterprise", "prospect"],
    contacts: [
      {
        firstName: "Iain",
        lastName: "McKenzie",
        email: "iain@terrasync.io",
        title: "Head of Infrastructure",
        kind: "TECHNICAL",
        isPrimary: true,
        timezone: "Europe/London",
      },
    ],
  },
  {
    name: "Palette Commerce",
    email: "merchant@palettecommerce.io",
    website: "https://palettecommerce.io",
    industry: "E-commerce",
    country: "Brazil",
    city: "São Paulo",
    companyType: "DPL",
    status: "ACTIVE",
    health: "HEALTHY",
    healthScore: 86,
    accountTier: "SCALEUP",
    mrr: 7200,
    arr: 86400,
    signupDate: "2024-07-01",
    renewalDate: "2026-07-01",
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    tags: ["ecommerce", "latam"],
    contacts: [
      {
        firstName: "Luiza",
        lastName: "Santos",
        email: "luiza@palettecommerce.io",
        title: "Growth Director",
        kind: "PRIMARY",
        isPrimary: true,
        timezone: "America/Sao_Paulo",
      },
    ],
  },
];

type DealSeed = {
  title: string;
  clientName?: string;
  companyType: CompanyType;
  stageName: string;
  status: "OPEN" | "WON" | "LOST";
  value: number;
  probability: number;
  ownerEmail: string;
  expectedCloseInDays?: number;
  nextStep?: string;
  nextStepInDays?: number;
  source?: string;
  lostReason?: string;
  lostReasonCategory?: string;
  lostCompetitor?: string;
  tags: string[];
};

const DEALS: DealSeed[] = [
  // DPL
  {
    title: "Northwind Labs — Expansion to Enterprise tier",
    clientName: "Northwind Labs",
    companyType: "DPL",
    stageName: "Proposal",
    status: "OPEN",
    value: 84000,
    probability: 50,
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    expectedCloseInDays: 21,
    nextStep: "Send revised quote with multi-year discount",
    nextStepInDays: 3,
    source: "Existing customer",
    tags: ["expansion", "enterprise"],
  },
  {
    title: "Orbital Health — Renewal + HIPAA audit add-on",
    clientName: "Orbital Health",
    companyType: "DPL",
    stageName: "Negotiation",
    status: "OPEN",
    value: 320000,
    probability: 75,
    ownerEmail: "umer@digitalpointllc.com",
    expectedCloseInDays: 28,
    nextStep: "Legal review of MSA changes",
    nextStepInDays: 7,
    source: "Renewal",
    tags: ["renewal", "healthcare"],
  },
  {
    title: "Lumen Studios — Pilot engagement",
    clientName: "Lumen Studios",
    companyType: "DPL",
    stageName: "Qualified",
    status: "OPEN",
    value: 12000,
    probability: 25,
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    expectedCloseInDays: 14,
    nextStep: "Deliver pilot scope doc",
    nextStepInDays: 2,
    source: "Referral",
    tags: ["pilot"],
  },
  {
    title: "Meridian Retail — Save deal (Q2)",
    clientName: "Meridian Retail Group",
    companyType: "DPL",
    stageName: "Negotiation",
    status: "OPEN",
    value: 24000,
    probability: 40,
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    expectedCloseInDays: 7,
    nextStep: "Executive call with Marcus",
    nextStepInDays: 1,
    source: "Customer success",
    tags: ["save", "at-risk"],
  },
  {
    title: "Palette Commerce — Multi-region deploy",
    clientName: "Palette Commerce",
    companyType: "DPL",
    stageName: "Proposal",
    status: "OPEN",
    value: 46000,
    probability: 55,
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    expectedCloseInDays: 18,
    source: "Existing customer",
    tags: ["expansion", "latam"],
  },
  {
    title: "Helio Analytics — Q2 add-seats",
    clientName: "Helio Analytics",
    companyType: "DPL",
    stageName: "Closed Won",
    status: "WON",
    value: 18000,
    probability: 100,
    ownerEmail: "jonah.kim@digitalpointllc.com",
    expectedCloseInDays: -2,
    source: "Inbound",
    tags: ["expansion"],
  },
  {
    title: "BrightLadder Education — Renewal",
    clientName: "BrightLadder Education",
    companyType: "DPL",
    stageName: "Closed Lost",
    status: "LOST",
    value: 32000,
    probability: 0,
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    expectedCloseInDays: -10,
    source: "Renewal",
    lostReason: "Budget cuts — EOY freeze",
    lostReasonCategory: "BUDGET",
    tags: ["renewal", "lost"],
  },
  {
    title: "Acme Enterprise (new logo)",
    companyType: "DPL",
    stageName: "Prospect",
    status: "OPEN",
    value: 150000,
    probability: 10,
    ownerEmail: "nora.ahmed@digitalpointllc.com",
    expectedCloseInDays: 60,
    source: "Outbound",
    tags: ["new-logo", "enterprise"],
  },
  {
    title: "ZenFleet — Prospect qualification",
    companyType: "DPL",
    stageName: "Qualified",
    status: "OPEN",
    value: 38000,
    probability: 25,
    ownerEmail: "jonah.kim@digitalpointllc.com",
    expectedCloseInDays: 35,
    source: "Cold email",
    tags: ["new-logo"],
  },
  {
    title: "Sparkwave Labs — Design retainer",
    companyType: "DPL",
    stageName: "Negotiation",
    status: "OPEN",
    value: 72000,
    probability: 70,
    ownerEmail: "liam.oconnor@digitalpointllc.com",
    expectedCloseInDays: 10,
    source: "Referral",
    tags: ["design", "retainer"],
  },

  // VCS
  {
    title: "Acme Logistics — Premium SLA upgrade",
    clientName: "Acme Logistics",
    companyType: "VCS",
    stageName: "Closed Won",
    status: "WON",
    value: 96000,
    probability: 100,
    ownerEmail: "anita.patel@virtualcustomersolution.com",
    expectedCloseInDays: -5,
    source: "Renewal",
    tags: ["sla", "upgrade"],
  },
  {
    title: "Stellar Mobile — Expand to Tier 2",
    clientName: "Stellar Mobile",
    companyType: "VCS",
    stageName: "Proposal",
    status: "OPEN",
    value: 28000,
    probability: 55,
    ownerEmail: "ravi.mehta@virtualcustomersolution.com",
    expectedCloseInDays: 20,
    nextStep: "Share capacity plan",
    nextStepInDays: 4,
    source: "Expansion",
    tags: ["expansion"],
  },
  {
    title: "Apex Fitness — Save deal",
    clientName: "Apex Fitness",
    companyType: "VCS",
    stageName: "Qualified",
    status: "OPEN",
    value: 14000,
    probability: 30,
    ownerEmail: "ravi.mehta@virtualcustomersolution.com",
    expectedCloseInDays: 12,
    source: "Customer success",
    tags: ["save"],
  },
  {
    title: "Veridian Finance — Enterprise CX RFP",
    clientName: "Veridian Finance",
    companyType: "VCS",
    stageName: "Negotiation",
    status: "OPEN",
    value: 420000,
    probability: 65,
    ownerEmail: "anita.patel@virtualcustomersolution.com",
    expectedCloseInDays: 45,
    nextStep: "Security review with Wei",
    nextStepInDays: 6,
    source: "RFP",
    tags: ["rfp", "enterprise", "fintech"],
  },
  {
    title: "Halogen Retail — Lost to competitor",
    companyType: "VCS",
    stageName: "Closed Lost",
    status: "LOST",
    value: 68000,
    probability: 0,
    ownerEmail: "ravi.mehta@virtualcustomersolution.com",
    expectedCloseInDays: -14,
    source: "Outbound",
    lostReason: "Went with competitor offering 24/7 multilingual",
    lostReasonCategory: "COMPETITOR",
    lostCompetitor: "Concentrix",
    tags: ["lost"],
  },
  {
    title: "Riverway Bank — Procurement stalled",
    companyType: "VCS",
    stageName: "Prospect",
    status: "OPEN",
    value: 180000,
    probability: 10,
    ownerEmail: "anita.patel@virtualcustomersolution.com",
    expectedCloseInDays: 90,
    source: "Inbound",
    tags: ["enterprise", "banking"],
  },

  // BSL
  {
    title: "Cloudbase Systems — Incremental engine upgrade",
    clientName: "Cloudbase Systems",
    companyType: "BSL",
    stageName: "Negotiation",
    status: "OPEN",
    value: 240000,
    probability: 80,
    ownerEmail: "daniel.park@backupsolutions.com",
    expectedCloseInDays: 14,
    nextStep: "Run 1TB benchmark with Nathan",
    nextStepInDays: 3,
    source: "Existing customer",
    tags: ["expansion", "platform"],
  },
  {
    title: "Pinecrest Legal — Add compliance module",
    clientName: "Pinecrest Legal",
    companyType: "BSL",
    stageName: "Proposal",
    status: "OPEN",
    value: 28000,
    probability: 50,
    ownerEmail: "daniel.park@backupsolutions.com",
    expectedCloseInDays: 22,
    nextStep: "Compliance one-pager",
    nextStepInDays: 2,
    source: "Existing customer",
    tags: ["compliance", "legal"],
  },
  {
    title: "Havenwood Media — Performance SLA contract",
    clientName: "Havenwood Media",
    companyType: "BSL",
    stageName: "Qualified",
    status: "OPEN",
    value: 36000,
    probability: 25,
    ownerEmail: "elena.martinez@backupsolutions.com",
    expectedCloseInDays: 30,
    source: "Customer success",
    tags: ["sla", "save"],
  },
  {
    title: "TerraSync Utilities — Disaster recovery tier",
    clientName: "TerraSync Utilities",
    companyType: "BSL",
    stageName: "Qualified",
    status: "OPEN",
    value: 520000,
    probability: 30,
    ownerEmail: "daniel.park@backupsolutions.com",
    expectedCloseInDays: 60,
    nextStep: "Scope DR topology with Iain",
    nextStepInDays: 5,
    source: "Outbound",
    tags: ["enterprise", "utilities"],
  },
  {
    title: "QuillForge SaaS — Prospect call",
    companyType: "BSL",
    stageName: "Prospect",
    status: "OPEN",
    value: 18000,
    probability: 10,
    ownerEmail: "mahnoor.ali@backupsolutions.com",
    expectedCloseInDays: 45,
    source: "Cold email",
    tags: ["new-logo"],
  },
  {
    title: "Oakridge Hospital — Closed won",
    companyType: "BSL",
    stageName: "Closed Won",
    status: "WON",
    value: 210000,
    probability: 100,
    ownerEmail: "daniel.park@backupsolutions.com",
    expectedCloseInDays: -8,
    source: "Partner",
    tags: ["healthcare", "new-logo"],
  },
  {
    title: "NorthIron Manufacturing — Churned",
    companyType: "BSL",
    stageName: "Closed Lost",
    status: "LOST",
    value: 44000,
    probability: 0,
    ownerEmail: "elena.martinez@backupsolutions.com",
    expectedCloseInDays: -22,
    lostReason: "Decided to self-host",
    lostReasonCategory: "DIY",
    tags: ["lost"],
  },
];

async function seedSlice3() {
  const pipelineMap = await seedPipelinesAndStages();
  const clientMap = await seedClients();
  await seedContacts(clientMap);
  await seedClientNotes(clientMap);
  await seedDeals(pipelineMap, clientMap);
}

async function seedPipelinesAndStages(): Promise<
  Map<CompanyType, { pipelineId: string; stageByName: Map<string, string> }>
> {
  const out = new Map<
    CompanyType,
    { pipelineId: string; stageByName: Map<string, string> }
  >();
  for (const c of ["DPL", "VCS", "BSL"] as CompanyType[]) {
    const company = await db.company.findUniqueOrThrow({ where: { type: c } });
    const existing = await db.pipeline.findFirst({
      where: { companyId: company.id, name: `${c} Sales Pipeline` },
    });
    const pipeline = existing
      ? await db.pipeline.update({
          where: { id: existing.id },
          data: { isDefault: true, description: `Default pipeline for ${c}` },
        })
      : await db.pipeline.create({
          data: {
            companyId: company.id,
            name: `${c} Sales Pipeline`,
            description: `Default pipeline for ${c}`,
            isDefault: true,
          },
        });
    const stageMap = new Map<string, string>();
    for (let i = 0; i < STAGES.length; i += 1) {
      const s = STAGES[i];
      const existingStage = await db.stage.findFirst({
        where: { pipelineId: pipeline.id, name: s.name },
      });
      const stage = existingStage
        ? await db.stage.update({
            where: { id: existingStage.id },
            data: {
              position: new Prisma.Decimal((i + 1) * 65536),
              probability: s.probability,
              isWon: s.isWon ?? false,
              isLost: s.isLost ?? false,
              color: s.color,
            },
          })
        : await db.stage.create({
            data: {
              pipelineId: pipeline.id,
              name: s.name,
              position: new Prisma.Decimal((i + 1) * 65536),
              probability: s.probability,
              isWon: s.isWon ?? false,
              isLost: s.isLost ?? false,
              color: s.color,
            },
          });
      stageMap.set(s.name, stage.id);
    }
    out.set(c, { pipelineId: pipeline.id, stageByName: stageMap });
  }
  console.log(`  seeded 3 pipelines × ${STAGES.length} stages`);
  return out;
}

async function seedClients(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const c of CLIENTS) {
    const company = await db.company.findUniqueOrThrow({ where: { type: c.companyType } });
    const ownerEmp = await empByEmail(c.ownerEmail);
    const existing = await db.client.findFirst({
      where: { companyId: company.id, name: c.name },
    });
    const churnDate = typeof c.churnDate === "string" && c.churnDate.length > 0 ? new Date(c.churnDate) : null;
    const client = existing
      ? await db.client.update({
          where: { id: existing.id },
          data: {
            legalName: c.legalName ?? null,
            email: c.email,
            phone: c.phone ?? null,
            website: c.website,
            industry: c.industry,
            country: c.country,
            city: c.city,
            status: c.status,
            health: c.health,
            healthScore: c.healthScore ?? null,
            accountTier: c.accountTier ?? null,
            mrr: c.mrr ?? null,
            arr: c.arr ?? null,
            signupDate: c.signupDate ? new Date(c.signupDate) : null,
            renewalDate: c.renewalDate ? new Date(c.renewalDate) : null,
            churnDate,
            slackChannel: c.slackChannel ?? null,
            tags: c.tags,
            ownerEmployeeId: ownerEmp?.id ?? null,
          },
        })
      : await db.client.create({
          data: {
            companyId: company.id,
            name: c.name,
            legalName: c.legalName ?? null,
            email: c.email,
            phone: c.phone ?? null,
            website: c.website,
            industry: c.industry,
            country: c.country,
            city: c.city,
            status: c.status,
            health: c.health,
            healthScore: c.healthScore ?? null,
            accountTier: c.accountTier ?? null,
            mrr: c.mrr ?? null,
            arr: c.arr ?? null,
            signupDate: c.signupDate ? new Date(c.signupDate) : null,
            renewalDate: c.renewalDate ? new Date(c.renewalDate) : null,
            churnDate,
            slackChannel: c.slackChannel ?? null,
            tags: c.tags,
            ownerEmployeeId: ownerEmp?.id ?? null,
          },
        });
    out.set(c.name, client.id);
  }
  console.log(`  seeded ${CLIENTS.length} clients`);
  return out;
}

async function seedContacts(clientMap: Map<string, string>) {
  let count = 0;
  for (const c of CLIENTS) {
    const clientId = clientMap.get(c.name);
    if (!clientId) continue;
    for (const contact of c.contacts) {
      const existing = await db.contact.findFirst({
        where: { clientId, email: contact.email },
      });
      const fullName = `${contact.firstName} ${contact.lastName}`;
      if (existing) {
        await db.contact.update({
          where: { id: existing.id },
          data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            fullName,
            phone: contact.phone ?? null,
            title: contact.title,
            department: contact.department ?? null,
            kind: contact.kind,
            isPrimary: contact.isPrimary ?? false,
            linkedinUrl: contact.linkedinUrl ?? null,
            timezone: contact.timezone ?? null,
          },
        });
      } else {
        await db.contact.create({
          data: {
            clientId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            fullName,
            email: contact.email,
            phone: contact.phone ?? null,
            title: contact.title,
            department: contact.department ?? null,
            kind: contact.kind,
            isPrimary: contact.isPrimary ?? false,
            linkedinUrl: contact.linkedinUrl ?? null,
            timezone: contact.timezone ?? null,
          },
        });
      }
      count += 1;
    }
  }
  console.log(`  seeded ${count} contacts`);
}

async function seedClientNotes(clientMap: Map<string, string>) {
  let count = 0;
  for (const c of CLIENTS) {
    if (!c.notes?.length) continue;
    const clientId = clientMap.get(c.name);
    if (!clientId) continue;
    for (const note of c.notes) {
      const authorUser = await db.user.findUnique({ where: { email: note.authorEmail } });
      if (!authorUser) continue;
      const existing = await db.clientNote.findFirst({
        where: { clientId, authorId: authorUser.id, content: note.content },
      });
      if (existing) continue;
      const when = addDays(new Date(), -(note.daysAgo ?? 0));
      await db.clientNote.create({
        data: {
          clientId,
          authorId: authorUser.id,
          content: note.content,
          isPinned: note.isPinned ?? false,
          createdAt: when,
          updatedAt: when,
        },
      });
      count += 1;
    }
  }
  console.log(`  seeded ${count} client notes`);
}

async function seedDeals(
  pipelineMap: Map<CompanyType, { pipelineId: string; stageByName: Map<string, string> }>,
  clientMap: Map<string, string>,
) {
  let count = 0;
  const positions = new Map<string, number>();
  for (const d of DEALS) {
    const pipeline = pipelineMap.get(d.companyType);
    if (!pipeline) continue;
    const stageId = pipeline.stageByName.get(d.stageName);
    if (!stageId) continue;
    const ownerUser = await db.user.findUnique({ where: { email: d.ownerEmail } });
    const ownerEmp = ownerUser
      ? await db.employee.findUnique({ where: { userId: ownerUser.id } })
      : null;
    const createdById = ownerUser?.id ?? (await firstOwnerId());
    const clientId = d.clientName ? clientMap.get(d.clientName) ?? null : null;
    const company = await db.company.findUniqueOrThrow({ where: { type: d.companyType } });

    const posKey = `${stageId}`;
    const pos = (positions.get(posKey) ?? 0) + 1;
    positions.set(posKey, pos);

    const expectedClose =
      typeof d.expectedCloseInDays === "number"
        ? addDays(new Date(), d.expectedCloseInDays)
        : null;
    const closedAt =
      (d.status === "WON" || d.status === "LOST") && expectedClose
        ? expectedClose
        : null;
    const nextStepAt =
      typeof d.nextStepInDays === "number" ? addDays(new Date(), d.nextStepInDays) : null;
    const stageEnum: "PROSPECT" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" =
      d.stageName === "Prospect"
        ? "PROSPECT"
        : d.stageName === "Qualified"
          ? "QUALIFIED"
          : d.stageName === "Proposal"
            ? "PROPOSAL"
            : d.stageName === "Negotiation"
              ? "NEGOTIATION"
              : d.stageName === "Closed Won"
                ? "CLOSED_WON"
                : "CLOSED_LOST";

    const existing = await db.deal.findFirst({
      where: {
        companyId: company.id,
        pipelineId: pipeline.pipelineId,
        title: d.title,
        deletedAt: null,
      },
    });
    if (existing) {
      await db.deal.update({
        where: { id: existing.id },
        data: {
          stageId,
          stageEnum,
          status: d.status,
          value: d.value,
          probability: d.probability,
          clientId,
          ownerId: ownerUser?.id ?? null,
          ownerEmployeeId: ownerEmp?.id ?? null,
          expectedClose,
          closedAt,
          nextStep: d.nextStep ?? null,
          nextStepAt,
          source: d.source ?? null,
          lostReason: d.lostReason ?? null,
          lostReasonCategory: d.lostReasonCategory ?? null,
          lostCompetitor: d.lostCompetitor ?? null,
          tags: d.tags,
          position: new Prisma.Decimal(pos * 65536),
        },
      });
    } else {
      await db.deal.create({
        data: {
          companyId: company.id,
          pipelineId: pipeline.pipelineId,
          stageId,
          stageEnum,
          title: d.title,
          status: d.status,
          value: d.value,
          probability: d.probability,
          createdById,
          clientId,
          ownerId: ownerUser?.id ?? null,
          ownerEmployeeId: ownerEmp?.id ?? null,
          expectedClose,
          closedAt,
          nextStep: d.nextStep ?? null,
          nextStepAt,
          source: d.source ?? null,
          lostReason: d.lostReason ?? null,
          lostReasonCategory: d.lostReasonCategory ?? null,
          lostCompetitor: d.lostCompetitor ?? null,
          tags: d.tags,
          position: new Prisma.Decimal(pos * 65536),
        },
      });
    }
    count += 1;
  }
  console.log(`  seeded ${count} deals`);
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
