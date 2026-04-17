import {
  PrismaClient,
  CompanyType,
  DepartmentKind,
  UserRole,
  EmployeeStatus,
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
  console.log("✔ seed complete");
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
