import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Briefcase,
  TicketPercent,
  UserCog,
  CalendarClock,
  ReceiptText,
  Trash2,
  Folder,
  Inbox,
} from "lucide-react";
import { ensureUserRecord } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  subItems?: { href: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
};

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUserRecord();
  if (!user) redirect("/sign-in");

  const viewerEmployee = await db.employee
    .findUnique({ where: { userId: user.id }, select: { id: true } })
    .catch(() => null);

  const [employeeCount, myOpenTasks, projectCount] = await Promise.all([
    db.employee.count({ where: { deletedAt: null } }).catch(() => 0),
    viewerEmployee
      ? db.task
          .count({
            where: {
              deletedAt: null,
              parentId: null,
              assigneeEmployeeId: viewerEmployee.id,
              status: { notIn: ["DONE", "CANCELLED"] },
            },
          })
          .catch(() => 0)
      : Promise.resolve(0),
    db.project.count({ where: { deletedAt: null, status: "ACTIVE" } }).catch(() => 0),
  ]);

  const NAV: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/dashboard/tasks",
      label: "Tasks",
      icon: CheckSquare,
      count: myOpenTasks || undefined,
      subItems: [
        { href: "/dashboard/my-tasks", label: "My tasks", icon: Inbox },
        { href: "/dashboard/projects", label: "Projects", icon: Folder },
      ],
    },
    { href: "/dashboard/clients", label: "Clients", icon: Briefcase },
    { href: "/dashboard/deals", label: "Deals", icon: Users },
    { href: "/dashboard/tickets", label: "Tickets", icon: TicketPercent },
    {
      href: "/dashboard/employees",
      label: "Employees",
      icon: UserCog,
      count: employeeCount,
      subItems: [
        { href: "/dashboard/employees/trash", label: "Terminated", icon: Trash2 },
      ],
    },
    { href: "/dashboard/leaves", label: "Leaves", icon: CalendarClock },
    { href: "/dashboard/invoices", label: "Invoices", icon: ReceiptText },
  ];

  void projectCount;

  return (
    <div className="min-h-screen flex bg-[#0D0D0D] text-[#FAFAFA]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[#1F1F1F] bg-[#0D0D0D]">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-[#1F1F1F]">
          <div className="w-7 h-7 rounded-md bg-[#F59E0B] text-[#0D0D0D] grid place-items-center font-bold text-sm">
            A
          </div>
          <span className="font-semibold tracking-tight">Alpha</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#1F1F1F] text-xs text-[#71717A]">
          <p className="truncate">{user.fullName ?? user.email}</p>
          <p className="text-[10px] uppercase tracking-wider text-[#F59E0B]">{user.role}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#1F1F1F] flex items-center justify-between px-6">
          <div>
            <h1 className="text-sm font-medium text-[#A1A1AA]">Alpha Command Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                variables: { colorPrimary: "#F59E0B" },
                elements: { avatarBox: "w-8 h-8" },
              }}
            />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <div>
      <Link
        href={item.href}
        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#1F1F1F] transition-colors"
      >
        <span className="flex items-center gap-3">
          <Icon className="w-4 h-4" />
          <span>{item.label}</span>
        </span>
        {typeof item.count === "number" ? (
          <span className="inline-flex items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-medium h-5 min-w-5 px-1.5">
            {item.count}
          </span>
        ) : null}
      </Link>
      {item.subItems?.length ? (
        <div className="pl-8 space-y-1 mt-1">
          {item.subItems.map((sub) => {
            const SubIcon = sub.icon;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                className="flex items-center gap-2 px-3 py-1 rounded-md text-xs text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#161616]"
              >
                {SubIcon ? <SubIcon className="w-3 h-3" /> : null}
                {sub.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
